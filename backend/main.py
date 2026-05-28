import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Scrum AI Board", version="1.0.0")

from .integrations.router import router as integrations_router
app.include_router(integrations_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_connections: dict[str, WebSocket] = {}
session_states: dict[str, dict] = {}


async def _push_to_ws(session_id: str, payload: dict):
    """Low-level send to a connected WebSocket."""
    ws = active_connections.get(session_id)
    if ws:
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            pass


class ProjectRequest(BaseModel):
    project_name: str
    requirement: str
    openai_api_key: Optional[str] = None


async def broadcast_state(session_id: str, state: dict, event_type: str = "state_update"):
    ws = active_connections.get(session_id)
    if ws:
        try:
            payload = {
                "type": event_type,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "data": sanitize_state(state)
            }
            await ws.send_text(json.dumps(payload))
        except Exception as e:
            print(f"Broadcast error: {e}")


def sanitize_state(state: dict) -> dict:
    """Remove non-serializable objects from state."""
    safe = {}
    for k, v in state.items():
        if k == "messages":
            safe[k] = [
                {"type": m.__class__.__name__, "content": str(m.content)[:500]}
                for m in (v or [])
            ]
        else:
            try:
                json.dumps(v)
                safe[k] = v
            except (TypeError, ValueError):
                safe[k] = str(v)
    return safe


async def run_scrum_workflow(session_id: str, project_name: str, requirement: str, api_key: str):
    os.environ["OPENAI_API_KEY"] = api_key

    from .graph.workflow import create_scrum_workflow
    from .agents.base import register_broadcaster, unregister_broadcaster

    # Register per-session broadcaster so agents can push chunks directly
    async def session_push(payload: dict):
        await _push_to_ws(session_id, payload)

    register_broadcaster(session_id, session_push)

    initial_state = {
        "session_id": session_id,
        "project_name": project_name,
        "requirement": requirement,
        "current_sprint": 1,
        "sprint_goal": "",
        "sprint_status": "PLANNING",
        "product_backlog": [],
        "sprint_backlog": [],
        "architecture": None,
        "code_artifacts": [],
        "test_results": [],
        "qa_iterations": 0,
        "max_qa_iterations": 2,
        "all_tests_passed": False,
        "documentation": "",
        "sprint_notes": "",
        "release_notes": "",
        "current_agent": "product_owner",
        "agent_logs": [],
        "completed_agents": [],
        "messages": [],
        "next_agent": None,
        "error": None,
        "workflow_complete": False
    }

    session_states[session_id] = initial_state

    await broadcast_state(session_id, initial_state, "workflow_start")

    graph = create_scrum_workflow()

    try:
        async for event in graph.astream(initial_state, stream_mode="values"):
            session_states[session_id] = event
            await broadcast_state(session_id, event, "state_update")
            await asyncio.sleep(0.1)

        final_state = session_states.get(session_id, {})
        await broadcast_state(session_id, final_state, "workflow_complete")

    except Exception as e:
        error_msg = str(e)
        print(f"Workflow error: {error_msg}")
        error_state = {**session_states.get(session_id, initial_state), "error": error_msg}
        session_states[session_id] = error_state
        await broadcast_state(session_id, error_state, "workflow_error")
    finally:
        unregister_broadcaster(session_id)


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    active_connections[session_id] = websocket
    print(f"WebSocket connected: {session_id}")

    try:
        if session_id in session_states:
            await broadcast_state(session_id, session_states[session_id], "state_sync")

        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "timestamp": datetime.now().isoformat()}))

    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {session_id}")
    finally:
        active_connections.pop(session_id, None)


@app.post("/api/start-sprint")
async def start_sprint(request: ProjectRequest):
    api_key = request.openai_api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="OpenAI API key is required")

    session_id = str(uuid.uuid4())

    asyncio.create_task(
        run_scrum_workflow(session_id, request.project_name, request.requirement, api_key)
    )

    return {
        "session_id": session_id,
        "status": "started",
        "message": f"Sprint started for project: {request.project_name}",
        "websocket_url": f"/ws/{session_id}"
    }


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    state = session_states.get(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return sanitize_state(state)


@app.get("/api/sessions")
async def list_sessions():
    return {
        "sessions": [
            {
                "session_id": sid,
                "project_name": state.get("project_name", "Unknown"),
                "status": state.get("sprint_status", "UNKNOWN"),
                "current_agent": state.get("current_agent", ""),
                "complete": state.get("workflow_complete", False)
            }
            for sid, state in session_states.items()
        ]
    }


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    session_states.pop(session_id, None)
    return {"message": "Session deleted"}


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


# Resolve frontend/dist relative to repo root (works both locally and on Render)
_here = os.path.dirname(os.path.abspath(__file__))
frontend_path = os.path.join(_here, "..", "frontend", "dist")
frontend_path = os.path.normpath(frontend_path)

if os.path.exists(frontend_path) and os.path.isdir(frontend_path):
    assets_dir = os.path.join(frontend_path, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_path, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    @app.get("/")
    async def root():
        return {"status": "Scrum AI Board API running", "docs": "/docs", "health": "/health"}
