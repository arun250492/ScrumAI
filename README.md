# 🤖 Scrum AI Board

A production-grade multi-agent Scrum board powered by **LangGraph** and **GPT-4o**. Six specialized AI agents collaborate in real-time to deliver software projects using Scrum methodology.

## Agents

| Agent | Role | Tools |
|-------|------|-------|
| 🎯 Product Owner | Requirements → User Stories | `create_user_story`, `prioritize_backlog` |
| ⚡ Scrum Master | Sprint coordination & review | `create_sprint`, `create_sprint_report` |
| 🏗️ Architect | System design & APIs | `design_architecture` |
| 💻 Developer | Code implementation | `write_code`, `update_story_status` |
| 🔬 QA Engineer | Testing & bug tracking | `create_test_case`, `run_tests`, `log_bug` |
| 📚 Doc Engineer | Documentation & release notes | `create_documentation` |

## Tech Stack

- **Orchestration**: LangGraph (StateGraph with conditional edges)
- **LLM**: OpenAI GPT-4o via LangChain
- **Backend**: FastAPI + WebSockets (real-time streaming)
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **Deployment**: Render.com

## Local Development

### Backend
```bash
cd scrum-ai-board
cp .env.example .env
# Add your OPENAI_API_KEY to .env

pip install -r backend/requirements.txt
python -m backend.start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Render.com

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo
4. Render reads `render.yaml` and creates both services
5. Set `OPENAI_API_KEY` environment variable in the API service dashboard

## Workflow Topology

```
START → Product Owner → Scrum Master (Plan) → Architect → Developer → QA
                                                              ↑           |
                                                              └─ (fail) ──┘
                                                                          |
                                                                    (pass)↓
                                                              Documentation → Scrum Master (Review) → END
```

## Features

- Real-time agent activity feed via WebSocket
- Live Kanban board with story status updates
- Architecture viewer (components, APIs, database schema)
- QA test results dashboard
- Markdown documentation viewer
- Sprint metrics and progress tracking
- Multiple concurrent session support
