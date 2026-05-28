import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('yaml', yaml)

const CODE_THEME = {
  'hljs': { background: '#0D0D14', color: '#CBD5E1', fontSize: '12px', lineHeight: '1.7', padding: '1rem', borderRadius: '8px', overflowX: 'auto' },
  'hljs-keyword':  { color: '#A78BFA' },
  'hljs-built_in': { color: '#67E8F9' },
  'hljs-type':     { color: '#67E8F9' },
  'hljs-literal':  { color: '#FB923C' },
  'hljs-number':   { color: '#FB923C' },
  'hljs-string':   { color: '#86EFAC' },
  'hljs-comment':  { color: '#475569', fontStyle: 'italic' },
  'hljs-function': { color: '#67E8F9' },
  'hljs-title':    { color: '#93C5FD' },
  'hljs-params':   { color: '#CBD5E1' },
  'hljs-attr':     { color: '#67E8F9' },
  'hljs-variable': { color: '#F1F5F9' },
  'hljs-class':    { color: '#FDE68A' },
  'hljs-meta':     { color: '#94A3B8' },
  'hljs-tag':      { color: '#A78BFA' },
  'hljs-name':     { color: '#67E8F9' },
  'hljs-selector-class': { color: '#A78BFA' },
  'hljs-selector-id':    { color: '#FB923C' },
  'hljs-addition': { color: '#86EFAC' },
  'hljs-deletion': { color: '#FCA5A5' },
}

const EXT_LANG = {
  py: 'python', js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  sql: 'sql', sh: 'bash', bash: 'bash', json: 'json', yaml: 'yaml', yml: 'yaml',
  md: 'markdown', txt: 'plaintext', css: 'css', html: 'html',
}

function langFromFile(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase()
  return EXT_LANG[ext] || 'plaintext'
}

function fileIcon(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase()
  const icons = { py: '🐍', js: '🟨', jsx: '⚛', ts: '🔷', tsx: '⚛', sql: '🗄', css: '🎨', html: '🌐', md: '📝', json: '📋', sh: '⬛', bash: '⬛', yaml: '⚙', yml: '⚙' }
  return icons[ext] || '📄'
}

// ─── Shared components ────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }) {
  return (
    <div className={`surface-3 rounded-xl border border-border ${className}`}>{children}</div>
  )
}

function SectionHeader({ title, meta }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{title}</p>
      {meta && <p className="text-2xs text-slate-500">{meta}</p>}
    </div>
  )
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div className="flex overflow-x-auto border-b border-border bg-bg-1 flex-shrink-0">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          className={`tab flex-shrink-0 flex items-center gap-1.5 ${active === t.id ? 'tab-active' : ''}`}>
          {t.icon && <span>{t.icon}</span>}{t.label}
          {t.count !== undefined && (
            <span className={`text-2xs font-mono px-1.5 py-0.5 rounded ${active === t.id ? 'bg-violet-dim text-violet-light' : 'bg-white/5 text-slate-600'}`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={copy} className="text-2xs px-2 py-1 rounded bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-all font-mono">
      {copied ? '✓ copied' : 'copy'}
    </button>
  )
}

function MetricCard({ label, value, color = '#7C3AED', sub }) {
  return (
    <div className="surface-3 rounded-xl p-4 border border-border text-center">
      <div className="text-3xl font-bold mb-1" style={{ color }}>{value}</div>
      <div className="text-xs font-medium text-slate-400">{label}</div>
      {sub && <div className="text-2xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── PO View ──────────────────────────────────────────────────────────────────

const PRIORITY_CFG = {
  HIGH:   { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.25)',   label: 'High'   },
  MEDIUM: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  label: 'Med'    },
  LOW:    { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  label: 'Low'    },
}

function POView({ state }) {
  const [open, setOpen] = useState(null)
  const [tab, setTab] = useState('backlog')
  const allStories = state.product_backlog || []
  const sprintStories = state.sprint_backlog || []
  const totalPts = allStories.reduce((a, s) => a + (s.story_points || 0), 0)
  const highCount = allStories.filter(s => s.priority === 'HIGH').length

  const tabs = [
    { id: 'brief',   label: 'Project Brief', icon: '◈' },
    { id: 'backlog', label: 'Product Backlog', icon: '▦', count: allStories.length },
    { id: 'sprint',  label: 'Sprint Selection', icon: '🚀', count: sprintStories.length },
  ]

  return (
    <div className="flex flex-col h-full">
      <TabBar tabs={tabs} active={tab} onSelect={setTab} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {tab === 'brief' && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Total Stories"  value={allStories.length}  color="#7C3AED" />
              <MetricCard label="Story Points"   value={totalPts}           color="#06B6D4" />
              <MetricCard label="High Priority"  value={highCount}          color="#F43F5E" />
            </div>

            <SectionCard>
              <SectionHeader title="Project Requirement" />
              <div className="p-4">
                <p className="text-sm text-slate-300 leading-relaxed">{state.requirement}</p>
              </div>
            </SectionCard>

            {state.sprint_goal && (
              <SectionCard>
                <SectionHeader title="Sprint Goal" />
                <div className="p-4">
                  <p className="text-base font-semibold text-slate-100 leading-snug">{state.sprint_goal}</p>
                </div>
              </SectionCard>
            )}

            <SectionCard>
              <SectionHeader title="Priority Distribution" />
              <div className="p-4 space-y-2.5">
                {['HIGH','MEDIUM','LOW'].map(p => {
                  const count = allStories.filter(s => s.priority === p).length
                  const pct = allStories.length ? Math.round((count / allStories.length) * 100) : 0
                  const cfg = PRIORITY_CFG[p]
                  return (
                    <div key={p}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-slate-500">{count} stories · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: cfg.color }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </>
        )}

        {(tab === 'backlog' || tab === 'sprint') && (
          <div className="space-y-3">
            {(tab === 'backlog' ? allStories : sprintStories).map((story, i) => {
              const cfg = PRIORITY_CFG[story.priority] || PRIORITY_CFG.LOW
              const isOpen = open === story.id
              return (
                <motion.div key={story.id} layout
                  className="rounded-xl border border-border overflow-hidden transition-all"
                  style={{ background: isOpen ? '#1A1A28' : '#14141C' }}>
                  <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setOpen(isOpen ? null : story.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-2xs font-mono text-slate-600">{story.id}</span>
                        <span className="badge text-2xs" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>{cfg.label}</span>
                        <span className="badge badge-violet text-2xs">{story.story_points}pt</span>
                        <span className={`badge text-2xs ${
                          story.status === 'DONE' ? 'badge-emerald' : story.status === 'TODO' ? 'badge-slate' : 'badge-amber'
                        }`}>{story.status}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-100 leading-snug">{story.title}</p>
                      {!isOpen && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{story.description}</p>}
                    </div>
                    <span className="text-slate-600 text-xs mt-0.5 flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                          <div>
                            <p className="section-label mb-1.5">User Story</p>
                            <p className="text-sm text-slate-300 leading-relaxed italic">{story.description}</p>
                          </div>
                          {story.acceptance_criteria?.length > 0 && (
                            <div>
                              <p className="section-label mb-2">Acceptance Criteria</p>
                              <ul className="space-y-1.5">
                                {story.acceptance_criteria.map((ac, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm">
                                    <span className="text-emerald-DEFAULT mt-0.5 flex-shrink-0">✓</span>
                                    <span className="text-slate-300">{ac}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
            {(tab === 'backlog' ? allStories : sprintStories).length === 0 && (
              <div className="text-center py-12 text-slate-600 text-sm">No stories yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SM View ──────────────────────────────────────────────────────────────────

function SMView({ state }) {
  const [tab, setTab] = useState('sprint')
  const stories = state.sprint_backlog || []
  const done = stories.filter(s => s.status === 'DONE')
  const velocity = done.reduce((a, s) => a + (s.story_points || 0), 0)
  let sprintReport = {}
  try { sprintReport = JSON.parse(state.sprint_notes || '{}') } catch {}
  const smLogs = (state.agent_logs || []).filter(l => l.agent === 'SM')

  const tabs = [
    { id: 'sprint',  label: 'Sprint Plan',     icon: '🚀' },
    { id: 'retro',   label: 'Retrospective',   icon: '🔄' },
    { id: 'logs',    label: 'Activity',         icon: '◈', count: smLogs.length },
  ]

  return (
    <div className="flex flex-col h-full">
      <TabBar tabs={tabs} active={tab} onSelect={setTab} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {tab === 'sprint' && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Stories Done"   value={`${done.length}/${stories.length}`} color="#10B981" />
              <MetricCard label="Velocity"        value={`${velocity}pt`}                    color="#7C3AED" />
              <MetricCard label="QA Iterations"   value={state.qa_iterations || 0}           color="#F59E0B" />
            </div>

            {state.sprint_goal && (
              <SectionCard>
                <SectionHeader title="Sprint Goal" meta={`Status: ${state.sprint_status || 'PLANNING'}`} />
                <div className="p-4">
                  <p className="text-base font-semibold text-slate-100">{state.sprint_goal}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#7C3AED,#06B6D4)' }}
                        animate={{ width: `${stories.length ? Math.round((done.length / stories.length) * 100) : 0}%` }}
                        transition={{ duration: 0.6 }} />
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{done.length}/{stories.length} stories</span>
                  </div>
                </div>
              </SectionCard>
            )}

            <SectionCard>
              <SectionHeader title="Story Assignments" />
              <div className="divide-y divide-border">
                {stories.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xs font-mono text-slate-600 w-16 flex-shrink-0">{s.id}</span>
                    <span className="flex-1 text-sm text-slate-300 min-w-0 truncate">{s.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="badge badge-slate text-2xs">{s.story_points}pt</span>
                      <span className={`badge text-2xs ${s.status === 'DONE' ? 'badge-emerald' : 'badge-slate'}`}>{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {tab === 'retro' && (
          <>
            {sprintReport.summary && (
              <SectionCard>
                <SectionHeader title="Sprint Summary" />
                <div className="p-4">
                  <p className="text-sm text-slate-300 leading-relaxed">{sprintReport.summary}</p>
                </div>
              </SectionCard>
            )}
            {[
              { key: 'went_well', label: '✅ Went Well',     color: 'text-emerald-DEFAULT' },
              { key: 'improve',   label: '🔄 To Improve',    color: 'text-amber-DEFAULT' },
              { key: 'action_items', label: '⚡ Action Items', color: 'text-violet-light' },
            ].map(({ key, label, color }) => sprintReport[key]?.length > 0 && (
              <SectionCard key={key}>
                <SectionHeader title={label} />
                <ul className="p-4 space-y-2">
                  {sprintReport[key].map((item, i) => (
                    <li key={i} className={`flex items-start gap-2 text-sm ${color}`}>
                      <span className="flex-shrink-0 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ))}
            {!sprintReport.summary && (
              <div className="text-center py-12 text-slate-600 text-sm">Sprint review not yet complete</div>
            )}
          </>
        )}

        {tab === 'logs' && <AgentLogsView logs={smLogs} />}
      </div>
    </div>
  )
}

// ─── Dev View ─────────────────────────────────────────────────────────────────

function DevView({ state }) {
  const [selectedFile, setSelectedFile] = useState(0)
  const [tab, setTab] = useState('files')
  const files = state.code_artifacts || []
  const devLogs = (state.agent_logs || []).filter(l => l.agent === 'Dev')
  const active = files[selectedFile]

  const tabs = [
    { id: 'files',  label: 'Source Files', icon: '💾', count: files.length },
    { id: 'notes',  label: 'Dev Notes',    icon: '◈' },
    { id: 'logs',   label: 'Activity',     icon: '⌥', count: devLogs.length },
  ]

  if (files.length === 0 && tab === 'files') return (
    <div className="flex flex-col h-full">
      <TabBar tabs={tabs} active={tab} onSelect={setTab} />
      <div className="flex items-center justify-center flex-1 text-slate-600 text-sm">No code artifacts yet</div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <TabBar tabs={tabs} active={tab} onSelect={setTab} />

      {tab === 'files' && files.length > 0 && (
        <div className="flex flex-1 overflow-hidden">
          {/* File tree */}
          <div className="w-52 flex-shrink-0 border-r border-border overflow-y-auto py-2">
            <p className="section-label px-3 py-1.5">Files</p>
            {files.map((f, i) => (
              <button key={i} onClick={() => setSelectedFile(i)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-all text-xs
                  ${i === selectedFile ? 'surface-3 text-slate-100' : 'text-slate-500 hover:text-slate-300 hover:surface-2'}`}>
                <span>{fileIcon(f.filename)}</span>
                <span className="truncate font-mono">{f.filename?.split('/').pop()}</span>
              </button>
            ))}
          </div>

          {/* Code viewer */}
          {active && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* File header */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-bg-1 flex-shrink-0">
                <span className="text-base">{fileIcon(active.filename)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-slate-200 truncate">{active.filename}</p>
                  <p className="text-2xs text-slate-500">{active.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="badge badge-violet text-2xs font-mono">{active.language}</span>
                  <CopyButton text={active.content || ''} />
                </div>
              </div>

              {/* Code */}
              <div className="flex-1 overflow-auto">
                {active.content ? (
                  <SyntaxHighlighter
                    language={langFromFile(active.filename)}
                    style={CODE_THEME}
                    showLineNumbers
                    lineNumberStyle={{ color: '#334155', minWidth: '2.5rem', paddingRight: '1rem', userSelect: 'none' }}
                    wrapLongLines={false}
                    customStyle={{ margin: 0, borderRadius: 0, height: '100%', background: '#0D0D14', fontSize: '12px' }}
                  >
                    {active.content}
                  </SyntaxHighlighter>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600 text-sm">No content</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <SectionCard>
            <SectionHeader title="Implementation Notes" />
            <div className="p-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {state.agent_logs?.find(l => l.agent === 'Dev' && l.action === 'COMPLETE')?.data?.notes
                  || 'The Developer implemented all sprint stories following the architecture specifications.'}
              </p>
            </div>
          </SectionCard>
          <SectionCard>
            <SectionHeader title="Files Overview" />
            <div className="divide-y divide-border">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-base">{fileIcon(f.filename)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-violet-light truncate">{f.filename}</p>
                    <p className="text-xs text-slate-500">{f.description}</p>
                  </div>
                  <span className="badge badge-violet text-2xs">{f.language}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'logs' && (
        <div className="flex-1 overflow-y-auto p-5"><AgentLogsView logs={devLogs} /></div>
      )}
    </div>
  )
}

// ─── QA View ──────────────────────────────────────────────────────────────────

function QADetailView({ state }) {
  const [tab, setTab] = useState('summary')
  const [filter, setFilter] = useState('ALL')
  const tests = state.test_results || []
  const passed = tests.filter(t => t.status === 'PASS')
  const failed = tests.filter(t => t.status === 'FAIL')
  const bugs   = tests.filter(t => t.bug_report)
  const qaLogs = (state.agent_logs || []).filter(l => l.agent === 'QA')
  const pct    = tests.length > 0 ? Math.round((passed.length / tests.length) * 100) : 0

  const tabs = [
    { id: 'summary', label: 'Summary',      icon: '◎' },
    { id: 'cases',   label: 'Test Cases',   icon: '▦', count: tests.length },
    { id: 'bugs',    label: 'Bug Reports',  icon: '⚠', count: bugs.length },
    { id: 'logs',    label: 'Activity',     icon: '◈', count: qaLogs.length },
  ]

  const visibleTests = filter === 'ALL' ? tests : tests.filter(t => t.status === filter)

  return (
    <div className="flex flex-col h-full">
      <TabBar tabs={tabs} active={tab} onSelect={setTab} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {tab === 'summary' && (
          <>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="Passed"     value={passed.length}  color="#10B981" />
              <MetricCard label="Failed"     value={failed.length}  color="#F43F5E" />
              <MetricCard label="Total"      value={tests.length}   color="#06B6D4" />
              <MetricCard label="Pass Rate"  value={`${pct}%`}      color={pct === 100 ? '#10B981' : '#F59E0B'} />
            </div>

            <SectionCard>
              <SectionHeader title="Pass Rate" meta={`${state.qa_iterations || 1} QA iterations`} />
              <div className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: pct === 100 ? '#10B981' : 'linear-gradient(90deg,#F43F5E,#F59E0B,#10B981)' }}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
                  </div>
                  <span className="text-lg font-bold" style={{ color: pct === 100 ? '#10B981' : '#F59E0B' }}>{pct}%</span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-DEFAULT" />Passed: {passed.length}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-DEFAULT" />Failed: {failed.length}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" />Total: {tests.length}</span>
                </div>
              </div>
            </SectionCard>

            {state.code_artifacts?.length > 0 && (
              <SectionCard>
                <SectionHeader title="Code Coverage" />
                <div className="p-4 flex flex-wrap gap-2">
                  {state.code_artifacts.map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 badge badge-violet text-2xs">
                      {fileIcon(f.filename)} {f.filename?.split('/').pop()}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        )}

        {tab === 'cases' && (
          <>
            <div className="flex gap-2">
              {['ALL','PASS','FAIL'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`badge text-2xs cursor-pointer ${filter === f
                    ? f === 'PASS' ? 'badge-emerald' : f === 'FAIL' ? 'badge-rose' : 'badge-violet'
                    : 'badge-slate'}`}>
                  {f} {f === 'ALL' ? `(${tests.length})` : f === 'PASS' ? `(${passed.length})` : `(${failed.length})`}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {visibleTests.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`rounded-xl p-4 border ${
                    t.status === 'PASS' ? 'bg-emerald-dim border-emerald-DEFAULT/20' : 'bg-rose-dim border-rose-DEFAULT/20'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-lg flex-shrink-0 ${t.status === 'PASS' ? 'text-emerald-DEFAULT' : 'text-rose-DEFAULT'}`}>
                      {t.status === 'PASS' ? '✓' : '✕'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-slate-100">{t.test_name}</p>
                        <span className="badge badge-slate text-2xs font-mono">{t.story_id}</span>
                        <span className={`badge text-2xs ${t.status === 'PASS' ? 'badge-emerald' : 'badge-rose'}`}>{t.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{t.description}</p>
                      {t.bug_report && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-DEFAULT">
                          <span>⚠</span><span className="font-mono">{t.bug_report}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {visibleTests.length === 0 && (
                <div className="text-center py-12 text-slate-600 text-sm">No {filter.toLowerCase()} tests</div>
              )}
            </div>
          </>
        )}

        {tab === 'bugs' && (
          <div className="space-y-3">
            {bugs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-3">✅</p>
                <p className="text-sm text-slate-400 font-medium">No bugs reported</p>
                <p className="text-xs text-slate-600 mt-1">All tests passed without issues</p>
              </div>
            ) : bugs.map((t, i) => (
              <SectionCard key={i}>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-rose text-2xs">BUG</span>
                    <span className="text-sm font-semibold text-slate-100">{t.test_name}</span>
                  </div>
                  <p className="text-xs text-rose-DEFAULT font-mono">{t.bug_report}</p>
                  <p className="text-xs text-slate-500">{t.description}</p>
                </div>
              </SectionCard>
            ))}
          </div>
        )}

        {tab === 'logs' && <AgentLogsView logs={qaLogs} />}
      </div>
    </div>
  )
}

// ─── Doc View ─────────────────────────────────────────────────────────────────

function DocView({ state }) {
  const [tab, setTab] = useState('release')
  let docData = {}
  try { docData = JSON.parse(state.documentation || '{}') } catch {}
  const docLogs = (state.agent_logs || []).filter(l => l.agent === 'Doc')

  const apiRef  = docData.api_reference
  const arch    = docData.architecture_guide
  const runbook = docData.runbook
  const decLog  = docData.decision_log

  const tabs = [
    { id: 'release',  label: '🚀 Release Notes',     show: !!state.release_notes },
    { id: 'api',      label: '📡 API Reference',      show: !!apiRef },
    { id: 'arch',     label: '🏗 Architecture Guide', show: !!arch },
    { id: 'runbook',  label: '📋 Runbook',            show: !!runbook },
    { id: 'decisions',label: '🗂 Decisions',           show: !!decLog?.length },
    { id: 'logs',     label: '◈ Activity',            show: true, count: docLogs.length },
  ].filter(t => t.show)

  return (
    <div className="flex flex-col h-full">
      <TabBar tabs={tabs} active={tab} onSelect={setTab} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {tab === 'release' && state.release_notes && (
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-slate-100 prose-p:text-slate-400 prose-li:text-slate-400
            prose-code:text-violet-light prose-code:bg-bg-3 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-strong:text-slate-200 prose-h1:text-xl prose-h2:text-base prose-h3:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.release_notes}</ReactMarkdown>
          </div>
        )}

        {tab === 'api' && apiRef && (
          <div className="space-y-4">
            {apiRef.authentication && (
              <SectionCard>
                <SectionHeader title="Authentication" />
                <div className="p-4 grid grid-cols-2 gap-3">
                  {Object.entries(apiRef.authentication).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-2xs text-slate-500 capitalize mb-0.5">{k.replace(/_/g,' ')}</p>
                      <p className="text-xs text-slate-200 font-mono">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
            <div className="space-y-2">
              {(apiRef.endpoints || []).map((ep, i) => (
                <SectionCard key={i}>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                        ep.method === 'GET' ? 'bg-emerald-dim text-emerald-DEFAULT' :
                        ep.method === 'POST' ? 'bg-cyan-dim text-cyan-DEFAULT' :
                        ep.method === 'PUT' || ep.method === 'PATCH' ? 'bg-amber-dim text-amber-DEFAULT' :
                        'bg-rose-dim text-rose-DEFAULT'}`}>{ep.method}</span>
                      <code className="text-sm font-mono text-violet-light">{ep.path}</code>
                      {ep.group && <span className="badge badge-slate text-2xs">{ep.group}</span>}
                      {ep.auth_required === false && <span className="badge badge-amber text-2xs">public</span>}
                    </div>
                    <p className="text-sm text-slate-300">{ep.summary}</p>
                    {ep.curl_example && (
                      <div>
                        <p className="section-label mb-1.5">cURL Example</p>
                        <div className="relative">
                          <SyntaxHighlighter language="bash" style={CODE_THEME}
                            customStyle={{ margin: 0, borderRadius: '8px', fontSize: '11px' }}>
                            {ep.curl_example}
                          </SyntaxHighlighter>
                          <div className="absolute top-2 right-2"><CopyButton text={ep.curl_example} /></div>
                        </div>
                      </div>
                    )}
                    {ep.response_example && (
                      <div>
                        <p className="section-label mb-1.5">Response 200</p>
                        <SyntaxHighlighter language="json" style={CODE_THEME}
                          customStyle={{ margin: 0, borderRadius: '8px', fontSize: '11px' }}>
                          {JSON.stringify(ep.response_example, null, 2)}
                        </SyntaxHighlighter>
                      </div>
                    )}
                  </div>
                </SectionCard>
              ))}
            </div>
            {apiRef.error_codes?.length > 0 && (
              <SectionCard>
                <SectionHeader title="Error Codes" />
                <div className="divide-y divide-border">
                  {apiRef.error_codes.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="badge badge-rose text-2xs flex-shrink-0">{e.code}</span>
                      <p className="text-sm text-slate-400">{e.meaning}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {tab === 'arch' && arch && (
          <div className="space-y-4">
            {arch.overview && (
              <SectionCard>
                <SectionHeader title="Overview" />
                <div className="p-4">
                  <p className="text-sm text-slate-300 leading-relaxed">{arch.overview}</p>
                </div>
              </SectionCard>
            )}
            {arch.getting_started?.local_setup?.length > 0 && (
              <SectionCard>
                <SectionHeader title="Local Setup" />
                <div className="p-4">
                  <SyntaxHighlighter language="bash" style={CODE_THEME}
                    customStyle={{ margin: 0, borderRadius: '8px', fontSize: '12px' }}>
                    {arch.getting_started.local_setup.join('\n')}
                  </SyntaxHighlighter>
                </div>
              </SectionCard>
            )}
            {arch.getting_started?.environment_variables?.length > 0 && (
              <SectionCard>
                <SectionHeader title="Environment Variables" />
                <div className="divide-y divide-border">
                  {arch.getting_started.environment_variables.map((v, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <code className="text-sm font-mono text-violet-light">{v.name}</code>
                        {v.required && <span className="badge badge-rose text-2xs">required</span>}
                      </div>
                      <p className="text-xs text-slate-500">{v.description}</p>
                      {v.example && <p className="text-2xs text-slate-600 font-mono mt-0.5">e.g. {v.example}</p>}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
            {arch.key_patterns?.length > 0 && (
              <SectionCard>
                <SectionHeader title="Key Patterns" />
                <ul className="p-4 space-y-2">
                  {arch.key_patterns.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-violet-light mt-0.5">→</span><span>{p}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </div>
        )}

        {tab === 'runbook' && runbook && (
          <div className="space-y-4">
            {runbook.deployment && (
              <SectionCard>
                <SectionHeader title="Deployment" />
                <div className="p-4 space-y-3">
                  {Object.entries(runbook.deployment).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-2xs text-slate-500 capitalize mb-1">{k.replace(/_/g,' ')}</p>
                      <p className="text-sm text-slate-300">{v}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
            {runbook.monitoring?.alerts?.length > 0 && (
              <SectionCard>
                <SectionHeader title="Alerts" />
                <div className="divide-y divide-border">
                  {runbook.monitoring.alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="badge badge-amber text-2xs flex-shrink-0 mt-0.5">ALERT</span>
                      <div>
                        <p className="text-xs font-mono text-amber-DEFAULT">{a.metric}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{a.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
            {runbook.incident_response?.length > 0 && (
              <SectionCard>
                <SectionHeader title="Incident Response" />
                <ol className="p-4 space-y-2">
                  {runbook.incident_response.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="text-violet-light font-mono font-bold flex-shrink-0 w-5">{i+1}.</span>
                      <span className="text-slate-300">{step.replace(/^\d+\.\s*/,'')}</span>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            )}
            {runbook.common_issues?.length > 0 && (
              <SectionCard>
                <SectionHeader title="Common Issues" />
                <div className="divide-y divide-border">
                  {runbook.common_issues.map((issue, i) => (
                    <div key={i} className="p-4 space-y-1.5">
                      <p className="text-sm font-medium text-amber-DEFAULT">⚠ {issue.symptom}</p>
                      <p className="text-xs text-slate-500">Cause: {issue.likely_cause}</p>
                      <p className="text-xs text-emerald-DEFAULT">Fix: {issue.fix}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {tab === 'decisions' && decLog?.length > 0 && (
          <div className="space-y-3">
            {decLog.map((d, i) => (
              <SectionCard key={i}>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-amber text-2xs">{d.date}</span>
                    <p className="text-sm font-semibold text-slate-100">{d.decision}</p>
                  </div>
                  <p className="text-xs text-slate-500">Made by: {d.made_by}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{d.rationale}</p>
                  {d.impact && <p className="text-xs text-violet-light">Impact: {d.impact}</p>}
                </div>
              </SectionCard>
            ))}
          </div>
        )}

        {tab === 'logs' && <AgentLogsView logs={docLogs} />}
      </div>
    </div>
  )
}

// ─── Agent logs view ──────────────────────────────────────────────────────────

function AgentLogsView({ logs = [] }) {
  if (logs.length === 0) return (
    <div className="text-center py-12 text-slate-600 text-sm">No activity logged yet</div>
  )
  return (
    <div className="space-y-2">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg surface-3 border border-border">
          <div className="flex flex-col items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-DEFAULT mt-1.5 flex-shrink-0" />
            {i < logs.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="badge badge-slate text-2xs font-mono">{log.action}</span>
              <span className="text-2xs text-slate-600 font-mono">
                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}) : ''}
              </span>
            </div>
            <p className="text-sm text-slate-300">{log.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

const AGENT_META = {
  PO:  { label: 'Product Owner',  sub: 'Stories & Backlog',  color: '#F43F5E', icon: '◈', View: POView },
  SM:  { label: 'Scrum Master',   sub: 'Sprint & Planning',  color: '#F59E0B', icon: '⚡', View: SMView },
  AA:  { label: 'Architect',      sub: 'System Design',      color: '#06B6D4', icon: '⬡', View: null },
  Dev: { label: 'Developer',      sub: 'Implementation',     color: '#7C3AED', icon: '⌥', View: DevView },
  QA:  { label: 'QA Engineer',    sub: 'Testing & Quality',  color: '#10B981', icon: '◎', View: QADetailView },
  Doc: { label: 'Doc Engineer',   sub: 'Docs & Release',     color: '#FB923C', icon: '◻', View: DocView },
}

export default function AgentDrawer({ agentShort, state, onClose, ArchitectureViewerComponent }) {
  if (!agentShort) return null
  const meta = AGENT_META[agentShort]
  if (!meta) return null

  const ViewComponent = agentShort === 'AA' ? ArchitectureViewerComponent : meta.View

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />

      <motion.div key="drawer"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{ width: 'min(760px, 90vw)', background: '#0F0F16', borderLeft: '1px solid rgba(255,255,255,0.09)', boxShadow: '-24px 0 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-border flex-shrink-0"
          style={{ background: '#111118' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: meta.color + '18', border: `1px solid ${meta.color}30`, color: meta.color }}>
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-100">{meta.label}</h2>
            <p className="text-xs text-slate-500">{meta.sub}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {state.completed_agents?.some(a => a.includes(agentShort.toLowerCase())) && (
              <span className="badge badge-emerald text-2xs">Completed</span>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:surface-3 transition-all text-sm">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {agentShort === 'AA' ? (
            <div className="p-5 h-full overflow-y-auto">
              <ViewComponent architecture={state.architecture} />
            </div>
          ) : ViewComponent ? (
            <ViewComponent state={state} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">No output yet</div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
