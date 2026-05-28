import json
from langchain_core.messages import SystemMessage, HumanMessage
from .base import get_llm, stream_llm, parse_json, make_log, broadcast_agent_status
from ..graph.state import ScrumState

SYSTEM = "You are a Technical Writer. Return ONLY valid JSON."

TEMPLATE = """Project: {name} — Sprint {sprint} Documentation

Tech Stack: {stack}
API Endpoints: {endpoints}
Features Delivered: {features}
Tests: {tests} passed

Return JSON:
{{
  "api_documentation": "# API Reference\\n\\n## Authentication\\n...",
  "release_notes": "# v1.{sprint}.0 Release Notes\\n\\n## New Features\\n- ...",
  "architecture_summary": "## Architecture Overview\\n\\n...",
  "onboarding_guide": "## Getting Started\\n\\n..."
}}

Write real markdown content in each field. Be thorough but concise."""


async def documentation_node(state: ScrumState) -> dict:
    sid = state.get("session_id", "")
    logs = list(state.get("agent_logs", []))

    await broadcast_agent_status(sid, "Doc", "Doc Engineer", "ACTIVE",
                                 "Writing API docs, release notes and onboarding guide...")
    logs.append(make_log("Doc", "Documentation", "DOC_START",
                         "Writing API docs, release notes and onboarding guide..."))

    arch = state.get("architecture") or {}
    stories = [s["title"] for s in state.get("sprint_backlog", []) if s.get("status") == "DONE"]
    tests = state.get("test_results", [])
    passed = sum(1 for t in tests if t.get("status") == "PASS")
    endpoints = json.dumps([f"{e.get('method')} {e.get('path')}"
                            for e in arch.get("api_endpoints", [])[:6]])

    llm = get_llm("gpt-4o-mini", max_tokens=2500)
    messages = [
        SystemMessage(content=SYSTEM),
        HumanMessage(content=TEMPLATE.format(
            name=state.get("project_name", "Project"),
            sprint=state.get("current_sprint", 1),
            stack=", ".join(arch.get("tech_stack", ["Python", "React"])),
            endpoints=endpoints,
            features=json.dumps(stories),
            tests=passed
        ))
    ]

    content = await stream_llm(llm, messages, sid, "Doc")
    data = parse_json(content)

    sections = ["api_documentation", "release_notes", "architecture_summary", "onboarding_guide"]
    full_doc = "\n\n---\n\n".join(data.get(s, "") for s in sections if data.get(s))

    for section in sections:
        if data.get(section):
            logs.append(make_log("Doc", "Documentation", "DOC_CREATED",
                                 f"📄 {section.replace('_', ' ').title()} written"))

    logs.append(make_log("Doc", "Documentation", "DOC_COMPLETE",
                         "✅ All documentation created and ready for stakeholders."))

    await broadcast_agent_status(sid, "Doc", "Doc Engineer", "DONE",
                                 "✅ API docs, release notes & onboarding guide complete")

    return {
        "documentation": full_doc,
        "release_notes": data.get("release_notes", ""),
        "current_agent": "scrum_master_review",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["documentation"],
        "messages": [HumanMessage(content="Documentation complete.")]
    }
