# 🤖 Scrum AI Board

A production-grade multi-agent Scrum board powered by **LangGraph** and **GPT-4o**. Six specialized AI agents collaborate in real-time to deliver software projects using Scrum methodology.

---

## Agents

| Agent | Role | Tools |
|-------|------|-------|
| 🎯 Product Owner | Requirements → User Stories | `create_user_story`, `prioritize_backlog` |
| ⚡ Scrum Master | Sprint coordination & review | `create_sprint`, `create_sprint_report` |
| 🏗️ Architect | System design & APIs | `design_architecture` |
| 💻 Developer | Code implementation | `write_code`, `update_story_status` |
| 🔬 QA Engineer | Testing & bug tracking | `create_test_case`, `run_tests`, `log_bug` |
| 📚 Doc Engineer | Documentation & release notes | `create_documentation` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Orchestration | LangGraph (StateGraph + conditional edges) |
| LLM | OpenAI GPT-4o via LangChain |
| Backend | FastAPI + WebSockets |
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Deployment | Render.com |

---

## Workflow Topology

```
START
  └─► Product Owner      (creates user stories, prioritizes backlog)
        └─► Scrum Master  (sprint planning, assigns stories)
              └─► Architect (system design, APIs, DB schema)
                    └─► Developer (writes production code)
                          └─► QA Engineer
                                ├─ FAIL ──► Developer (bug fix loop, max 2x)
                                └─ PASS ──► Doc Engineer (API docs + release notes)
                                                └─► Scrum Master (sprint review & report)
                                                        └─► END
```

---

## Local Development

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd scrum-ai-board
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY
```

### 2. Run the backend

```bash
pip install -r backend/requirements.txt
python -m backend.start
# API runs on http://localhost:8000
```

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
# UI runs on http://localhost:5173
```

---

## Deploy to Render.com

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repository
4. Render reads `render.yaml` and auto-creates:
   - **Backend** — Python web service (FastAPI + uvicorn)
   - **Frontend** — Static site (React build)
5. In the backend service dashboard → **Environment** → add `OPENAI_API_KEY`

---

## Project Structure

```
scrum-ai-board/
├── backend/
│   ├── main.py              # FastAPI app + WebSocket + session management
│   ├── start.py             # Local dev entry point
│   ├── requirements.txt
│   ├── agents/
│   │   ├── product_owner.py
│   │   ├── scrum_master.py
│   │   ├── architect.py
│   │   ├── developer.py
│   │   ├── qa.py
│   │   └── documentation.py
│   ├── graph/
│   │   ├── state.py         # LangGraph ScrumState TypedDict
│   │   └── workflow.py      # StateGraph topology + conditional edges
│   └── tools/
│       └── scrum_tools.py   # All LangChain @tool definitions
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── AgentRoster.jsx       # Live agent status sidebar
│       │   ├── SprintBoard.jsx       # Kanban board
│       │   ├── ActivityFeed.jsx      # Real-time WebSocket feed
│       │   ├── ArchitectureViewer.jsx
│       │   ├── QAPanel.jsx
│       │   ├── DocumentationPanel.jsx
│       │   └── StartModal.jsx
│       └── hooks/
│           └── useWebSocket.js
├── render.yaml              # Render.com blueprint
└── .env.example
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/start-sprint` | Start a new sprint session |
| `GET` | `/api/session/{id}` | Get current session state |
| `GET` | `/api/sessions` | List all sessions |
| `DELETE` | `/api/session/{id}` | Delete a session |
| `WS` | `/ws/{session_id}` | Real-time state stream |
| `GET` | `/health` | Health check |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key (GPT-4o) |
