import json
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from .base import get_llm, make_log
from ..tools.scrum_tools import design_architecture
from ..graph.state import ScrumState

SYSTEM_PROMPT = """You are a Senior Solutions Architect (AA) on an AI Scrum team.

Your responsibilities:
1. Analyze user stories and design a robust, scalable system architecture
2. Define system components and their interactions
3. Design RESTful API endpoints with methods, paths, and payloads
4. Design database schema with tables, fields, and relationships
5. Choose appropriate tech stack (be specific - frameworks, databases, cloud services)
6. Ensure the architecture supports all user stories and is production-ready
7. Describe the system topology and data flow clearly

Use the design_architecture tool to document the complete architecture.

Think like a seasoned architect: consider scalability, security, performance, and maintainability.
Be specific with technology choices and explain the reasoning behind each decision."""

AA_TOOLS = [design_architecture]


def architect_node(state: ScrumState) -> dict:
    llm = get_llm(AA_TOOLS)
    logs = list(state.get("agent_logs", []))
    logs.append(make_log("AA", "Architect", "DESIGN_START",
                         "Starting system architecture design based on sprint backlog..."))

    sprint_backlog = state.get("sprint_backlog", [])
    stories_summary = json.dumps([{
        "id": s["id"], "title": s["title"], "description": s["description"]
    } for s in sprint_backlog], indent=2)

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"""
Project: {state.get('project_name', 'AI Project')}
Requirement: {state.get('requirement', '')}

Sprint Stories to architect for:
{stories_summary}

Please design a comprehensive system architecture using the design_architecture tool.
Include:
- system_overview: High-level description of the system
- components: List of system components with name, description, technology
- api_endpoints: List of endpoints with method, path, description, request/response
- database_schema: List of tables/collections with fields and types
- tech_stack: List of technologies used
- diagram_description: Text description of how components connect
""")
    ]

    response = llm.invoke(messages)
    messages.append(response)

    architecture = None

    if hasattr(response, 'tool_calls') and response.tool_calls:
        for tool_call in response.tool_calls:
            if tool_call["name"] == "design_architecture":
                result = design_architecture.invoke(tool_call["args"])
                architecture = json.loads(result)
                logs.append(make_log("AA", "Architect", "ARCHITECTURE_DESIGNED",
                                     f"Architecture designed with {len(architecture.get('components', []))} components and {len(architecture.get('api_endpoints', []))} API endpoints",
                                     {"components_count": len(architecture.get("components", [])),
                                      "endpoints_count": len(architecture.get("api_endpoints", []))}))
                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

        final_response = llm.invoke(messages)
        messages.append(final_response)

    logs.append(make_log("AA", "Architect", "COMPLETE",
                         "Architecture design complete. Ready for development!",
                         {"has_architecture": architecture is not None}))

    return {
        "architecture": architecture,
        "current_agent": "developer",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["architect"],
        "messages": messages
    }
