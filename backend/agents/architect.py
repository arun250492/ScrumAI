import json
from langchain_core.messages import SystemMessage, HumanMessage
from .base import get_llm, stream_llm, parse_json, make_log, broadcast_agent_status
from ..graph.state import ScrumState

SYSTEM = "You are a Solutions Architect. Return ONLY valid JSON, no markdown."

TEMPLATE = """Project: {name}
Requirement: {req}
Stories: {stories}

Return JSON:
{{
  "system_overview": "2-3 sentence architecture overview",
  "tech_stack": ["React", "FastAPI", "PostgreSQL", "Redis"],
  "components": [
    {{"name": "Frontend", "technology": "React 18 + Tailwind", "description": "SPA with real-time updates"}},
    {{"name": "Backend API", "technology": "FastAPI + Python", "description": "REST API + WebSocket server"}},
    {{"name": "Database", "technology": "PostgreSQL", "description": "Primary data store"}}
  ],
  "api_endpoints": [
    {{"method": "POST", "path": "/api/auth/login", "description": "User authentication"}},
    {{"method": "GET", "path": "/api/items", "description": "List all items"}},
    {{"method": "POST", "path": "/api/items", "description": "Create item"}},
    {{"method": "PUT", "path": "/api/items/{{id}}", "description": "Update item"}},
    {{"method": "DELETE", "path": "/api/items/{{id}}", "description": "Delete item"}}
  ],
  "database_schema": [
    {{
      "name": "users",
      "fields": [
        {{"name": "id", "type": "UUID PRIMARY KEY"}},
        {{"name": "email", "type": "VARCHAR(255) UNIQUE"}},
        {{"name": "created_at", "type": "TIMESTAMP"}}
      ]
    }}
  ],
  "diagram_description": "Client → API Gateway → FastAPI → PostgreSQL. WebSocket for real-time."
}}"""


async def architect_node(state: ScrumState) -> dict:
    sid = state.get("session_id", "")
    logs = list(state.get("agent_logs", []))

    await broadcast_agent_status(sid, "AA", "Architect", "ACTIVE",
                                 "Designing system architecture, APIs and database schema...")
    logs.append(make_log("AA", "Architect", "DESIGN_START",
                         "Designing system architecture, APIs and database schema..."))

    stories = state.get("sprint_backlog", [])
    stories_txt = json.dumps([s["title"] for s in stories])

    llm = get_llm("gpt-4o-mini", max_tokens=2500)
    messages = [
        SystemMessage(content=SYSTEM),
        HumanMessage(content=TEMPLATE.format(
            name=state.get("project_name", "Project"),
            req=state.get("requirement", "")[:500],
            stories=stories_txt
        ))
    ]

    content = await stream_llm(llm, messages, sid, "AA")
    architecture = parse_json(content)

    n_comp = len(architecture.get("components", []))
    n_ep = len(architecture.get("api_endpoints", []))

    logs.append(make_log("AA", "Architect", "ARCHITECTURE_DESIGNED",
                         f"🏛️ {n_comp} components, {n_ep} API endpoints, "
                         f"{len(architecture.get('database_schema', []))} DB tables",
                         {"components": n_comp, "endpoints": n_ep}))

    await broadcast_agent_status(sid, "AA", "Architect", "DONE",
                                 f"✅ Architecture ready: {n_comp} components, {n_ep} endpoints")

    return {
        "architecture": architecture,
        "current_agent": "developer",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["architect"],
        "messages": [HumanMessage(content=f"AA: Architecture designed with {n_comp} components")]
    }
