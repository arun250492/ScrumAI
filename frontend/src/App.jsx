import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AgentRoster from './components/AgentRoster'
import SprintBoard from './components/SprintBoard'
import ActivityFeed from './components/ActivityFeed'
import ArchitectureViewer from './components/ArchitectureViewer'
import QAPanel from './components/QAPanel'
import DocumentationPanel from './components/DocumentationPanel'
import StartModal from './components/StartModal'
import IntegrationPanel from './components/IntegrationPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { API_BASE } from './config'

const INIT = {
  session_id: '', project_name: '', requirement: '',
  current_sprint: 1, sprint_goal: '', sprint_status: '',
  product_backlog: [], sprint_backlog: [],
  architecture: null, code_artifacts: [], test_results: [],
  qa_iterations: 0, all_tests_passed: false,
  documentation: '', sprint_notes: '', release_notes: '',
  current_agent: '', agent_logs: [], completed_agents: [],
  workflow_complete: false, error: null,
}

const SECTIONS = [
  { id: 'board',  label: 'Sprint Board',     icon: '▦' },
  { id: 'arch',   label: 'Architecture',     icon: '⬡' },
  { id: 'qa',     label: 'QA & Code',        icon: '◎' },
  { id: 'docs',   label: 'Documentation',    icon: '◻' },
]

export default function App() {
  const [showModal,  setShowModal]   = useState(true)
  const [showInteg,  setShowInteg]   = useState(false)
  const [sessionId,  setSessionId]   = useState(null)
  const [state,      setState]       = useState(INIT)
  const [isRunning,  setIsRunning]   = useState(false)
  const [section,    setSection]     = useState('board')
  const [agentStream, setAgentStream]   = useState({ agent: '', text: '' })
  const [agentStatuses, setAgentStatuses] = useState({})

  const onWs = useCallback((msg) => {
    if (msg.type === 'workflow_start') {
      setIsRunning(true); setAgentStream({ agent: '', text: '' }); setAgentStatuses({})
      setState(p => ({ ...p, ...msg.data }))
    } else if (msg.type === 'state_update' || msg.type === 'state_sync') {
      setState(p => ({ ...p, ...msg.data }))
    } else if (msg.type === 'workflow_complete') {
      setState(p => ({ ...p, ...msg.data })); setAgentStream({ agent: '', text: '' }); setIsRunning(false)
    } else if (msg.type === 'workflow_error') {
      setState(p => ({ ...p, ...msg.data })); setIsRunning(false)
    } else if (msg.type === 'agent_chunk') {
      setAgentStream(p => ({
        agent: msg.agent,
        text: p.agent === msg.agent ? (p.text + msg.chunk).slice(-1200) : msg.chunk
      }))
    } else if (msg.type === 'agent_status') {
      setAgentStatuses(p => ({ ...p, [msg.agent]: msg }))
      if (msg.status === 'DONE') setAgentStream(p => p.agent === msg.agent ? { agent: '', text: '' } : p)
    }
  }, [])

  const { connected } = useWebSocket(sessionId, onWs)

  const handleStart = async ({ project_name, requirement, openai_api_key }) => {
    const r = await fetch(`${API_BASE}/api/start-sprint`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_name, requirement, openai_api_key })
    })
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Failed') }
    const data = await r.json()
    setSessionId(data.session_id)
    setState({ ...INIT, project_name, requirement })
    setShowModal(false); setIsRunning(true)
  }

  const newSprint = () => { setSessionId(null); setState(INIT); setIsRunning(false); setShowModal(true); setSection('board') }

  const total = state.sprint_backlog.length
  const done  = state.sprint_backlog.filter(s => s.status === 'DONE').length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const sectionVisible = (id) => {
    if (id === 'board') return true
    if (id === 'arch')  return !!state.architecture
    if (id === 'qa')    return state.test_results.length > 0 || state.code_artifacts.length > 0
    if (id === 'docs')  return !!(state.documentation || state.release_notes)
    return false
  }

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center gap-4 px-5 h-12 border-b border-border"
        style={{ background: '#0F0F16' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>🤖</div>
          <span className="text-sm font-semibold text-slate-100">Scrum<span className="text-gradient">AI</span></span>
        </div>

        <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />

        {/* Project + sprint */}
        {state.project_name ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-slate-200">{state.project_name}</span>
            <span className="badge badge-violet text-2xs">Sprint {state.current_sprint}</span>
            {state.sprint_status === 'DONE' && <span className="badge badge-emerald text-2xs">Complete</span>}
          </div>
        ) : (
          <span className="text-sm text-slate-600">No active sprint</span>
        )}

        {/* Section nav */}
        <nav className="flex items-center gap-0.5 mx-auto">
          {SECTIONS.map(s => sectionVisible(s.id) && (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150
                ${section === s.id ? 'surface-3 text-slate-100' : 'text-slate-500 hover:text-slate-300 hover:surface-2'}`}>
              <span className="font-mono text-xs">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {/* Live indicator */}
          {isRunning && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md surface-3 border border-emerald-DEFAULT/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-DEFAULT animate-pulse-dot" />
              <span className="text-xs text-emerald-DEFAULT font-medium">Agents running</span>
            </div>
          )}

          {/* Progress pill */}
          {total > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md surface-3 border border-border">
              <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#7C3AED,#06B6D4)' }}
                  animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
              </div>
              <span className="text-2xs text-slate-400 font-mono">{done}/{total}</span>
            </div>
          )}

          {/* WS dot */}
          {sessionId && (
            <div className="flex items-center gap-1" title={connected ? 'Connected' : 'Disconnected'}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-DEFAULT' : 'bg-rose-DEFAULT'}`} />
            </div>
          )}

          {/* Integrations */}
          <button onClick={() => setShowInteg(true)} className="btn-ghost text-xs gap-1.5 border border-border">
            <span>⬡</span> Integrations
          </button>

          <button onClick={newSprint} className="btn-primary text-xs py-1.5">+ New Sprint</button>
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left sidebar — Agent roster */}
        <aside className="w-52 flex-shrink-0 border-r border-border overflow-y-auto" style={{ background: '#0F0F16' }}>
          <AgentRoster
            currentAgent={state.current_agent}
            completedAgents={state.completed_agents}
            agentLogs={state.agent_logs}
            agentStatuses={agentStatuses}
            streamingAgent={agentStream.agent}
          />
        </aside>

        {/* Center — Section content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5">
            <AnimatePresence mode="wait">
              {section === 'board' && (
                <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {!state.sprint_goal && !isRunning ? (
                    <EmptyBoard onStart={() => setShowModal(true)} />
                  ) : (
                    <SprintBoard
                      sprintBacklog={state.sprint_backlog}
                      productBacklog={state.product_backlog}
                      sprintGoal={state.sprint_goal}
                      sprintStatus={state.sprint_status}
                    />
                  )}
                </motion.div>
              )}
              {section === 'arch' && (
                <motion.div key="arch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ArchitectureViewer architecture={state.architecture} />
                </motion.div>
              )}
              {section === 'qa' && (
                <motion.div key="qa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <QAPanel testResults={state.test_results} qaIterations={state.qa_iterations} codeArtifacts={state.code_artifacts} />
                </motion.div>
              )}
              {section === 'docs' && (
                <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <DocumentationPanel documentation={state.documentation} releaseNotes={state.release_notes} sprintNotes={state.sprint_notes} />
                </motion.div>
              )}
            </AnimatePresence>

            {state.error && (
              <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-dim border border-rose-DEFAULT/25 text-rose-DEFAULT text-sm">
                <span>⚠</span><span>{state.error}</span>
              </div>
            )}
          </div>
        </main>

        {/* Right sidebar — Activity feed */}
        <aside className="w-72 flex-shrink-0 border-l border-border flex flex-col p-3 overflow-hidden" style={{ background: '#0F0F16' }}>
          <ActivityFeed
            logs={state.agent_logs}
            currentAgent={state.current_agent}
            isRunning={isRunning}
            agentStream={agentStream}
          />
        </aside>
      </div>

      {/* Modals */}
      <StartModal isOpen={showModal} onStart={handleStart} />
      <IntegrationPanel isOpen={showInteg} onClose={() => setShowInteg(false)} sprintState={state} />
    </div>
  )
}

function EmptyBoard({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-16 h-16 rounded-2xl surface-3 flex items-center justify-center text-3xl mb-5 border border-border">🤖</div>
      <h3 className="text-xl font-semibold text-slate-100 mb-2">No active sprint</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        Start a sprint and watch 6 AI agents run a complete Scrum cycle — stories, architecture, code, tests, and docs.
      </p>
      <button onClick={onStart} className="btn-primary px-6 py-2.5">Launch Sprint →</button>
    </div>
  )
}
