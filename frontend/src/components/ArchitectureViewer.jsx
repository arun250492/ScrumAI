import { useState } from 'react'
import { motion } from 'framer-motion'

const TABS = ['Overview', 'Containers', 'API Design', 'Database', 'Security', 'Infrastructure', 'ADRs']

function Tag({ children, color = '#7C3AED' }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono font-medium"
      style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  )
}

function SectionTitle({ children }) {
  return <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">{children}</h4>
}

export default function ArchitectureViewer({ architecture: arch }) {
  const [tab, setTab] = useState('Overview')

  if (!arch) return (
    <div className="card flex items-center justify-center h-40">
      <div className="text-center">
        <p className="text-2xl mb-2">⬡</p>
        <p className="text-sm text-slate-500">Architecture will appear here after the Architect agent runs</p>
      </div>
    </div>
  )

  const api = arch.api_design || {}
  const db  = arch.database_design || {}
  const sec = arch.security_architecture || {}
  const inf = arch.infrastructure || {}

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/7">
        <div className="flex items-center gap-3">
          <span className="text-base">⬡</span>
          <div>
            <p className="text-sm font-semibold text-slate-100">System Architecture</p>
            <p className="text-2xs text-slate-500">{arch.diagram_description?.slice(0, 70)}…</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(arch.tech_stack || []).slice(0, 5).map((t, i) => <Tag key={i}>{t}</Tag>)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/7">
        {TABS.map(t => {
          const hasData = (
            (t === 'Containers'    && (arch.containers || arch.components)?.length) ||
            (t === 'API Design'    && api.endpoints?.length) ||
            (t === 'Database'      && db.tables?.length) ||
            (t === 'Security'      && Object.keys(sec).length) ||
            (t === 'Infrastructure'&& Object.keys(inf).length) ||
            (t === 'ADRs'          && arch.adrs?.length) ||
            t === 'Overview'
          )
          return hasData ? (
            <button key={t} onClick={() => setTab(t)}
              className={`tab flex-shrink-0 ${tab === t ? 'tab-active' : ''}`}>{t}</button>
          ) : null
        })}
      </div>

      {/* Content */}
      <div className="p-4 max-h-72 overflow-y-auto">

        {tab === 'Overview' && (
          <div className="space-y-4">
            <div>
              <SectionTitle>Executive Summary</SectionTitle>
              <p className="text-sm text-slate-300 leading-relaxed">{arch.executive_summary || arch.system_overview}</p>
            </div>
            {arch.system_context && (
              <div>
                <SectionTitle>System Context</SectionTitle>
                <p className="text-xs text-slate-400 leading-relaxed">{arch.system_context.system_boundary}</p>
                {arch.system_context.primary_actors?.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 mt-1.5">
                    <Tag color="#06B6D4">{a.name}</Tag>
                    <span className="text-xs text-slate-500">{a.interaction}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Containers' && (
          <div className="grid grid-cols-1 gap-3">
            {(arch.containers || arch.components || []).map((c, i) => (
              <div key={i} className="surface-3 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-slate-100">{c.name}</span>
                  <Tag color="#06B6D4">{c.technology}</Tag>
                  {c.port && <Tag color="#F59E0B">:{c.port}</Tag>}
                </div>
                <p className="text-xs text-slate-400 mb-2">{c.description}</p>
                {c.responsibilities?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.responsibilities.map((r, j) => (
                      <span key={j} className="text-2xs px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{r}</span>
                    ))}
                  </div>
                )}
                {c.scalability && <p className="text-2xs text-slate-600 mt-2">↑ {c.scalability}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'API Design' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[['Style', api.style], ['Base Path', api.base_path], ['Auth', api.authentication], ['Rate Limit', api.rate_limiting]].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} className="surface-3 rounded-lg p-2.5 border border-white/5">
                  <p className="text-2xs text-slate-500 mb-0.5">{k}</p>
                  <p className="text-xs text-slate-200 font-mono">{v}</p>
                </div>
              ))}
            </div>
            <SectionTitle>Endpoints</SectionTitle>
            <div className="space-y-2">
              {(api.endpoints || []).map((ep, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 surface-3 rounded-lg border border-white/5">
                  <span className={`text-2xs px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 mt-0.5 ${
                    ep.method === 'GET' ? 'bg-emerald-dim text-emerald-DEFAULT' :
                    ep.method === 'POST' ? 'bg-cyan-dim text-cyan-DEFAULT' :
                    ep.method === 'PUT' || ep.method === 'PATCH' ? 'bg-amber-dim text-amber-DEFAULT' :
                    'bg-rose-dim text-rose-DEFAULT'
                  }`}>{ep.method}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-slate-200">{ep.path}</span>
                    <p className="text-2xs text-slate-500 mt-0.5">{ep.description}</p>
                    {ep.auth_required === false && <Tag color="#F59E0B">public</Tag>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Database' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[['Engine', db.engine], ['Strategy', db.strategy], ['Migrations', db.migration_tool], ['Pooling', db.connection_pooling]].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} className="surface-3 rounded-lg p-2.5 border border-white/5">
                  <p className="text-2xs text-slate-500 mb-0.5">{k}</p>
                  <p className="text-xs text-slate-200">{v}</p>
                </div>
              ))}
            </div>
            {(db.tables || []).map((table, i) => (
              <div key={i} className="surface-3 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🗄</span>
                  <span className="text-sm font-mono font-semibold text-violet-light">{table.name}</span>
                  <span className="text-2xs text-slate-500">{table.description}</span>
                </div>
                <div className="space-y-1">
                  {(table.fields || []).map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-slate-300 w-28 flex-shrink-0">{f.name}</span>
                      <span className="font-mono text-cyan-DEFAULT/70">{f.type}</span>
                      {f.constraints && <span className="text-slate-600 text-2xs">— {f.constraints}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Security' && (
          <div className="space-y-3">
            {[['Authentication', sec.authentication], ['Authorization', sec.authorization], ['Encryption', sec.data_encryption], ['Secrets', sec.secrets_management]].filter(([,v]) => v).map(([k, v]) => (
              <div key={k} className="surface-3 rounded-lg p-3 border border-white/5">
                <p className="text-2xs text-emerald-DEFAULT/70 font-semibold mb-1">🔒 {k}</p>
                <p className="text-xs text-slate-300">{v}</p>
              </div>
            ))}
            {sec.owasp_mitigations?.length > 0 && (
              <div>
                <SectionTitle>OWASP Mitigations</SectionTitle>
                <div className="space-y-1.5">
                  {sec.owasp_mitigations.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-emerald-DEFAULT mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-slate-400">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'Infrastructure' && (
          <div className="space-y-3">
            {[['Cloud', inf.cloud_provider], ['Model', inf.deployment_model], ['Scaling', inf.scaling_strategy], ['Est. Cost', inf.estimated_monthly_cost], ['CI/CD', inf.ci_cd]].filter(([,v]) => v).map(([k, v]) => (
              <div key={k} className="surface-3 rounded-lg p-3 border border-white/5">
                <p className="text-2xs text-slate-500 mb-0.5">{k}</p>
                <p className="text-xs text-slate-200">{v}</p>
              </div>
            ))}
            {inf.services?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {inf.services.map((s, i) => (
                  <div key={i} className="surface-3 rounded-lg p-2.5 border border-white/5">
                    <p className="text-2xs text-slate-500">{s.service}</p>
                    <p className="text-xs font-semibold text-slate-200">{s.choice}</p>
                    <p className="text-2xs text-slate-600 mt-0.5">{s.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'ADRs' && (
          <div className="space-y-3">
            {(arch.adrs || []).map((adr, i) => (
              <div key={i} className="surface-3 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Tag color="#F59E0B">{adr.id}</Tag>
                  <span className="text-sm font-semibold text-slate-100">{adr.title}</span>
                  <Tag color="#10B981">{adr.status}</Tag>
                </div>
                <div className="space-y-2 text-xs">
                  <div><span className="text-slate-500 font-medium">Context: </span><span className="text-slate-400">{adr.context}</span></div>
                  <div><span className="text-slate-500 font-medium">Decision: </span><span className="text-slate-300">{adr.decision}</span></div>
                  <div><span className="text-slate-500 font-medium">Alternatives: </span><span className="text-slate-400">{Array.isArray(adr.alternatives_considered) ? adr.alternatives_considered.join(' · ') : adr.alternatives_considered}</span></div>
                  <div><span className="text-slate-500 font-medium">Consequences: </span><span className="text-slate-400">{adr.consequences}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
