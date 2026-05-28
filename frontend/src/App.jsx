import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AgentRoster from './components/AgentRoster'
import SprintBoard from './components/SprintBoard'
import ActivityFeed from './components/ActivityFeed'
import ArchitectureViewer from './components/ArchitectureViewer'
import QAPanel from './components/QAPanel'
import DocumentationPanel from './components/DocumentationPanel'
import StartModal from './components/StartModal'
import { useWebSocket } from './hooks/useWebSocket'
import { API_BASE } from './config'

const INITIAL_STATE = {
  project_name: '',
  requirement: '',
  current_sprint: 1,
  sprint_goal: '',
  sprint_status: '',
  product_backlog: [],
  sprint_backlog: [],
  architecture: null,
  code_artifacts: [],
  test_results: [],
  qa_iterations: 0,
  all_tests_passed: false,
  documentation: '',
  sprint_notes: '',
  release_notes: '',
  current_agent: '',
  agent_logs: [],
  completed_agents: [],
  workflow_complete: false,
  error: null,
}

export default function App() {
  const [showModal, setShowModal] = useState(true)
  const [sessionId, setSessionId] = useState(null)
  const [scrumState, setScrumState] = useState(INITIAL_STATE)
  const [isRunning, setIsRunning] = useState(false)
  const [activeSection, setActiveSection] = useState('board')
  const [agentStream, setAgentStream] = useState({ agent: '', text: '', role: '' })
  const [agentStatuses, setAgentStatuses] = useState({})

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'workflow_start') {
      setIsRunning(true)
      setAgentStream({ agent: '', text: '', role: '' })
      setAgentStatuses({})
      setScrumState(prev => ({ ...prev, ...msg.data }))
    } else if (msg.type === 'state_update' || msg.type === 'state_sync') {
      setScrumState(prev => ({ ...prev, ...msg.data }))
    } else if (msg.type === 'workflow_complete') {
      setScrumState(prev => ({ ...prev, ...msg.data }))
      setAgentStream({ agent: '', text: '', role: '' })
      setIsRunning(false)
    } else if (msg.type === 'workflow_error') {
      setScrumState(prev => ({ ...prev, ...msg.data, error: msg.data.error }))
      setIsRunning(false)
    } else if (msg.type === 'agent_chunk') {
      // Live token stream from the active agent
      setAgentStream(prev => ({
        agent: msg.agent,
        text: prev.agent === msg.agent ? prev.text + msg.chunk : msg.chunk,
        role: msg.agent
      }))
    } else if (msg.type === 'agent_status') {
      setAgentStatuses(prev => ({ ...prev, [msg.agent]: msg }))
      // Clear stream when agent finishes
      if (msg.status === 'DONE') {
        setAgentStream(prev => prev.agent === msg.agent ? { agent: '', text: '', role: '' } : prev)
      }
    }
  }, [])

  const { connected } = useWebSocket(sessionId, handleWsMessage)

  const handleStart = async ({ project_name, requirement, openai_api_key }) => {
    const res = await fetch(`${API_BASE}/api/start-sprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_name, requirement, openai_api_key })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Failed to start sprint')
    }
    const data = await res.json()
    setSessionId(data.session_id)
    setScrumState(prev => ({ ...INITIAL_STATE, project_name, requirement }))
    setShowModal(false)
    setIsRunning(true)
  }

  const handleNewSprint = () => {
    setSessionId(null)
    setScrumState(INITIAL_STATE)
    setIsRunning(false)
    setShowModal(true)
  }

  const totalStories = scrumState.sprint_backlog.length
  const doneStories = scrumState.sprint_backlog.filter(s => s.status === 'DONE').length
  const progress = totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0

  const sections = [
    { id: 'board', label: '📋 Sprint Board', show: true },
    { id: 'arch', label: '🏛️ Architecture', show: !!scrumState.architecture },
    { id: 'qa', label: '🔬 QA & Code', show: scrumState.test_results.length > 0 || scrumState.code_artifacts.length > 0 },
    { id: 'docs', label: '📚 Docs', show: !!(scrumState.documentation || scrumState.release_notes) },
  ]

  return (
    <div className="min-h-screen bg-dark-900 bg-grid text-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 glass border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-lg"
            style={{ boxShadow: '0 0 15px rgba(157,78,221,0.5)' }}>
            🤖
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text leading-tight">Scrum AI Board</h1>
            <p className="text-[10px] text-slate-500">Powered by LangGraph + GPT-4o</p>
          </div>
        </div>

        {scrumState.project_name && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-700/50">
            <span className="text-sm font-semibold text-white">{scrumState.project_name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30 font-mono">
              Sprint {scrumState.current_sprint}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 ml-auto">
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
              <span className="text-xs text-neon-green font-semibold">AGENTS RUNNING</span>
            </div>
          )}
          {scrumState.workflow_complete && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neon-green">✅ Sprint Complete!</span>
            </div>
          )}
          {sessionId && (
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-neon-green' : 'bg-red-500'}`} />
              <span className="text-[10px] text-slate-500">{connected ? 'Live' : 'Disconnected'}</span>
            </div>
          )}
          <button
            onClick={handleNewSprint}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-all"
          >
            + New Sprint
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Agent Roster */}
        <aside className="w-56 flex-shrink-0 glass border-r border-white/5 p-3 overflow-y-auto">
          <AgentRoster
            currentAgent={scrumState.current_agent}
            completedAgents={scrumState.completed_agents}
            agentLogs={scrumState.agent_logs}
            agentStatuses={agentStatuses}
            streamingAgent={agentStream.agent}
          />
        </aside>

        {/* Center - Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Section Tabs */}
          <div className="flex-shrink-0 flex items-center gap-1 px-4 pt-3 pb-0 border-b border-white/5">
            {sections.map(sec => (
              (sec.show || sec.id === 'board') && (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all ${
                    activeSection === sec.id
                      ? 'bg-dark-600 text-white border-t border-l border-r border-white/10'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {sec.label}
                </button>
              )
            ))}

            {/* Progress bar */}
            {totalStories > 0 && (
              <div className="ml-auto flex items-center gap-2 pr-2">
                <div className="w-32 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-neon-blue to-neon-green rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{doneStories}/{totalStories} stories</span>
              </div>
            )}
          </div>

          {/* Section Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {activeSection === 'board' && (
                <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SprintBoard
                    sprintBacklog={scrumState.sprint_backlog}
                    productBacklog={scrumState.product_backlog}
                    sprintGoal={scrumState.sprint_goal}
                    sprintStatus={scrumState.sprint_status}
                  />
                </motion.div>
              )}
              {activeSection === 'arch' && (
                <motion.div key="arch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ArchitectureViewer architecture={scrumState.architecture} />
                </motion.div>
              )}
              {activeSection === 'qa' && (
                <motion.div key="qa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <QAPanel
                    testResults={scrumState.test_results}
                    qaIterations={scrumState.qa_iterations}
                    codeArtifacts={scrumState.code_artifacts}
                  />
                </motion.div>
              )}
              {activeSection === 'docs' && (
                <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <DocumentationPanel
                    documentation={scrumState.documentation}
                    releaseNotes={scrumState.release_notes}
                    sprintNotes={scrumState.sprint_notes}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Banner */}
            {scrumState.error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm"
              >
                ⚠️ {scrumState.error}
              </motion.div>
            )}

            {/* Empty state */}
            {!sessionId && !showModal && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <span className="text-5xl mb-3">🚀</span>
                <h3 className="text-lg font-bold gradient-text mb-1">Ready to Ship!</h3>
                <p className="text-slate-500 text-sm">Click "New Sprint" to start your AI-powered Scrum board</p>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Activity Feed */}
        <aside className="w-72 flex-shrink-0 glass border-l border-white/5 p-3 flex flex-col overflow-hidden">
          <ActivityFeed
            logs={scrumState.agent_logs}
            currentAgent={scrumState.current_agent}
            isRunning={isRunning}
            agentStream={agentStream}
          />
        </aside>
      </div>

      <StartModal isOpen={showModal} onStart={handleStart} />
    </div>
  )
}
