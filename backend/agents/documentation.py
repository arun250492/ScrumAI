import json
from langchain_core.messages import SystemMessage, HumanMessage
from .base import get_llm, stream_llm, parse_json, make_log, broadcast_agent_status
from ..graph.state import ScrumState

SYSTEM = """You are a Staff Technical Writer and Release Manager at a Series B SaaS company.
You produce documentation that engineers, PMs, and executives all actually read.
Return ONLY valid JSON — no markdown fences around the JSON itself.

Standards you follow:
- Diátaxis documentation framework (tutorials, how-to, reference, explanation)
- Semantic versioning (semver.org)
- OpenAPI 3.0 style for API reference
- Google Developer Documentation Style Guide
- Conventional Commits for changelog format"""

TEMPLATE = """
Project: {name}  |  Sprint {sprint}  |  Release: v1.{sprint}.0

Architecture:
- Tech Stack: {stack}
- API Style: {api_style}
- Auth: {auth}
- Key Endpoints: {endpoints}

Features Delivered This Sprint:
{features}

QA: {passed}/{total} tests passed across {stories} stories

Produce comprehensive professional documentation as JSON:
{{
  "api_reference": {{
    "version": "1.{sprint}.0",
    "base_url": "https://api.{slug}.com/v1",
    "authentication": {{
      "type": "Bearer JWT",
      "header": "Authorization: Bearer <token>",
      "obtain_token": "POST /api/v1/auth/login",
      "token_expiry": "15 minutes",
      "refresh": "POST /api/v1/auth/refresh"
    }},
    "error_codes": [
      {{"code": 400, "meaning": "Bad Request — validation failed", "example": {{"error": "VALIDATION_ERROR", "fields": {{"email": "Invalid format"}}}}}},
      {{"code": 401, "meaning": "Unauthorized — token missing or expired"}},
      {{"code": 403, "meaning": "Forbidden — insufficient permissions"}},
      {{"code": 404, "meaning": "Not Found"}},
      {{"code": 429, "meaning": "Rate Limited — retry after X seconds"}}
    ],
    "endpoints": [
      {{
        "group": "Authentication",
        "method": "POST",
        "path": "/api/v1/auth/login",
        "summary": "Authenticate user and obtain JWT tokens",
        "request_example": {{"email": "user@example.com", "password": "••••••••"}},
        "response_example": {{"access_token": "eyJ...", "refresh_token": "eyJ...", "expires_in": 900}},
        "curl_example": "curl -X POST https://api.example.com/v1/auth/login -H 'Content-Type: application/json' -d '{{\"email\":\"user@example.com\",\"password\":\"secret\"}}'"
      }}
    ]
  }},

  "release_notes": {{
    "version": "v1.{sprint}.0",
    "release_date": "2025-01-15",
    "release_type": "minor",
    "summary": "Two sentence executive summary of what this release delivers",
    "highlights": ["Key capability 1", "Key capability 2", "Performance improvement"],
    "new_features": [
      {{
        "title": "Feature name",
        "description": "What it does and why it matters to users",
        "user_impact": "Users can now ...",
        "docs_link": "#api-reference"
      }}
    ],
    "bug_fixes": [],
    "breaking_changes": [],
    "deprecations": [],
    "migration_guide": "No migration required for this release. Fully backward compatible.",
    "known_issues": [],
    "upgrade_instructions": "Update package version to v1.{sprint}.0. Run database migrations: `alembic upgrade head`"
  }},

  "architecture_guide": {{
    "overview": "3-4 paragraph technical overview for engineers onboarding to the codebase",
    "getting_started": {{
      "prerequisites": ["Node 18+", "Python 3.11+", "PostgreSQL 16", "Docker (optional)"],
      "local_setup": [
        "git clone <repo>",
        "cd {slug} && cp .env.example .env",
        "pip install -r requirements.txt",
        "alembic upgrade head",
        "uvicorn app.main:app --reload",
        "cd frontend && npm install && npm run dev"
      ],
      "environment_variables": [
        {{"name": "DATABASE_URL", "required": true, "description": "PostgreSQL connection string", "example": "postgresql://user:pass@localhost/dbname"}},
        {{"name": "JWT_SECRET_KEY", "required": true, "description": "RS256 private key for JWT signing"}},
        {{"name": "REDIS_URL", "required": false, "description": "Redis for caching/rate limiting", "default": "redis://localhost:6379"}}
      ]
    }},
    "codebase_structure": {{
      "backend": "FastAPI app — /app/routers (endpoints), /app/models (SQLAlchemy), /app/services (business logic), /app/schemas (Pydantic)",
      "frontend": "React — /src/pages, /src/components, /src/hooks, /src/api (Axios client)",
      "infrastructure": "/infra (Terraform), /docker (Dockerfiles), /.github/workflows (CI/CD)"
    }},
    "key_patterns": [
      "Repository pattern for DB access — never query DB directly in routers",
      "Dependency injection via FastAPI Depends()",
      "Pydantic schemas for all request/response validation",
      "React Query for all server state — no manual fetch calls in components"
    ]
  }},

  "runbook": {{
    "deployment": {{
      "production_deploy": "Push to main → GitHub Actions → Docker build → ECR push → ECS rolling deploy (zero downtime)",
      "rollback": "ECS console → select service → update to previous task definition revision",
      "smoke_tests": "Automated: /health endpoint check, login flow, primary CRUD operation"
    }},
    "monitoring": {{
      "dashboards": ["CloudWatch: API latency P50/P95/P99, error rate, request count", "RDS: CPU, connections, slow queries", "Redis: memory, hit rate, connected clients"],
      "alerts": [
        {{"metric": "Error rate > 1%", "action": "Page on-call engineer"}},
        {{"metric": "API P99 latency > 2s", "action": "Slack #alerts channel"}},
        {{"metric": "DB connections > 80%", "action": "Auto-scale or investigate connection leak"}}
      ]
    }},
    "incident_response": [
      "1. Check CloudWatch dashboard for error spike source",
      "2. Check recent deployments — if correlated, rollback immediately",
      "3. Check DB slow queries log",
      "4. Scale compute if CPU/memory bound",
      "5. Post in #incidents with impact assessment + ETA"
    ],
    "common_issues": [
      {{"symptom": "401 errors spiking", "likely_cause": "JWT secret rotation without token invalidation", "fix": "Check JWT_SECRET_KEY env var matches across all instances"}},
      {{"symptom": "DB connection timeout", "likely_cause": "Connection pool exhausted", "fix": "Increase PgBouncer pool size or reduce N+1 queries"}}
    ]
  }},

  "decision_log": [
    {{
      "date": "2025-01-15",
      "decision": "Use React Query over Redux for server state",
      "made_by": "Engineering team",
      "rationale": "Eliminates 80% of boilerplate, built-in caching, background refetch, optimistic updates",
      "impact": "Reduced frontend code by ~30%, improved perceived performance"
    }}
  ]
}}"""


async def documentation_node(state: ScrumState) -> dict:
    sid = state.get("session_id", "")
    logs = list(state.get("agent_logs", []))

    await broadcast_agent_status(sid, "Doc", "Doc Engineer", "ACTIVE",
                                 "Writing API reference, release notes, runbook and architecture guide...")
    logs.append(make_log("Doc", "Documentation", "DOC_START",
                         "Writing API reference, release notes, runbook and architecture guide..."))

    arch = state.get("architecture") or {}
    stories = state.get("sprint_backlog", [])
    done = [s["title"] for s in stories if s.get("status") == "DONE"]
    tests = state.get("test_results", [])
    passed = sum(1 for t in tests if t.get("status") == "PASS")
    api_style = arch.get("api_design", {}).get("style", "REST")
    auth = arch.get("api_design", {}).get("authentication", "JWT Bearer")
    endpoints = [f"{e.get('method')} {e.get('path')}" for e in arch.get("api_design", {}).get("endpoints", [])[:6]]
    stack = ", ".join(arch.get("tech_stack", ["Python", "React"])[:6])
    slug = state.get("project_name", "app").lower().replace(" ", "-")
    sprint = state.get("current_sprint", 1)

    llm = get_llm("gpt-4o", max_tokens=4000)
    messages = [
        SystemMessage(content=SYSTEM),
        HumanMessage(content=TEMPLATE.format(
            name=state.get("project_name", "Project"),
            sprint=sprint,
            stack=stack,
            api_style=api_style,
            auth=auth,
            endpoints=json.dumps(endpoints),
            features=json.dumps(done),
            passed=passed,
            total=len(tests),
            stories=len(stories),
            slug=slug
        ))
    ]

    content = await stream_llm(llm, messages, sid, "Doc")
    data = parse_json(content)

    sections = {
        "API Reference": data.get("api_reference"),
        "Release Notes": data.get("release_notes"),
        "Architecture Guide": data.get("architecture_guide"),
        "Runbook": data.get("runbook"),
        "Decision Log": data.get("decision_log"),
    }

    for name, section in sections.items():
        if section:
            logs.append(make_log("Doc", "Documentation", "DOC_CREATED", f"📄 {name} written"))

    full_doc = json.dumps(data, indent=2)
    release_notes_data = data.get("release_notes", {})
    release_notes_md = f"""# {release_notes_data.get('version', 'v1.0.0')} — Release Notes

**{release_notes_data.get('summary', '')}**

## Highlights
{chr(10).join('- ' + h for h in release_notes_data.get('highlights', []))}

## New Features
{chr(10).join('### ' + f.get('title', '') + chr(10) + f.get('description', '') for f in release_notes_data.get('new_features', []))}

## Upgrade Instructions
{release_notes_data.get('upgrade_instructions', 'No migration required.')}
"""

    logs.append(make_log("Doc", "Documentation", "DOC_COMPLETE",
                         "✅ API Reference, Release Notes v{}.{}.0, Architecture Guide, Runbook — all complete.".format(1, sprint)))

    await broadcast_agent_status(sid, "Doc", "Doc Engineer", "DONE",
                                 f"✅ {len([s for s in sections.values() if s])} documents written — API ref, runbook, release notes")

    return {
        "documentation": full_doc,
        "release_notes": release_notes_md,
        "current_agent": "scrum_master_review",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["documentation"],
        "messages": [HumanMessage(content="Documentation complete — API ref, release notes, runbook, architecture guide.")]
    }
