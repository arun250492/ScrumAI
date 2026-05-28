import json
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from .base import get_llm, make_log
from ..tools.scrum_tools import create_documentation
from ..graph.state import ScrumState

SYSTEM_PROMPT = """You are a Technical Documentation Engineer on an AI Scrum team.

Your responsibilities:
1. Create comprehensive API documentation (endpoints, request/response formats, auth)
2. Write clear sprint release notes highlighting new features
3. Document the architecture and system design decisions
4. Create a developer onboarding guide
5. Ensure documentation is clear enough for both technical and non-technical readers

Use the create_documentation tool for EACH document type.
Create at least 2 documents:
1. API & Technical Documentation
2. Sprint Release Notes

Make documentation professional, complete, and genuinely useful.
Include examples, code snippets, and clear explanations."""

DOC_TOOLS = [create_documentation]


def documentation_node(state: ScrumState) -> dict:
    llm = get_llm(DOC_TOOLS)
    logs = list(state.get("agent_logs", []))
    logs.append(make_log("Doc", "Documentation", "DOC_START",
                         "Creating comprehensive project documentation..."))

    architecture = state.get("architecture", {})
    sprint_backlog = state.get("sprint_backlog", [])
    code_artifacts = state.get("code_artifacts", [])
    test_results = state.get("test_results", [])

    arch_info = json.dumps({
        "tech_stack": architecture.get("tech_stack", []),
        "api_endpoints": architecture.get("api_endpoints", []),
        "database_schema": architecture.get("database_schema", []),
        "system_overview": architecture.get("system_overview", "")
    }, indent=2) if architecture else "No architecture documented"

    stories_completed = [s["title"] for s in sprint_backlog if s.get("status") == "DONE"]
    test_summary = f"Tests: {sum(1 for t in test_results if t.get('status') == 'PASS')}/{len(test_results)} passed"

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"""
Project: {state.get('project_name', 'AI Project')}
Sprint {state.get('current_sprint', 1)} - Documentation Phase

Architecture:
{arch_info}

Completed Features:
{json.dumps(stories_completed, indent=2)}

Code Files Created:
{json.dumps([c.get('filename') for c in code_artifacts], indent=2)}

QA Summary: {test_summary}

Please create:
1. API & Technical Documentation using create_documentation tool (doc_type: "API_DOCS")
2. Sprint Release Notes using create_documentation tool (doc_type: "RELEASE_NOTES")

Make them professional, complete, and ready for distribution to stakeholders.
""")
    ]

    response = llm.invoke(messages)
    messages.append(response)

    all_docs = []
    release_notes = ""

    if hasattr(response, 'tool_calls') and response.tool_calls:
        for tool_call in response.tool_calls:
            if tool_call["name"] == "create_documentation":
                result = create_documentation.invoke(tool_call["args"])
                result_data = json.loads(result)
                all_docs.append(result_data)

                doc_type = result_data.get("doc_type", "")
                if "RELEASE" in doc_type.upper():
                    release_notes = result_data.get("content", "")

                logs.append(make_log("Doc", "Documentation", "DOC_CREATED",
                                     f"Created: {result_data.get('title', doc_type)}",
                                     {"doc_type": doc_type, "title": result_data.get("title")}))
                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

        final_response = llm.invoke(messages)
        messages.append(final_response)

    full_documentation = "\n\n---\n\n".join([
        f"# {d.get('title', 'Document')}\n\n{d.get('content', '')}"
        for d in all_docs
    ]) if all_docs else f"# {state.get('project_name', 'Project')} Documentation\n\nDocumentation for Sprint {state.get('current_sprint', 1)}."

    logs.append(make_log("Doc", "Documentation", "DOC_COMPLETE",
                         f"Created {len(all_docs)} documentation artifacts. Project docs are ready!",
                         {"docs_count": len(all_docs)}))

    return {
        "documentation": full_documentation,
        "release_notes": release_notes,
        "current_agent": "scrum_master_review",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["documentation"],
        "messages": messages
    }
