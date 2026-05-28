import json
from langchain_core.messages import SystemMessage, HumanMessage
from .base import get_llm, stream_llm, parse_json, make_log, broadcast_agent_status
from ..graph.state import ScrumState

SYSTEM = """You are a Principal Solutions Architect with 15+ years at FAANG-scale companies.
You design systems used by millions of users. Return ONLY valid JSON — no markdown fences.

Your architecture must reflect:
- C4 Model thinking (Context → Containers → Components)
- Architecture Decision Records (ADRs) with alternatives considered
- Security-first design (OWASP Top 10 mitigations built in)
- 12-Factor App principles
- Cloud-native, horizontally scalable topology
- SOLID API design with versioning strategy
- Real cost and scaling estimates"""

TEMPLATE = """
Project: {name}
Requirement: {req}
User Stories: {stories}

Produce a COMPLETE, PROFESSIONAL architecture document as JSON:
{{
  "executive_summary": "3-4 sentence overview for CTO/stakeholders — business value + technical approach",

  "system_context": {{
    "primary_actors": [{{"name": "End User", "description": "...", "interaction": "..."}}],
    "external_systems": [{{"name": "Stripe", "purpose": "...", "integration_method": "REST API"}}],
    "system_boundary": "What this system owns vs. what it delegates"
  }},

  "containers": [
    {{
      "name": "React SPA",
      "technology": "React 18 + TypeScript + Vite",
      "description": "Client-side application",
      "responsibilities": ["Render UI", "Manage local state", "WebSocket client"],
      "scalability": "CDN-served static assets, scales to ∞ users",
      "port": 443
    }},
    {{
      "name": "API Gateway",
      "technology": "FastAPI 0.115 + Uvicorn",
      "description": "Core business logic layer",
      "responsibilities": ["Auth", "Rate limiting", "Business logic", "DB queries"],
      "scalability": "Horizontal via load balancer, stateless design",
      "port": 8000
    }},
    {{
      "name": "PostgreSQL 16",
      "technology": "PostgreSQL with pgvector extension",
      "description": "Primary relational store",
      "responsibilities": ["Persistent data", "ACID transactions", "Full-text search"],
      "scalability": "Read replicas + connection pooling via PgBouncer",
      "port": 5432
    }}
  ],

  "api_design": {{
    "style": "RESTful",
    "base_path": "/api/v1",
    "authentication": "JWT Bearer (RS256) + Refresh token rotation",
    "rate_limiting": "100 req/min authenticated, 10 req/min unauthenticated",
    "versioning_strategy": "URL path versioning (/api/v1/, /api/v2/)",
    "error_format": "RFC 7807 Problem Details",
    "endpoints": [
      {{
        "method": "POST",
        "path": "/api/v1/auth/login",
        "description": "Authenticate user, return JWT + refresh token",
        "request_body": {{"email": "string", "password": "string"}},
        "response_200": {{"access_token": "string", "refresh_token": "string", "expires_in": 3600}},
        "response_401": {{"type": "about:blank", "title": "Unauthorized", "status": 401}},
        "auth_required": false,
        "rate_limit": "5/min"
      }}
    ]
  }},

  "database_design": {{
    "engine": "PostgreSQL 16",
    "strategy": "Normalized relational (3NF) with selective denormalization for read-heavy paths",
    "connection_pooling": "PgBouncer — max 20 connections per instance",
    "migration_tool": "Alembic with auto-generated revisions",
    "indexing_strategy": "B-tree on PKs and FKs, partial indexes for soft-delete patterns, GIN for full-text",
    "tables": [
      {{
        "name": "users",
        "description": "Core user identity table",
        "fields": [
          {{"name": "id", "type": "UUID DEFAULT gen_random_uuid()", "constraints": "PRIMARY KEY"}},
          {{"name": "email", "type": "VARCHAR(255)", "constraints": "UNIQUE NOT NULL"}},
          {{"name": "password_hash", "type": "TEXT", "constraints": "NOT NULL — bcrypt cost 12"}},
          {{"name": "role", "type": "VARCHAR(50)", "constraints": "DEFAULT 'member'"}},
          {{"name": "created_at", "type": "TIMESTAMPTZ", "constraints": "DEFAULT NOW()"}},
          {{"name": "deleted_at", "type": "TIMESTAMPTZ", "constraints": "NULL — soft delete"}}
        ],
        "indexes": ["idx_users_email", "idx_users_deleted_at WHERE deleted_at IS NULL"]
      }}
    ]
  }},

  "security_architecture": {{
    "authentication": "JWT RS256 — 15min access token, 7-day refresh, stored in httpOnly cookie",
    "authorization": "RBAC with roles: admin, member, viewer",
    "secrets_management": "AWS Secrets Manager / Render environment variables — never in code",
    "data_encryption": "AES-256-GCM at rest, TLS 1.3 in transit, bcrypt cost 12 for passwords",
    "rate_limiting": "Redis-backed sliding window counter per IP + per user",
    "owasp_mitigations": [
      "SQL injection: SQLAlchemy parameterized queries only",
      "XSS: React auto-escaping + strict CSP headers",
      "CSRF: SameSite=Strict cookies + CSRF token for mutation endpoints",
      "IDOR: UUID primary keys + ownership check middleware on every route"
    ],
    "security_headers": ["Strict-Transport-Security", "X-Frame-Options: DENY", "Content-Security-Policy"]
  }},

  "infrastructure": {{
    "cloud_provider": "AWS (primary) / Render.com (MVP)",
    "deployment_model": "Containerized via Docker, orchestrated with ECS Fargate or Kubernetes",
    "services": [
      {{"service": "Compute", "choice": "ECS Fargate", "reason": "Serverless containers, pay-per-use"}},
      {{"service": "Database", "choice": "RDS PostgreSQL Multi-AZ", "reason": "Managed, automated backups, failover"}},
      {{"service": "Cache", "choice": "ElastiCache Redis", "reason": "Session store + rate limit counters"}},
      {{"service": "CDN", "choice": "CloudFront", "reason": "Static asset delivery, edge caching"}},
      {{"service": "Object Storage", "choice": "S3", "reason": "File uploads, exports, backups"}}
    ],
    "scaling_strategy": "Auto-scaling on CPU > 70% or request queue depth > 100. DB read replicas for reporting queries.",
    "estimated_monthly_cost": "$150-400/month at 10k MAU, $2k-5k at 100k MAU",
    "ci_cd": "GitHub Actions → Docker build → push to ECR → rolling ECS deploy → smoke test"
  }},

  "tech_stack": [
    "React 18 + TypeScript", "Vite", "Tailwind CSS", "FastAPI", "Python 3.11",
    "PostgreSQL 16", "Redis 7", "Docker", "AWS ECS", "CloudFront", "S3"
  ],

  "adrs": [
    {{
      "id": "ADR-001",
      "title": "Use PostgreSQL over MongoDB",
      "status": "Accepted",
      "context": "Need to store relational data with complex queries and ACID guarantees",
      "decision": "PostgreSQL 16 with pgvector for vector similarity search",
      "alternatives_considered": ["MongoDB Atlas — rejected: weaker consistency guarantees", "DynamoDB — rejected: complex relational queries become expensive"],
      "consequences": "Requires schema migrations on changes. Benefit: full ACID, mature ecosystem, excellent performance."
    }},
    {{
      "id": "ADR-002",
      "title": "JWT over Session cookies for auth",
      "status": "Accepted",
      "context": "Need stateless auth that works across multiple API instances",
      "decision": "RS256 JWT with 15min expiry + httpOnly refresh token cookie",
      "alternatives_considered": ["Opaque session tokens in Redis — rejected: adds Redis dependency to every auth check"],
      "consequences": "Cannot revoke individual tokens before expiry. Mitigated by short TTL + refresh token blacklist in Redis."
    }}
  ],

  "diagram_description": "Browser → CloudFront CDN → React SPA. API calls → ALB → ECS Fargate (FastAPI, 2-10 instances) → RDS PostgreSQL (Multi-AZ) + ElastiCache Redis. Static assets on S3. Monitoring via CloudWatch + Datadog."
}}"""


async def architect_node(state: ScrumState) -> dict:
    sid = state.get("session_id", "")
    logs = list(state.get("agent_logs", []))

    await broadcast_agent_status(sid, "AA", "Architect", "ACTIVE",
                                 "Designing C4 architecture, ADRs, security model and infrastructure...")
    logs.append(make_log("AA", "Architect", "DESIGN_START",
                         "Designing C4 architecture, ADRs, security model and infrastructure..."))

    stories = state.get("sprint_backlog", [])
    stories_txt = json.dumps([s["title"] for s in stories])

    llm = get_llm("gpt-4o", max_tokens=4000)
    messages = [
        SystemMessage(content=SYSTEM),
        HumanMessage(content=TEMPLATE.format(
            name=state.get("project_name", "Project"),
            req=state.get("requirement", "")[:600],
            stories=stories_txt
        ))
    ]

    content = await stream_llm(llm, messages, sid, "AA")
    architecture = parse_json(content)

    n_comp = len(architecture.get("containers", []))
    n_ep = len(architecture.get("api_design", {}).get("endpoints", []))
    n_adr = len(architecture.get("adrs", []))
    n_table = len(architecture.get("database_design", {}).get("tables", []))

    logs.append(make_log("AA", "Architect", "ARCHITECTURE_DESIGNED",
                         f"🏛️ C4 model: {n_comp} containers · {n_ep} API endpoints · {n_table} DB tables · {n_adr} ADRs",
                         {"containers": n_comp, "endpoints": n_ep, "adrs": n_adr, "tables": n_table}))
    logs.append(make_log("AA", "Architect", "SECURITY_REVIEW",
                         f"🔒 Security: {architecture.get('security_architecture', {}).get('authentication', 'JWT')}"))
    logs.append(make_log("AA", "Architect", "INFRA_DESIGN",
                         f"☁️ Infrastructure: {architecture.get('infrastructure', {}).get('cloud_provider', 'AWS')} · Est. {architecture.get('infrastructure', {}).get('estimated_monthly_cost', 'TBD')}"))

    await broadcast_agent_status(sid, "AA", "Architect", "DONE",
                                 f"✅ Architecture complete — {n_comp} containers, {n_adr} ADRs, security model, infra plan")

    return {
        "architecture": architecture,
        "current_agent": "developer",
        "agent_logs": logs,
        "completed_agents": list(state.get("completed_agents", [])) + ["architect"],
        "messages": [HumanMessage(content=f"AA: Architecture — {n_comp} containers, {n_ep} endpoints, {n_adr} ADRs")]
    }
