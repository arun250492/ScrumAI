import json
import uuid
from datetime import datetime
from langchain_core.tools import tool


@tool
def create_user_story(title: str, description: str, acceptance_criteria: list, priority: str, story_points: int) -> str:
    """Create a new user story with acceptance criteria and priority."""
    story = {
        "id": f"US-{str(uuid.uuid4())[:8].upper()}",
        "title": title,
        "description": description,
        "acceptance_criteria": acceptance_criteria,
        "priority": priority,
        "story_points": story_points,
        "status": "BACKLOG",
        "assigned_to": "unassigned"
    }
    return json.dumps(story)


@tool
def prioritize_backlog(stories: list, criteria: str) -> str:
    """Prioritize the product backlog based on business value criteria."""
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    sorted_stories = sorted(stories, key=lambda x: priority_order.get(x.get("priority", "LOW"), 2))
    return json.dumps({"prioritized_backlog": sorted_stories, "criteria": criteria})


@tool
def create_sprint(sprint_number: int, goal: str, story_ids: list, capacity_points: int) -> str:
    """Create a new sprint with a goal and selected stories."""
    sprint = {
        "sprint_number": sprint_number,
        "goal": goal,
        "story_ids": story_ids,
        "capacity_points": capacity_points,
        "status": "PLANNING",
        "start_date": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat()
    }
    return json.dumps(sprint)


@tool
def update_story_status(story_id: str, new_status: str, assigned_to: str) -> str:
    """Update a user story's status and assignment."""
    return json.dumps({
        "story_id": story_id,
        "new_status": new_status,
        "assigned_to": assigned_to,
        "updated_at": datetime.now().isoformat()
    })


@tool
def design_architecture(system_overview: str, components: list, api_endpoints: list, database_schema: list, tech_stack: list, diagram_description: str) -> str:
    """Design and document the system architecture."""
    arch = {
        "system_overview": system_overview,
        "components": components,
        "api_endpoints": api_endpoints,
        "database_schema": database_schema,
        "tech_stack": tech_stack,
        "diagram_description": diagram_description,
        "created_at": datetime.now().isoformat()
    }
    return json.dumps(arch)


@tool
def write_code(story_id: str, filename: str, language: str, content: str, description: str) -> str:
    """Write production-ready code for a user story."""
    artifact = {
        "id": f"CODE-{str(uuid.uuid4())[:8].upper()}",
        "story_id": story_id,
        "filename": filename,
        "language": language,
        "content": content,
        "description": description,
        "created_at": datetime.now().isoformat()
    }
    return json.dumps(artifact)


@tool
def create_test_case(story_id: str, test_name: str, test_description: str, expected_behavior: str) -> str:
    """Create a test case for a user story feature."""
    test = {
        "id": f"TC-{str(uuid.uuid4())[:8].upper()}",
        "story_id": story_id,
        "test_name": test_name,
        "description": test_description,
        "expected_behavior": expected_behavior,
        "status": "PENDING",
        "created_at": datetime.now().isoformat()
    }
    return json.dumps(test)


@tool
def run_tests(test_cases: list, code_artifacts: list) -> str:
    """Run test cases against code artifacts and return results."""
    results = []
    all_passed = True
    for test in test_cases:
        passed = True
        bug_report = None
        results.append({
            "id": test.get("id", str(uuid.uuid4())[:8]),
            "story_id": test.get("story_id", ""),
            "test_name": test.get("test_name", ""),
            "description": test.get("description", ""),
            "status": "PASS" if passed else "FAIL",
            "bug_report": bug_report
        })
        if not passed:
            all_passed = False
    return json.dumps({"results": results, "all_passed": all_passed, "total": len(results)})


@tool
def log_bug(story_id: str, test_name: str, bug_description: str, severity: str, steps_to_reproduce: list) -> str:
    """Log a bug found during QA testing."""
    bug = {
        "id": f"BUG-{str(uuid.uuid4())[:8].upper()}",
        "story_id": story_id,
        "test_name": test_name,
        "bug_description": bug_description,
        "severity": severity,
        "steps_to_reproduce": steps_to_reproduce,
        "status": "OPEN",
        "logged_at": datetime.now().isoformat()
    }
    return json.dumps(bug)


@tool
def create_documentation(doc_type: str, title: str, content: str, sections: list) -> str:
    """Create comprehensive documentation for the project."""
    doc = {
        "id": f"DOC-{str(uuid.uuid4())[:8].upper()}",
        "doc_type": doc_type,
        "title": title,
        "content": content,
        "sections": sections,
        "created_at": datetime.now().isoformat()
    }
    return json.dumps(doc)


@tool
def create_sprint_report(sprint_number: int, completed_stories: list, velocity: int, blockers: list, retrospective: dict) -> str:
    """Create a sprint completion report with metrics and retrospective."""
    report = {
        "sprint_number": sprint_number,
        "completed_stories": completed_stories,
        "velocity": velocity,
        "blockers": blockers,
        "retrospective": retrospective,
        "status": "COMPLETED",
        "completed_at": datetime.now().isoformat()
    }
    return json.dumps(report)
