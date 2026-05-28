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

export default function AgentRoster({ currentAgent, completedAgents = [], agentLogs = [], agentStatuses = {}, streamingAgent = '' }) {
  return (
    <nav className="flex flex-col gap-0.5 py-1">
      <p className="section-label px-3 py-2">Agent Squad</p>
      {AGENTS.map((a, i) => {
        const s = status(a.id, currentAgent, completedAgents)
        const isStream = streamingAgent === a.short
        const liveMsg = agentStatuses[a.short]?.message
        const lastLog = agentLogs.filter(l => l.agent === a.short).slice(-1)[0]
        const msg = liveMsg || lastLog?.message || a.sub

        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md mx-1 transition-all duration-200 cursor-default
              ${s === 'active' || isStream ? 'surface-3' : 'hover:surface-2'}`}
            style={isStream ? { boxShadow: '0 0 0 1px rgba(124,58,237,0.4)' } : s === 'active' ? { boxShadow: '0 0 0 1px rgba(16,185,129,0.3)' } : {}}
          >
            {/* Icon */}
            <div className="relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold"
              style={{
                background: s === 'idle' ? 'rgba(255,255,255,0.04)' : `${a.color}18`,
                color: s === 'idle' ? '#475569' : a.color,
                border: `1px solid ${s === 'idle' ? 'rgba(255,255,255,0.06)' : a.color + '35'}`,
              }}>
              {a.icon}
              {/* Status indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg"
                style={{
                  background: isStream ? '#7C3AED' : s === 'active' ? '#10B981' : s === 'done' ? '#06B6D4' : '#334155',
                  animation: (isStream || s === 'active') ? 'pulseDot 2s ease-in-out infinite' : 'none'
                }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium leading-tight ${s !== 'idle' ? 'text-slate-100' : 'text-slate-500'}`}>
                  {a.label}
                </span>
                {isStream && (
                  <span className="badge badge-violet text-2xs">LIVE</span>
                )}
                {s === 'done' && !isStream && (
                  <span className="badge badge-cyan text-2xs">DONE</span>
                )}
              </div>
              <p className="text-2xs text-slate-500 truncate leading-tight mt-0.5">{msg}</p>
            </div>
          </motion.div>
        )
      })}
    </nav>
  )
}
