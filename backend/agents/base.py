import json
import os
from datetime import datetime
from typing import List, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.tools import BaseTool


def get_llm(tools: List[BaseTool] = None):
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.3,
        api_key=os.getenv("OPENAI_API_KEY")
    )
    if tools:
        return llm.bind_tools(tools)
    return llm


def make_log(agent: str, role: str, action: str, message: str, data: dict = None):
    return {
        "timestamp": datetime.now().isoformat(),
        "agent": agent,
        "agent_role": role,
        "action": action,
        "message": message,
        "data": data
    }
