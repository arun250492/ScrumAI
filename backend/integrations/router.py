import base64
import json
from typing import Optional, List
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


# ─── Pydantic models ──────────────────────────────────────────────────────────

class JiraConfig(BaseModel):
    base_url: str
    email: str
    api_token: str
    project_key: str

class AzureDevOpsConfig(BaseModel):
    organization: str
    project: str
    pat: str

class TeamsConfig(BaseModel):
    webhook_url: str

class PushStoriesRequest(BaseModel):
    stories: List[dict]
    sprint_goal: Optional[str] = ""
    project_name: Optional[str] = ""

class TeamsNotifyRequest(BaseModel):
    webhook_url: str
    project_name: str
    sprint_goal: str
    stories_done: int
    stories_total: int
    tests_passed: int
    tests_total: int
    velocity: int
    agent_logs: Optional[List[dict]] = []


# ─── Jira ─────────────────────────────────────────────────────────────────────

def _jira_headers(email: str, token: str) -> dict:
    creds = base64.b64encode(f"{email}:{token}".encode()).decode()
    return {"Authorization": f"Basic {creds}", "Content-Type": "application/json", "Accept": "application/json"}


def _jira_description(text: str) -> dict:
    return {
        "type": "doc", "version": 1,
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}]
    }


@router.post("/jira/test")
async def test_jira(config: JiraConfig):
    url = f"{config.base_url.rstrip('/')}/rest/api/3/myself"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=_jira_headers(config.email, config.api_token))
        if r.status_code == 200:
            data = r.json()
            return {"ok": True, "display_name": data.get("displayName"), "account_id": data.get("accountId")}
        raise HTTPException(status_code=400, detail=f"Jira returned {r.status_code}: {r.text[:200]}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Cannot reach Jira: {e}")


@router.post("/jira/push")
async def push_to_jira(config: JiraConfig, body: PushStoriesRequest):
    base = config.base_url.rstrip("/")
    headers = _jira_headers(config.email, config.api_token)
    created = []

    # Create Epic for the sprint
    async with httpx.AsyncClient(timeout=15) as client:
        epic_payload = {
            "fields": {
                "project": {"key": config.project_key},
                "summary": body.sprint_goal or f"Sprint — {body.project_name}",
                "description": _jira_description(f"AI-generated sprint for {body.project_name}"),
                "issuetype": {"name": "Epic"}
            }
        }
        er = await client.post(f"{base}/rest/api/3/issue", headers=headers, json=epic_payload)
        epic_key = er.json().get("key") if er.status_code in (200, 201) else None

        for story in body.stories:
            priority_map = {"HIGH": "High", "MEDIUM": "Medium", "LOW": "Low"}
            fields = {
                "project": {"key": config.project_key},
                "summary": story.get("title", "Story"),
                "description": _jira_description(
                    story.get("description", "") + "\n\nAcceptance Criteria:\n" +
                    "\n".join(f"• {ac}" for ac in story.get("acceptance_criteria", []))
                ),
                "issuetype": {"name": "Story"},
                "priority": {"name": priority_map.get(story.get("priority", "MEDIUM"), "Medium")},
            }
            if epic_key:
                fields["parent"] = {"key": epic_key}

            r = await client.post(f"{base}/rest/api/3/issue", headers=headers, json={"fields": fields})
            if r.status_code in (200, 201):
                created.append({"story_id": story.get("id"), "jira_key": r.json().get("key"),
                                 "url": f"{base}/browse/{r.json().get('key')}"})

    return {"ok": True, "epic_key": epic_key, "stories_created": created,
            "epic_url": f"{base}/browse/{epic_key}" if epic_key else None}


# ─── Azure DevOps ─────────────────────────────────────────────────────────────

def _ado_headers(pat: str) -> dict:
    creds = base64.b64encode(f":{pat}".encode()).decode()
    return {"Authorization": f"Basic {creds}", "Content-Type": "application/json-patch+json"}


@router.post("/azure/test")
async def test_azure(config: AzureDevOpsConfig):
    url = f"https://dev.azure.com/{config.organization}/_apis/projects/{config.project}?api-version=7.0"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=_ado_headers(config.pat))
        if r.status_code == 200:
            data = r.json()
            return {"ok": True, "project_name": data.get("name"), "state": data.get("state")}
        raise HTTPException(status_code=400, detail=f"Azure DevOps returned {r.status_code}: {r.text[:200]}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Cannot reach Azure DevOps: {e}")


@router.post("/azure/push")
async def push_to_azure(config: AzureDevOpsConfig, body: PushStoriesRequest):
    base = f"https://dev.azure.com/{config.organization}/{config.project}/_apis/wit/workitems"
    headers = _ado_headers(config.pat)
    created = []

    async with httpx.AsyncClient(timeout=15) as client:
        # Create Epic
        epic_ops = [
            {"op": "add", "path": "/fields/System.Title", "value": body.sprint_goal or f"Sprint — {body.project_name}"},
            {"op": "add", "path": "/fields/System.Description", "value": f"AI-generated sprint for {body.project_name}"},
        ]
        er = await client.post(f"{base}/$Epic?api-version=7.0", headers=headers, json=epic_ops)
        epic_id = er.json().get("id") if er.status_code in (200, 201) else None

        for story in body.stories:
            priority_map = {"HIGH": "1", "MEDIUM": "2", "LOW": "3"}
            ac_text = "\n".join(f"✓ {ac}" for ac in story.get("acceptance_criteria", []))
            ops = [
                {"op": "add", "path": "/fields/System.Title", "value": story.get("title", "Story")},
                {"op": "add", "path": "/fields/System.Description",
                 "value": f"{story.get('description','')}<br/><br/><b>Acceptance Criteria:</b><br/>{ac_text}"},
                {"op": "add", "path": "/fields/Microsoft.VSTS.Scheduling.StoryPoints",
                 "value": story.get("story_points", 3)},
                {"op": "add", "path": "/fields/Microsoft.VSTS.Common.Priority",
                 "value": int(priority_map.get(story.get("priority", "MEDIUM"), "2"))},
            ]
            if epic_id:
                ops.append({"op": "add", "path": "/relations/-",
                             "value": {"rel": "System.LinkTypes.Hierarchy-Reverse",
                                       "url": f"https://dev.azure.com/{config.organization}/_apis/wit/workItems/{epic_id}"}})

            r = await client.post(f"{base}/$User Story?api-version=7.0", headers=headers, json=ops)
            if r.status_code in (200, 201):
                item = r.json()
                created.append({"story_id": story.get("id"), "ado_id": item.get("id"),
                                 "url": item.get("_links", {}).get("html", {}).get("href", "")})

    return {"ok": True, "epic_id": epic_id, "stories_created": created}


# ─── Microsoft Teams ──────────────────────────────────────────────────────────

@router.post("/teams/test")
async def test_teams(config: TeamsConfig):
    card = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "7C3AED",
        "summary": "Scrum AI Board — Connection Test",
        "sections": [{"activityTitle": "✅ Connection Successful",
                      "activityText": "Scrum AI Board is connected to this Teams channel.",
                      "markdown": True}]
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(config.webhook_url, json=card)
        if r.status_code in (200, 202):
            return {"ok": True, "message": "Test card sent to Teams"}
        raise HTTPException(status_code=400, detail=f"Teams returned {r.status_code}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Cannot reach Teams webhook: {e}")


@router.post("/teams/notify")
async def notify_teams(body: TeamsNotifyRequest):
    progress_pct = round((body.stories_done / body.stories_total) * 100) if body.stories_total else 0
    test_pct = round((body.tests_passed / body.tests_total) * 100) if body.tests_total else 0

    card = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "7C3AED",
        "summary": f"Sprint Complete — {body.project_name}",
        "sections": [{
            "activityTitle": f"🚀 Sprint Completed — **{body.project_name}**",
            "activitySubtitle": body.sprint_goal,
            "activityText": "AI Scrum Board has completed a full sprint cycle.",
            "facts": [
                {"name": "Stories Delivered", "value": f"{body.stories_done}/{body.stories_total} ({progress_pct}%)"},
                {"name": "Tests Passed", "value": f"{body.tests_passed}/{body.tests_total} ({test_pct}%)"},
                {"name": "Velocity", "value": f"{body.velocity} story points"},
                {"name": "Status", "value": "✅ Ready for Release" if progress_pct == 100 else "🟡 Partially Complete"},
            ],
            "markdown": True
        }],
        "potentialAction": [{
            "@type": "OpenUri",
            "name": "View Sprint Board",
            "targets": [{"os": "default", "uri": "https://scrumai-8h2a.onrender.com"}]
        }]
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(body.webhook_url, json=card)
        return {"ok": True, "status_code": r.status_code}
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=str(e))
