import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function DocSection({ title, icon, content, json }) {
  if (!content && !json) return null
  const display = content || (json ? JSON.stringify(json, null, 2) : '')

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 py-2 border-b border-border">
        <span className="text-base">{icon}</span>
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      </div>
      <div className="prose prose-invert prose-sm max-w-none
        prose-headings:text-slate-100 prose-headings:font-semibold
        prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
        prose-p:text-slate-400 prose-p:leading-relaxed
        prose-code:text-violet-light prose-code:bg-bg-3 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
        prose-pre:bg-bg-2 prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:text-xs
        prose-a:text-cyan-DEFAULT prose-a:no-underline hover:prose-a:underline
        prose-strong:text-slate-200
        prose-li:text-slate-400
        prose-table:text-xs prose-td:border-border prose-th:border-border prose-th:text-slate-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{display}</ReactMarkdown>
      </div>
    </div>
  )
}

export default function DocumentationPanel({ documentation, releaseNotes, sprintNotes }) {
  const [tab, setTab] = useState('release')

  // Try to parse the documentation JSON
  let docData = {}
  try { docData = JSON.parse(documentation || '{}') } catch {}

  const hasApiRef = docData.api_reference || docData.api_documentation
  const hasArch   = docData.architecture_guide
  const hasRunbook= docData.runbook
  const hasRelease= releaseNotes

  const TABS = [
    { id: 'release',  label: '🚀 Release Notes',     show: !!hasRelease },
    { id: 'api',      label: '📡 API Reference',      show: !!hasApiRef },
    { id: 'arch',     label: '🏗 Architecture Guide', show: !!hasArch },
    { id: 'runbook',  label: '📋 Runbook',            show: !!hasRunbook },
    { id: 'sprint',   label: '📊 Sprint Report',      show: !!sprintNotes },
  ].filter(t => t.show)

  if (TABS.length === 0) return (
    <div className="card flex items-center justify-center h-40">
      <div className="text-center">
        <p className="text-2xl mb-2">◻</p>
        <p className="text-sm text-slate-500">Documentation will appear here after the Doc Engineer agent runs</p>
      </div>
    </div>
  )

  const apiRef = docData.api_reference
  const archGuide = docData.architecture_guide
  const runbook = docData.runbook

  return (
    <div className="card overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`tab flex-shrink-0 ${tab === t.id ? 'tab-active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 max-h-[600px] overflow-y-auto space-y-6">

        {tab === 'release' && releaseNotes && (
          <DocSection title="Release Notes" icon="🚀" content={releaseNotes} />
        )}

        {tab === 'api' && apiRef && (
          <div className="space-y-4">
            {/* Auth */}
            {apiRef.authentication && (
              <div className="surface-3 rounded-lg p-4 border border-border">
                <p className="text-xs font-semibold text-slate-400 mb-2">AUTHENTICATION</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(apiRef.authentication).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-2xs text-slate-600 capitalize">{k.replace(/_/g,' ')}</p>
                      <p className="text-xs text-slate-300 font-mono">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Endpoints */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">ENDPOINTS</p>
              <div className="space-y-2">
                {(apiRef.endpoints || []).map((ep, i) => (
                  <div key={i} className="surface-3 rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-2xs px-1.5 py-0.5 rounded font-mono font-bold ${
                        ep.method === 'GET' ? 'bg-emerald-dim text-emerald-DEFAULT' :
                        ep.method === 'POST' ? 'bg-cyan-dim text-cyan-DEFAULT' :
                        ep.method === 'PUT' || ep.method === 'PATCH' ? 'bg-amber-dim text-amber-DEFAULT' :
                        'bg-rose-dim text-rose-DEFAULT'}`}>{ep.method}</span>
                      <code className="text-xs text-violet-light font-mono">{ep.path}</code>
                      {ep.group && <span className="badge badge-slate text-2xs">{ep.group}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{ep.summary}</p>
                    {ep.curl_example && (
                      <pre className="text-2xs text-slate-500 font-mono bg-black/30 p-2 rounded overflow-x-auto border border-border">{ep.curl_example}</pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Error codes */}
            {apiRef.error_codes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">ERROR CODES</p>
                <div className="space-y-1.5">
                  {apiRef.error_codes.map((e, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <span className="badge badge-rose text-2xs flex-shrink-0">{e.code}</span>
                      <span className="text-slate-400">{e.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'arch' && archGuide && (
          <div className="space-y-4">
            <DocSection title="Architecture Overview" icon="🏗" content={archGuide.overview} />
            {archGuide.getting_started && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">LOCAL SETUP</p>
                <pre className="text-xs text-slate-300 font-mono bg-black/30 p-4 rounded-lg border border-border leading-relaxed overflow-x-auto">
                  {(archGuide.getting_started.local_setup || []).join('\n')}
                </pre>
                {archGuide.getting_started.environment_variables?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {archGuide.getting_started.environment_variables.map((v, i) => (
                      <div key={i} className="surface-3 rounded-lg p-2.5 border border-border flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <code className="text-xs text-violet-light font-mono">{v.name}</code>
                          {v.required && <span className="badge badge-rose text-2xs ml-2">required</span>}
                          <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
                        </div>
                        {v.example && <code className="text-2xs text-slate-600 font-mono flex-shrink-0">{v.example}</code>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'runbook' && runbook && (
          <div className="space-y-4">
            {runbook.deployment && (
              <div className="surface-3 rounded-lg p-4 border border-border space-y-2">
                <p className="text-xs font-semibold text-slate-400">DEPLOYMENT</p>
                {Object.entries(runbook.deployment).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-2xs text-slate-600 capitalize mb-0.5">{k.replace(/_/g,' ')}</p>
                    <p className="text-xs text-slate-300">{v}</p>
                  </div>
                ))}
              </div>
            )}
            {runbook.incident_response?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">INCIDENT RESPONSE</p>
                <ol className="space-y-1.5">
                  {runbook.incident_response.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-xs">
                      <span className="text-violet-light font-mono flex-shrink-0">{i + 1}.</span>
                      <span className="text-slate-400">{step.replace(/^\d+\.\s*/, '')}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {runbook.common_issues?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">COMMON ISSUES</p>
                <div className="space-y-2">
                  {runbook.common_issues.map((issue, i) => (
                    <div key={i} className="surface-3 rounded-lg p-3 border border-border">
                      <p className="text-xs text-amber-DEFAULT font-medium mb-1">⚠ {issue.symptom}</p>
                      <p className="text-xs text-slate-500 mb-1">{issue.likely_cause}</p>
                      <p className="text-xs text-emerald-DEFAULT">→ {issue.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'sprint' && sprintNotes && (
          <DocSection title="Sprint Report" icon="📊" content={
            typeof sprintNotes === 'string' && sprintNotes.startsWith('{')
              ? `\`\`\`json\n${sprintNotes}\n\`\`\``
              : sprintNotes
          } />
        )}
      </div>
    </div>
  )
}
