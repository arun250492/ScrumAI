import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const AGENT_STYLES = {
  PO:  { bg: 'bg-pink-900/30', border: 'border-pink-500/30', badge: 'bg-pink-500/20 text-pink-300', icon: '🎯' },
  SM:  { bg: 'bg-yellow-900/30', border: 'border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-300', icon: '⚡' },
  AA:  { bg: 'bg-cyan-900/30', border: 'border-cyan-500/30', badge: 'bg-cyan-500/20 text-cyan-300', icon: '🏗️' },
  Dev: { bg: 'bg-purple-900/30', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300', icon: '💻' },
  QA:  { bg: 'bg-green-900/30', border: 'border-green-500/30', badge: 'bg-green-500/20 text-green-300', icon: '🔬' },
  Doc: { bg: 'bg-orange-900/30', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300', icon: '📚' },
}

const ACTION_ICONS = {
  START: '▶',
  COMPLETE: '✅',
  CREATE_STORY: '📝',
  CREATE_SPRINT: '🚀',
  ARCHITECTURE_DESIGNED: '🏛️',
  CODE_WRITTEN: '💾',
  TEST_CREATED: '🧪',
  TESTS_RUN: '⚙️',
  BUG_LOGGED: '🐛',
  DOC_CREATED: '📄',
  SPRINT_COMPLETE: '🏆',
  DEFAULT: '•'
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ''
  }
}

export default function ActivityFeed({ logs = [], currentAgent, isRunning, agentStream = {} }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-neon-green animate-ping' : 'bg-slate-600'}`} />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Live Activity Feed</h2>
        </div>
        <span className="text-[10px] text-slate-600 font-mono">{logs.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence initial={false}>
          {logs.map((log, i) => {
            const style = AGENT_STYLES[log.agent] || AGENT_STYLES.PO
            const actionIcon = ACTION_ICONS[log.action] || ACTION_ICONS.DEFAULT

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`activity-item rounded-lg p-2.5 border ${style.bg} ${style.border}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0 mt-0.5">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold font-mono ${style.badge}`}>
                        {log.agent}
                      </span>
                      <span className="text-[10px] text-slate-500">{actionIcon}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.action}</span>
                      <span className="ml-auto text-[10px] text-slate-600 font-mono">{formatTime(log.timestamp)}</span>
                    </div>
                    <p className="text-[12px] text-slate-300 leading-relaxed">{log.message}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Live token stream panel */}
        {isRunning && agentStream.text && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-neon-blue/30 bg-neon-blue/5 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-neon-blue/10 border-b border-neon-blue/20">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-ping" />
              <span className="text-[10px] font-mono font-bold text-neon-blue">
                {agentStream.agent} · THINKING
              </span>
            </div>
            <div className="p-2.5 max-h-32 overflow-y-auto">
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                {agentStream.text}
                <span className="inline-block w-1.5 h-3 bg-neon-blue ml-0.5 animate-pulse align-middle" />
              </p>
            </div>
          </motion.div>
        )}

        {isRunning && !agentStream.text && currentAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-neon-green/5 border border-neon-green/20"
          >
            <div className="typing-indicator flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
            </div>
            <span className="text-[11px] text-neon-green">Connecting to agent...</span>
          </motion.div>
        )}

        {logs.length === 0 && !isRunning && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <span className="text-3xl mb-2">🤖</span>
            <p className="text-sm text-slate-500">No activity yet</p>
            <p className="text-xs text-slate-600">Start a sprint to see agents in action</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
