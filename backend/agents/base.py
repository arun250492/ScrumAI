import json
import os
from datetime import datetime
from typing import Callable, Awaitable, Optional
from langchain_openai import ChatOpenAI

# Per-session broadcast registry so agents can push chunks directly to WebSocket
_broadcasters: dict[str, Callable] = {}


def register_broadcaster(session_id: str, fn: Callable):
    _broadcasters[session_id] = fn


def unregister_broadcaster(session_id: str):
    _broadcasters.pop(session_id, None)


async def _push(session_id: str, payload: dict):
    fn = _broadcasters.get(session_id)
    if fn:
        try:
            await fn(payload)
        except Exception:
            pass


async def broadcast_agent_status(session_id: str, agent: str, role: str, status: str, message: str):
    await _push(session_id, {
        "type": "agent_status",
        "agent": agent,
        "agent_role": role,
        "status": status,
        "message": message,
        "timestamp": datetime.now().isoformat()
    })


async def stream_llm(llm, messages, session_id: str, agent_short: str) -> str:
    """Stream LLM response token-by-token and push chunks to the WebSocket."""
    full = ""
    async for chunk in llm.astream(messages):
        if chunk.content:
            full += chunk.content
            await _push(session_id, {
                "type": "agent_chunk",
                "agent": agent_short,
                "chunk": chunk.content,
                "timestamp": datetime.now().isoformat()
            })
    return full


def get_llm(model: str = "gpt-4o-mini", max_tokens: int = 2500):
    return ChatOpenAI(
        model=model,
        temperature=0.2,
        max_tokens=max_tokens,
        api_key=os.getenv("OPENAI_API_KEY"),
        streaming=True
    )


def parse_json(content: str) -> dict:
    """Extract first JSON object from a string."""
    try:
        start = content.find('{')
        end = content.rfind('}') + 1
        if start >= 0 and end > start:
            return json.loads(content[start:end])
    except Exception:
        pass
    return {}


def make_log(agent: str, role: str, action: str, message: str, data: dict = None) -> dict:
    return {
        "timestamp": datetime.now().isoformat(),
        "agent": agent,
        "agent_role": role,
        "action": action,
        "message": message,
        "data": data
    }
