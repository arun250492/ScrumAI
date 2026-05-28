import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const AGENT_COLOR = {
  PO:  '#F43F5E', SM: '#F59E0B', AA: '#06B6D4',
  Dev: '#7C3AED', QA: '#10B981', Doc: '#FB923C',
}

const ACTION_ICON = {
  START: '▶', COMPLETE: '✓', CREATE_STORY: '＋', CREATE_SPRINT: '🚀',
  ARCHITECTURE_DESIGNED: '⬡', SECURITY_REVIEW: '🔒', INFRA_DESIGN: '☁',
  CODE_WRITTEN: '⎇', TEST_PASS: '✓', TEST_FAIL: '✕', BUG_LOGGED: '⚠',
  DOC_CREATED: '◻', SPRINT_COMPLETE: '★', QA_COMPLETE: '◎',
  DEFAULT: '·',
}

function ts(t) {
  try { return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
  catch { return '' }
}

export default function ActivityFeed({ logs = [], currentAgent, isRunning, agentStream = {} }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length, agentStream.text])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-DEFAULT animate-pulse-dot' : 'bg-slate-600'}`} />
          <span className="section-label">Live Feed</span>
        </div>
        <span className="text-2xs text-slate-600 font-mono">{logs.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        <AnimatePresence initial={false}>
          {logs.map((log, i) => {
            const color = AGENT_COLOR[log.agent] || '#64748B'
            const icon  = ACTION_ICON[log.action] || ACTION_ICON.DEFAULT
            const isGood = log.action?.includes('PASS') || log.action?.includes('COMPLETE')
            const isBad  = log.action?.includes('FAIL') || log.action?.includes('BUG')

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="group flex gap-2.5 px-2 py-2 rounded-md hover:surface-3 transition-colors"
              >
                {/* Agent dot */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-2xs font-bold font-mono"
                    style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
                    {log.agent?.slice(0, 2)}
                  </div>
                  {i < logs.length - 1 && <div className="w-px h-3 bg-white/5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-2xs font-mono" style={{ color: color + 'BB' }}>{icon}</span>
                    <span className={`text-xs leading-snug font-medium ${
                      isGood ? 'text-emerald-DEFAULT' : isBad ? 'text-rose-DEFAULT' : 'text-slate-300'
                    }`}>{log.message}</span>
                  </div>
                  <span className="text-2xs text-slate-600 font-mono">{ts(log.timestamp)}</span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Live stream panel */}
        <AnimatePresence>
          {isRunning && agentStream.text && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-2 mt-2 rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.06)' }}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-violet-glow/30">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-DEFAULT animate-pulse" />
                <span className="text-2xs font-mono font-semibold text-violet-light">{agentStream.agent} · streaming</span>
                <span className="ml-auto text-2xs text-slate-600">{agentStream.text.length} chars</span>
              </div>
              <div className="px-3 py-2.5 max-h-36 overflow-y-auto">
                <p className="text-xs text-slate-400 font-mono leading-relaxed whitespace-pre-wrap break-words">
                  {agentStream.text.slice(-800)}
                  <span className="stream-cursor" />
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle state */}
        {logs.length === 0 && !isRunning && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <div className="w-10 h-10 rounded-xl surface-3 flex items-center justify-center text-xl mb-3">🤖</div>
            <p className="text-sm font-medium text-slate-400 mb-1">No activity yet</p>
            <p className="text-xs text-slate-600">Start a sprint to watch agents collaborate in real time</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
