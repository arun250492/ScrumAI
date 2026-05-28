from langchain_core.messages import SystemMessage, HumanMessage
from .base import get_llm, stream_llm, parse_json, make_log, broadcast_agent_status
from ..graph.state import ScrumState

SYSTEM = """You are a Product Owner. Return ONLY valid JSON — no markdown, no explanation.
Be concise and practical. Think startup-speed."""

TEMPLATE = """Project: {name}
Requirement: {req}

Return this exact JSON (no extra keys):
{{
  "sprint_goal": "one-line sprint goal",
  "stories": [
    {{
      "id": "US-001",
      "title": "short title",
      "description": "As a [user] I want [goal] so that [benefit]",
      "acceptance_criteria": ["criterion 1", "criterion 2", "criterion 3"],
      "priority": "HIGH",
      "story_points": 5,
      "status": "TODO",
      "assigned_to": "unassigned"
    }}
  ]
}}

Create 4 user stories. Priority: HIGH/MEDIUM/LOW. Story points: 1,2,3,5,8."""


async def product_owner_node(state: ScrumState) -> dict:
    sid = state.get("session_id", "")
    logs = list(state.get("agent_logs", []))

    await broadcast_agent_status(sid, "PO", "Product Owner", "ACTIVE",
                                 "Analyzing requirements and writing user stories...")
    logs.append(make_log("PO", "Product Owner", "START", "Analyzing requirements and writing user stories..."))

    llm = get_llm("gpt-4o-mini", max_tokens=2000)
    messages = [
        SystemMessage(content=SYSTEM),
        HumanMessage(content=TEMPLATE.format(name=state.get("project_name", "Project"),
                                              req=state.get("requirement", "")))
    ]

    content = await stream_llm(llm, messages, sid, "PO")
    data = parse_json(content)

    stories = data.get("stories", [])
    for i, s in enumerate(stories):
        s.setdefault("id", f"US-{i+1:03d}")
        s.setdefault("assigned_to", "unassigned")
        s.setdefault("status", "TODO")
        s.setdefault("story_points", 3)
        s.setdefault("priority", "MEDIUM")
        s.setdefault("acceptance_criteria", ["Feature works as expected"])

    sprint_backlog = [s for s in stories if s.get("priority") in ["HIGH", "MEDIUM"]][:4]
    for s in sprint_backlog:
        s["status"] = "TODO"

    for s in stories:
        logs.append(make_log("PO", "Product Owner", "CREATE_STORY",
                             f"📝 {s['title']} [{s['priority']} / {s['story_points']}pt]", s))

    logs.append(make_log("PO", "Product Owner", "COMPLETE",
                         f"✅ {len(stories)} stories created. {len(sprint_backlog)} queued for sprint.",
                         {"total": len(stories), "sprint": len(sprint_backlog)}))

    await broadcast_agent_status(sid, "PO", "Product Owner", "DONE",
                                 f"✅ {len(stories)} user stories created")

    return {
        "product_backlog": stories,
        "sprint_backlog": sprint_backlog,
        "sprint_goal": data.get("sprint_goal", f"Deliver core features for {state.get('project_name')}"),
        "current_agent": "scrum_master",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["product_owner"],
        "messages": [HumanMessage(content=f"PO: {len(stories)} stories created")]
    }
