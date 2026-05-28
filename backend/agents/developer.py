import json
from langchain_core.messages import SystemMessage, HumanMessage
from .base import get_llm, stream_llm, parse_json, make_log, broadcast_agent_status
from ..graph.state import ScrumState

SYSTEM = """You are a Senior Full-Stack Developer. Write production-ready code.
Return ONLY valid JSON — no markdown fences around the JSON itself."""

TEMPLATE = """Project: {name}
Tech Stack: {stack}
System Overview: {overview}

Stories to implement:
{stories}

{bug_context}

Return JSON:
{{
  "code_artifacts": [
    {{
      "id": "CODE-001",
      "story_id": "US-001",
      "filename": "backend/main.py",
      "language": "python",
      "description": "FastAPI main application",
      "content": "# actual code here\\nimport fastapi\\n..."
    }},
    {{
      "id": "CODE-002",
      "story_id": "US-001",
      "filename": "frontend/src/App.jsx",
      "language": "javascript",
      "description": "React main component",
      "content": "import React from 'react'\\n..."
    }},
    {{
      "id": "CODE-003",
      "story_id": "US-002",
      "filename": "backend/models.py",
      "language": "python",
      "description": "Database models",
      "content": "from sqlalchemy import...\\n..."
    }}
  ],
  "implementation_notes": "brief summary of implementation decisions"
}}

Write real, working code — at least 3 files covering backend + frontend + models."""


async def developer_node(state: ScrumState) -> dict:
    sid = state.get("session_id", "")
    logs = list(state.get("agent_logs", []))
    qa_iter = state.get("qa_iterations", 0)

    if qa_iter > 0:
        action = f"Fixing QA-reported bugs (iteration {qa_iter})..."
    else:
        action = "Writing production code for all sprint stories..."

    await broadcast_agent_status(sid, "Dev", "Developer", "ACTIVE", action)
    logs.append(make_log("Dev", "Developer", "IMPLEMENT_START", action))

    arch = state.get("architecture") or {}
    failed = [t for t in state.get("test_results", []) if t.get("status") == "FAIL"]
    bug_context = ""
    if failed:
        bug_context = f"BUGS TO FIX:\n{json.dumps(failed, indent=2)}"

    stories = state.get("sprint_backlog", [])
    stories_txt = json.dumps([{"id": s["id"], "title": s["title"],
                               "description": s.get("description", ""),
                               "acceptance_criteria": s.get("acceptance_criteria", [])}
                              for s in stories], indent=2)

    # Use gpt-4o for developer to get quality code
    llm = get_llm("gpt-4o", max_tokens=4000)
    messages = [
        SystemMessage(content=SYSTEM),
        HumanMessage(content=TEMPLATE.format(
            name=state.get("project_name", "Project"),
            stack=", ".join(arch.get("tech_stack", ["Python", "React"])),
            overview=arch.get("system_overview", "Full-stack web application")[:300],
            stories=stories_txt,
            bug_context=bug_context
        ))
    ]

    content = await stream_llm(llm, messages, sid, "Dev")
    data = parse_json(content)

    artifacts = data.get("code_artifacts", [])
    if not artifacts:
        artifacts = [{"id": "CODE-001", "story_id": stories[0]["id"] if stories else "US-001",
                      "filename": "app/main.py", "language": "python",
                      "description": "Main application", "content": "# Implementation\n"}]

    updated_backlog = []
    for s in state.get("sprint_backlog", []):
        s = dict(s)
        s["status"] = "DONE"
        updated_backlog.append(s)

    for art in artifacts:
        logs.append(make_log("Dev", "Developer", "CODE_WRITTEN",
                             f"💾 {art.get('filename')} ({art.get('language')})",
                             {"filename": art.get("filename"), "language": art.get("language")}))

    logs.append(make_log("Dev", "Developer", "COMPLETE",
                         f"✅ {len(artifacts)} files written. All stories implemented.",
                         {"files": len(artifacts), "notes": data.get("implementation_notes", "")}))

    await broadcast_agent_status(sid, "Dev", "Developer", "DONE",
                                 f"✅ {len(artifacts)} code files written")

    existing = list(state.get("code_artifacts", []))
    existing.extend(artifacts)

    return {
        "code_artifacts": existing,
        "sprint_backlog": updated_backlog,
        "current_agent": "qa",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["developer"],
        "messages": [HumanMessage(content=f"Dev: {len(artifacts)} files implemented")]
    }
