import json
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from .base import get_llm, make_log
from ..tools.scrum_tools import write_code, update_story_status
from ..graph.state import ScrumState

SYSTEM_PROMPT = """You are a Senior Full-Stack Developer (Dev) on an AI Scrum team.

Your responsibilities:
1. Implement features based on user stories and architecture specifications
2. Write clean, production-ready, well-structured code
3. Follow the defined tech stack and architectural patterns
4. Implement both backend (APIs, business logic, database) and frontend (UI components)
5. Handle edge cases and implement proper error handling
6. If there are QA bugs to fix, address them thoroughly

Use the write_code tool for EACH code file you create.
Use update_story_status to mark stories as IN_PROGRESS and then DONE.

Write real, working code - not pseudocode or placeholders.
Be thorough - include actual implementation, not just stubs."""

DEV_TOOLS = [write_code, update_story_status]


def developer_node(state: ScrumState) -> dict:
    llm = get_llm(DEV_TOOLS)
    logs = list(state.get("agent_logs", []))
    qa_iterations = state.get("qa_iterations", 0)

    if qa_iterations > 0:
        action_msg = "Fixing QA-reported bugs and improving code quality..."
        action = "BUG_FIX"
    else:
        action_msg = "Starting implementation of sprint stories..."
        action = "IMPLEMENT_START"

    logs.append(make_log("Dev", "Developer", action, action_msg))

    sprint_backlog = state.get("sprint_backlog", [])
    architecture = state.get("architecture", {})
    test_results = state.get("test_results", [])
    failed_tests = [t for t in test_results if t.get("status") == "FAIL"]

    arch_summary = ""
    if architecture:
        arch_summary = f"""
Tech Stack: {', '.join(architecture.get('tech_stack', []))}
System Overview: {architecture.get('system_overview', 'N/A')}
Key API Endpoints: {json.dumps(architecture.get('api_endpoints', [])[:3], indent=2)}
Database Schema: {json.dumps(architecture.get('database_schema', [])[:3], indent=2)}
"""

    bug_context = ""
    if failed_tests:
        bug_context = f"""
BUGS TO FIX (from QA):
{json.dumps(failed_tests, indent=2)}

Address each bug specifically in your code fixes.
"""

    stories_to_implement = json.dumps([{
        "id": s["id"], "title": s["title"],
        "description": s["description"],
        "acceptance_criteria": s.get("acceptance_criteria", [])
    } for s in sprint_backlog], indent=2)

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"""
Project: {state.get('project_name', 'AI Project')}
Requirement: {state.get('requirement', '')}

Architecture Context:
{arch_summary}

User Stories to Implement:
{stories_to_implement}

{bug_context}

Please implement the code using write_code tool for each file.
Create at least 2-3 code files covering:
1. Main backend/API implementation
2. Data models or database layer
3. Frontend component or CLI interface

Then use update_story_status to mark each story as DONE.
""")
    ]

    response = llm.invoke(messages)
    messages.append(response)

    code_artifacts = list(state.get("code_artifacts", []))
    updated_backlog = list(sprint_backlog)

    if hasattr(response, 'tool_calls') and response.tool_calls:
        tool_map = {
            "write_code": write_code,
            "update_story_status": update_story_status
        }
        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            if tool_name in tool_map:
                result = tool_map[tool_name].invoke(tool_call["args"])
                result_data = json.loads(result)

                if tool_name == "write_code":
                    code_artifacts.append(result_data)
                    logs.append(make_log("Dev", "Developer", "CODE_WRITTEN",
                                        f"Written: {result_data.get('filename', 'file')} ({result_data.get('language', 'code')})",
                                        {"filename": result_data.get("filename"), "language": result_data.get("language")}))

                elif tool_name == "update_story_status":
                    story_id = result_data.get("story_id")
                    for story in updated_backlog:
                        if story["id"] == story_id:
                            story["status"] = result_data.get("new_status", story["status"])

                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

        final_response = llm.invoke(messages)
        messages.append(final_response)

    for story in updated_backlog:
        if story["status"] == "TODO":
            story["status"] = "DONE"

    logs.append(make_log("Dev", "Developer", "COMPLETE",
                         f"Implementation complete! {len(code_artifacts)} files written.",
                         {"files_count": len(code_artifacts)}))

    return {
        "code_artifacts": code_artifacts,
        "sprint_backlog": updated_backlog,
        "current_agent": "qa",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["developer"],
        "messages": messages
    }
