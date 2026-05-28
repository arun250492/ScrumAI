import json
from langchain_core.messages import SystemMessage, HumanMessage
from .base import get_llm, stream_llm, parse_json, make_log, broadcast_agent_status
from ..graph.state import ScrumState

PLAN_SYSTEM = "You are a Scrum Master. Return ONLY valid JSON."

PLAN_TEMPLATE = """Sprint {sprint} Planning for: {name}

Stories:
{stories}

Return JSON:
{{
  "sprint_goal": "clear sprint goal",
  "assignments": [
    {{"story_id": "US-001", "assigned_to": "Developer", "status": "TODO"}}
  ],
  "capacity_points": 20,
  "kickoff_message": "motivating team kickoff message"
}}"""

REVIEW_SYSTEM = "You are a Scrum Master doing sprint review. Return ONLY valid JSON."

REVIEW_TEMPLATE = """Sprint {sprint} Review:
- Stories completed: {done}/{total}
- Tests passed: {passed}/{tests}
- QA iterations: {qa_iter}

Return JSON:
{{
  "velocity": {points},
  "went_well": ["item1", "item2"],
  "improve": ["item1"],
  "action_items": ["item1"],
  "summary": "sprint summary paragraph"
}}"""


async def scrum_master_plan_node(state: ScrumState) -> dict:
    sid = state.get("session_id", "")
    logs = list(state.get("agent_logs", []))

    await broadcast_agent_status(sid, "SM", "Scrum Master", "ACTIVE", "Running sprint planning session...")
    logs.append(make_log("SM", "Scrum Master", "SPRINT_PLANNING", "Running sprint planning session..."))

    stories = state.get("sprint_backlog", [])
    stories_txt = json.dumps([{"id": s["id"], "title": s["title"], "points": s.get("story_points", 3),
                               "priority": s.get("priority")} for s in stories], indent=2)

    llm = get_llm("gpt-4o-mini", max_tokens=1000)
    messages = [
        SystemMessage(content=PLAN_SYSTEM),
        HumanMessage(content=PLAN_TEMPLATE.format(
            sprint=state.get("current_sprint", 1),
            name=state.get("project_name", "Project"),
            stories=stories_txt
        ))
    ]

    content = await stream_llm(llm, messages, sid, "SM")
    data = parse_json(content)

    sprint_goal = data.get("sprint_goal", state.get("sprint_goal", "Deliver core features"))
    kickoff = data.get("kickoff_message", "Sprint is live! Let's build something amazing.")

    logs.append(make_log("SM", "Scrum Master", "SPRINT_START",
                         f"🚀 {kickoff}",
                         {"sprint_goal": sprint_goal, "capacity": data.get("capacity_points", 20)}))

    await broadcast_agent_status(sid, "SM", "Scrum Master", "DONE",
                                 f"✅ Sprint {state.get('current_sprint', 1)} kicked off")

    return {
        "sprint_goal": sprint_goal,
        "sprint_status": "IN_PROGRESS",
        "current_agent": "architect",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["scrum_master_plan"],
        "messages": [HumanMessage(content=f"SM: Sprint {state.get('current_sprint',1)} started. Goal: {sprint_goal}")]
    }


async def scrum_master_review_node(state: ScrumState) -> dict:
    sid = state.get("session_id", "")
    logs = list(state.get("agent_logs", []))

    await broadcast_agent_status(sid, "SM", "Scrum Master", "ACTIVE", "Conducting sprint review & retrospective...")
    logs.append(make_log("SM", "Scrum Master", "SPRINT_REVIEW", "Conducting sprint review & retrospective..."))

    completed = [s for s in state.get("sprint_backlog", []) if s.get("status") == "DONE"]
    test_results = state.get("test_results", [])
    passed = sum(1 for t in test_results if t.get("status") == "PASS")
    total_pts = sum(s.get("story_points", 0) for s in completed)

    llm = get_llm("gpt-4o-mini", max_tokens=800)
    messages = [
        SystemMessage(content=REVIEW_SYSTEM),
        HumanMessage(content=REVIEW_TEMPLATE.format(
            sprint=state.get("current_sprint", 1),
            done=len(completed), total=len(state.get("sprint_backlog", [])),
            passed=passed, tests=len(test_results),
            qa_iter=state.get("qa_iterations", 1),
            points=total_pts
        ))
    ]

    content = await stream_llm(llm, messages, sid, "SM")
    data = parse_json(content)

    summary = data.get("summary", f"Sprint {state.get('current_sprint',1)} completed with {len(completed)} stories.")
    logs.append(make_log("SM", "Scrum Master", "SPRINT_COMPLETE",
                         f"🏆 {summary}",
                         {"velocity": data.get("velocity", total_pts), "went_well": data.get("went_well", [])}))

    await broadcast_agent_status(sid, "SM", "Scrum Master", "DONE",
                                 f"🏆 Sprint complete! Velocity: {data.get('velocity', total_pts)} pts")

    return {
        "sprint_status": "DONE",
        "sprint_notes": json.dumps(data, indent=2),
        "workflow_complete": True,
        "current_agent": "complete",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["scrum_master_review"],
        "messages": [HumanMessage(content="Sprint review complete.")]
    }
