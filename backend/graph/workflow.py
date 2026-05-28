from langgraph.graph import StateGraph, END, START
from .state import ScrumState
from ..agents.product_owner import product_owner_node
from ..agents.scrum_master import scrum_master_plan_node, scrum_master_review_node
from ..agents.architect import architect_node
from ..agents.developer import developer_node
from ..agents.qa import qa_node
from ..agents.documentation import documentation_node


def qa_router(state: ScrumState) -> str:
    if state.get("all_tests_passed", False):
        return "documentation"
    return "developer"


def create_scrum_workflow():
    workflow = StateGraph(ScrumState)

    workflow.add_node("product_owner", product_owner_node)
    workflow.add_node("scrum_master_plan", scrum_master_plan_node)
    workflow.add_node("architect", architect_node)
    workflow.add_node("developer", developer_node)
    workflow.add_node("qa", qa_node)
    workflow.add_node("documentation", documentation_node)
    workflow.add_node("scrum_master_review", scrum_master_review_node)

    workflow.add_edge(START, "product_owner")
    workflow.add_edge("product_owner", "scrum_master_plan")
    workflow.add_edge("scrum_master_plan", "architect")
    workflow.add_edge("architect", "developer")
    workflow.add_edge("developer", "qa")
    workflow.add_conditional_edges(
        "qa",
        qa_router,
        {
            "developer": "developer",
            "documentation": "documentation"
        }
    )
    workflow.add_edge("documentation", "scrum_master_review")
    workflow.add_edge("scrum_master_review", END)

    return workflow.compile()


scrum_graph = create_scrum_workflow()
