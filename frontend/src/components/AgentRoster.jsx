import { motion, AnimatePresence } from 'framer-motion'

const AGENTS = [
  { id: 'product_owner',    short: 'PO',  label: 'Product Owner',  sub: 'Stories & Backlog',  icon: '◈', color: '#F43F5E' },
  { id: 'scrum_master',     short: 'SM',  label: 'Scrum Master',   sub: 'Sprint & Planning',  icon: '⚡', color: '#F59E0B' },
  { id: 'architect',        short: 'AA',  label: 'Architect',      sub: 'System Design',      icon: '⬡', color: '#06B6D4' },
  { id: 'developer',        short: 'Dev', label: 'Developer',      sub: 'Implementation',     icon: '⌥', color: '#7C3AED' },
  { id: 'qa',               short: 'QA',  label: 'QA Engineer',    sub: 'Testing & Quality',  icon: '◎', color: '#10B981' },
  { id: 'documentation',    short: 'Doc', label: 'Doc Engineer',   sub: 'Docs & Release',     icon: '◻', color: '#FB923C' },
]

function status(agentId, current, completed) {
  const norm = (current || '').replace('scrum_master_plan','scrum_master').replace('scrum_master_review','scrum_master')
  if (norm === agentId) return 'active'
  if ((completed || []).some(c => c.includes(agentId))) return 'done'
  return 'idle'
}

export default function AgentRoster({ currentAgent, completedAgents = [], agentLogs = [], agentStatuses = {}, streamingAgent = '', onAgentClick }) {
  return (
    <nav className="flex flex-col gap-0.5 py-2">
      <div className="flex items-center justify-between px-3 py-1.5">
        <p className="section-label">Agent Squad</p>
        <span className="text-2xs text-slate-600">click to inspect</span>
      </div>
      {AGENTS.map((a, i) => {
        const s = status(a.id, currentAgent, completedAgents)
        const isStream = streamingAgent === a.short
        const liveMsg = agentStatuses[a.short]?.message
        const lastLog = agentLogs.filter(l => l.agent === a.short).slice(-1)[0]
        const msg = liveMsg || lastLog?.message || a.sub
        const isActive = s === 'active' || isStream
        const isDone = s === 'done'

        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onAgentClick && onAgentClick(a.short)}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-md mx-1 transition-all duration-150 cursor-pointer group"
            style={{
              background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
              boxShadow: isStream
                ? '0 0 0 1px rgba(124,58,237,0.5)'
                : isActive
                ? '0 0 0 1px rgba(16,185,129,0.35)'
                : 'none',
            }}
          >
            {/* Hover highlight */}
            <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: isDone || isActive ? `${a.color}08` : 'rgba(255,255,255,0.03)' }} />

            {/* Icon */}
            <div className="relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold z-10"
              style={{
                background: s === 'idle' ? 'rgba(255,255,255,0.04)' : `${a.color}20`,
                color: s === 'idle' ? '#475569' : a.color,
                border: `1px solid ${s === 'idle' ? 'rgba(255,255,255,0.06)' : a.color + '40'}`,
              }}>
              {a.icon}
              {/* Status dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{
                  borderColor: '#0F0F16',
                  background: isStream ? '#7C3AED' : isActive ? '#10B981' : isDone ? '#06B6D4' : '#334155',
                  animation: (isStream || isActive) ? 'pulseDot 2s ease-in-out infinite' : 'none',
                }} />
            </div>

            {/* Label + message */}
            <div className="flex-1 min-w-0 z-10">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-sm font-medium leading-tight ${s !== 'idle' ? 'text-slate-100' : 'text-slate-500 group-hover:text-slate-400'} transition-colors`}>
                  {a.label}
                </span>
                {isStream && <span className="badge badge-violet text-2xs animate-pulse">LIVE</span>}
                {isDone && !isStream && <span className="badge badge-cyan text-2xs">DONE</span>}
                {isActive && !isStream && <span className="badge badge-emerald text-2xs">RUNNING</span>}
              </div>
              <p className="text-2xs text-slate-500 truncate leading-tight">{msg}</p>
            </div>

            {/* Arrow on done/active — right edge */}
            <span className={`text-xs flex-shrink-0 z-10 transition-all duration-150 ${isDone || isActive ? 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5' : 'opacity-0'}`}>
              →
            </span>
          </motion.div>
        )
      })}
    </nav>
  )
}
