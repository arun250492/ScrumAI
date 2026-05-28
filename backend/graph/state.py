from typing import TypedDict, List, Dict, Optional, Annotated, Any
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage


class UserStory(TypedDict):
    id: str
    title: str
    description: str
    acceptance_criteria: List[str]
    priority: str
    story_points: int
    status: str
    assigned_to: str


class CodeArtifact(TypedDict):
    id: str
    story_id: str
    filename: str
    language: str
    content: str
    description: str


class TestResult(TypedDict):
    id: str
    story_id: str
    test_name: str
    status: str
    description: str
    bug_report: Optional[str]


class ArchitectureDoc(TypedDict):
    system_overview: str
    components: List[Dict]
    api_endpoints: List[Dict]
    database_schema: List[Dict]
    tech_stack: List[str]
    diagram_description: str


class AgentLog(TypedDict):
    timestamp: str
    agent: str
    agent_role: str
    action: str
    message: str
    data: Optional[Dict]


class ScrumState(TypedDict):
    session_id: str
    project_name: str
    requirement: str
    current_sprint: int
    sprint_goal: str
    sprint_status: str

    product_backlog: List[UserStory]
    sprint_backlog: List[UserStory]

    architecture: Optional[ArchitectureDoc]

    code_artifacts: List[CodeArtifact]

    test_results: List[TestResult]
    qa_iterations: int
    max_qa_iterations: int
    all_tests_passed: bool

    documentation: str
    sprint_notes: str
    release_notes: str

    current_agent: str
    agent_logs: List[AgentLog]
    completed_agents: List[str]

    messages: Annotated[List[BaseMessage], add_messages]

    next_agent: Optional[str]
    error: Optional[str]
    workflow_complete: bool
