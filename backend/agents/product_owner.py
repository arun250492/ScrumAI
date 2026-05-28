import json
from langchain_core.messages import SystemMessage, HumanMessage
from .base import get_llm, make_log
from ..tools.scrum_tools import create_user_story, prioritize_backlog
from ..graph.state import ScrumState

SYSTEM_PROMPT = """You are an expert Product Owner (PO) in a Scrum team powered by AI.

Your responsibilities:
1. Analyze the business requirement deeply and understand stakeholder needs
2. Break down requirements into clear, actionable user stories with the format: "As a [user], I want [goal] so that [benefit]"
3. Define clear acceptance criteria for each story (min 3 per story)
4. Estimate story points (1, 2, 3, 5, 8, 13) using Fibonacci sequence
5. Prioritize stories as HIGH, MEDIUM, or LOW based on business value
6. Create a coherent product backlog

You MUST use the create_user_story tool to create each story, then use prioritize_backlog to order them.
Create between 3-6 user stories that cover the core requirements.
Be thorough and think like a real Product Owner who cares about delivering maximum business value.

After creating all stories, provide a summary of the product vision and backlog strategy."""

PO_TOOLS = [create_user_story, prioritize_backlog]


def product_owner_node(state: ScrumState) -> dict:
    llm = get_llm(PO_TOOLS)

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"""
Project Requirement:
{state['requirement']}

Project Name: {state.get('project_name', 'New Project')}

Please analyze this requirement and create a comprehensive product backlog with user stories.
Use the create_user_story tool for EACH story, then call prioritize_backlog with all created stories.
""")
    ]

    logs = list(state.get("agent_logs", []))
    logs.append(make_log("PO", "Product Owner", "START", "Analyzing requirements and creating product backlog..."))

    response = llm.invoke(messages)
    messages.append(response)

    user_stories = []

    if hasattr(response, 'tool_calls') and response.tool_calls:
        from langchain_core.messages import ToolMessage
        from ..tools.scrum_tools import create_user_story as cus_fn, prioritize_backlog as pb_fn

        tool_map = {
            "create_user_story": cus_fn,
            "prioritize_backlog": pb_fn
        }

        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            if tool_name in tool_map:
                result = tool_map[tool_name].invoke(tool_args)
                result_data = json.loads(result)

                if tool_name == "create_user_story":
                    user_stories.append(result_data)
                    logs.append(make_log("PO", "Product Owner", "CREATE_STORY",
                                        f"Created story: {result_data['title']}", result_data))

                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

        final_response = llm.invoke(messages)
        messages.append(final_response)

    sprint_backlog = [s for s in user_stories if s.get("priority") in ["HIGH", "MEDIUM"]][:4]
    for s in sprint_backlog:
        s["status"] = "TODO"

    logs.append(make_log("PO", "Product Owner", "COMPLETE",
                         f"Created {len(user_stories)} user stories. {len(sprint_backlog)} selected for Sprint 1.",
                         {"total_stories": len(user_stories), "sprint_stories": len(sprint_backlog)}))

    return {
        "product_backlog": user_stories,
        "sprint_backlog": sprint_backlog,
        "current_agent": "scrum_master",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["product_owner"],
        "messages": messages
    }
