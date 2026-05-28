from langgraph.graph import StateGraph, END, START
from .state import ScrumState
from ..agents.product_owner import product_owner_node
from ..agents.scrum_master import scrum_master_plan_node, scrum_master_review_node
from ..agents.architect import architect_node
from ..agents.developer import developer_node
from ..agents.qa import qa_node
from ..agents.documentation import documentation_node


def qa_router(state: ScrumState) -> str:
    return "doc_agent" if state.get("all_tests_passed", False) else "developer"


def create_scrum_workflow():
    wf = StateGraph(ScrumState)

    wf.add_node("product_owner", product_owner_node)
    wf.add_node("scrum_master_plan", scrum_master_plan_node)
    wf.add_node("architect", architect_node)
    wf.add_node("developer", developer_node)
    wf.add_node("qa", qa_node)
    wf.add_node("doc_agent", documentation_node)
    wf.add_node("scrum_master_review", scrum_master_review_node)

    wf.add_edge(START, "product_owner")
    wf.add_edge("product_owner", "scrum_master_plan")
    wf.add_edge("scrum_master_plan", "architect")
    wf.add_edge("architect", "developer")
    wf.add_edge("developer", "qa")
    wf.add_conditional_edges("qa", qa_router, {
        "developer": "developer",
        "doc_agent": "doc_agent"
    })
    wf.add_edge("doc_agent", "scrum_master_review")
    wf.add_edge("scrum_master_review", END)

    return wf.compile()
