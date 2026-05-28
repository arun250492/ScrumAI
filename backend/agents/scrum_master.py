import json
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from .base import get_llm, make_log
from ..tools.scrum_tools import create_sprint, update_story_status, create_sprint_report
from ..graph.state import ScrumState

PLAN_SYSTEM_PROMPT = """You are an expert Scrum Master (SM) running a high-performing AI Scrum team.

Sprint Planning responsibilities:
1. Review the product backlog from the Product Owner
2. Facilitate sprint planning - select the right stories for the sprint
3. Set a clear, achievable sprint goal
4. Calculate sprint capacity and verify story point commitment
5. Assign stories to team members (Architect, Developer, QA, Documentation)
6. Ensure everyone understands their tasks

Use the create_sprint tool to formalize the sprint.
Then use update_story_status to assign each story to the appropriate team member.

Be decisive, energetic, and make sure the team is set up for success!"""

REVIEW_SYSTEM_PROMPT = """You are an expert Scrum Master conducting a Sprint Review.

Sprint Review responsibilities:
1. Review all completed work from the sprint
2. Assess QA test results and overall quality
3. Calculate team velocity
4. Identify blockers encountered and how they were resolved
5. Facilitate retrospective (What went well? What to improve? Action items?)
6. Present the sprint summary to stakeholders

Use the create_sprint_report tool to generate the official sprint report.
Be thorough, data-driven, and forward-looking!"""

SM_PLAN_TOOLS = [create_sprint, update_story_status]
SM_REVIEW_TOOLS = [create_sprint_report]


def scrum_master_plan_node(state: ScrumState) -> dict:
    llm = get_llm(SM_PLAN_TOOLS)
    logs = list(state.get("agent_logs", []))
    logs.append(make_log("SM", "Scrum Master", "SPRINT_PLANNING", "Initiating Sprint Planning session..."))

    sprint_backlog = state.get("sprint_backlog", [])
    stories_summary = json.dumps([{
        "id": s["id"], "title": s["title"],
        "priority": s["priority"], "story_points": s["story_points"]
    } for s in sprint_backlog], indent=2)

    messages = [
        SystemMessage(content=PLAN_SYSTEM_PROMPT),
        HumanMessage(content=f"""
Sprint Backlog from Product Owner:
{stories_summary}

Project: {state.get('project_name', 'AI Project')}
Sprint Number: {state.get('current_sprint', 1)}

Please:
1. Create Sprint {state.get('current_sprint', 1)} using create_sprint tool
2. Update each story status using update_story_status tool - assign to: Architect, Developer, QA or Documentation Agent as appropriate
3. Provide sprint kickoff message to the team
""")
    ]

    response = llm.invoke(messages)
    messages.append(response)

    sprint_goal = f"Deliver core features for {state.get('project_name', 'the project')}"

    if hasattr(response, 'tool_calls') and response.tool_calls:
        tool_map = {
            "create_sprint": create_sprint,
            "update_story_status": update_story_status
        }
        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            if tool_name in tool_map:
                result = tool_map[tool_name].invoke(tool_call["args"])
                result_data = json.loads(result)
                if tool_name == "create_sprint":
                    sprint_goal = result_data.get("goal", sprint_goal)
                    logs.append(make_log("SM", "Scrum Master", "CREATE_SPRINT",
                                        f"Sprint {result_data.get('sprint_number', 1)} created with goal: {sprint_goal}",
                                        result_data))
                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

        final_response = llm.invoke(messages)
        messages.append(final_response)

    logs.append(make_log("SM", "Scrum Master", "SPRINT_START",
                         f"Sprint {state.get('current_sprint', 1)} started! Team is ready to execute.",
                         {"sprint_goal": sprint_goal, "stories_count": len(sprint_backlog)}))

    return {
        "sprint_goal": sprint_goal,
        "sprint_status": "IN_PROGRESS",
        "current_agent": "architect",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["scrum_master_plan"],
        "messages": messages
    }


def scrum_master_review_node(state: ScrumState) -> dict:
    llm = get_llm(SM_REVIEW_TOOLS)
    logs = list(state.get("agent_logs", []))
    logs.append(make_log("SM", "Scrum Master", "SPRINT_REVIEW", "Conducting Sprint Review and Retrospective..."))

    completed = [s for s in state.get("sprint_backlog", []) if s.get("status") == "DONE"]
    test_results = state.get("test_results", [])
    passed = sum(1 for t in test_results if t.get("status") == "PASS")

    messages = [
        SystemMessage(content=REVIEW_SYSTEM_PROMPT),
        HumanMessage(content=f"""
Sprint {state.get('current_sprint', 1)} Summary:
- Sprint Goal: {state.get('sprint_goal', 'N/A')}
- Stories Completed: {len(completed)}/{len(state.get('sprint_backlog', []))}
- Tests Passed: {passed}/{len(test_results)}
- QA Iterations: {state.get('qa_iterations', 1)}
- Documentation: {'Complete' if state.get('documentation') else 'Pending'}

Please use create_sprint_report to generate the official report with retrospective insights.
""")
    ]

    response = llm.invoke(messages)
    messages.append(response)

    sprint_notes = f"Sprint {state.get('current_sprint', 1)} completed. {len(completed)} stories done, {passed} tests passed."

    if hasattr(response, 'tool_calls') and response.tool_calls:
        for tool_call in response.tool_calls:
            if tool_call["name"] == "create_sprint_report":
                result = create_sprint_report.invoke(tool_call["args"])
                result_data = json.loads(result)
                sprint_notes = json.dumps(result_data, indent=2)
                logs.append(make_log("SM", "Scrum Master", "SPRINT_REPORT",
                                     "Sprint report generated successfully!", result_data))
                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

        final_response = llm.invoke(messages)
        messages.append(final_response)

    logs.append(make_log("SM", "Scrum Master", "SPRINT_COMPLETE",
                         f"Sprint {state.get('current_sprint', 1)} COMPLETED! Great work, team!",
                         {"velocity": sum(s.get("story_points", 0) for s in completed)}))

    return {
        "sprint_status": "DONE",
        "sprint_notes": sprint_notes,
        "workflow_complete": True,
        "current_agent": "complete",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["scrum_master_review"],
        "messages": messages
    }
