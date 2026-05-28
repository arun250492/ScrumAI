import { motion } from 'framer-motion'

const AGENTS = [
  {
    id: 'product_owner',
    name: 'Product Owner',
    short: 'PO',
    icon: '🎯',
    color: 'neon-pink',
    gradient: 'from-pink-500 to-rose-600',
    borderColor: 'border-pink-500/40',
    glowColor: 'rgba(255, 0, 110, 0.4)',
    description: 'Requirements & User Stories'
  },
  {
    id: 'scrum_master',
    name: 'Scrum Master',
    short: 'SM',
    icon: '⚡',
    color: 'neon-yellow',
    gradient: 'from-yellow-400 to-amber-500',
    borderColor: 'border-yellow-400/40',
    glowColor: 'rgba(255, 214, 10, 0.4)',
    description: 'Sprint Coordination'
  },
  {
    id: 'architect',
    name: 'Architect',
    short: 'AA',
    icon: '🏗️',
    color: 'neon-blue',
    gradient: 'from-cyan-400 to-blue-500',
    borderColor: 'border-cyan-400/40',
    glowColor: 'rgba(0, 212, 255, 0.4)',
    description: 'System Design & APIs'
  },
  {
    id: 'developer',
    name: 'Developer',
    short: 'Dev',
    icon: '💻',
    color: 'neon-purple',
    gradient: 'from-purple-500 to-violet-600',
    borderColor: 'border-purple-500/40',
    glowColor: 'rgba(157, 78, 221, 0.4)',
    description: 'Code Implementation'
  },
  {
    id: 'qa',
    name: 'QA Engineer',
    short: 'QA',
    icon: '🔬',
    color: 'neon-green',
    gradient: 'from-green-400 to-emerald-500',
    borderColor: 'border-green-400/40',
    glowColor: 'rgba(0, 255, 136, 0.4)',
    description: 'Testing & Quality'
  },
  {
    id: 'documentation',
    name: 'Doc Engineer',
    short: 'Doc',
    icon: '📚',
    color: 'neon-orange',
    gradient: 'from-orange-400 to-red-500',
    borderColor: 'border-orange-400/40',
    glowColor: 'rgba(255, 107, 53, 0.4)',
    description: 'Docs & Release Notes'
  }
]

function getAgentStatus(agentId, currentAgent, completedAgents) {
  const normalizedCurrent = currentAgent?.replace('scrum_master_plan', 'scrum_master')
    .replace('scrum_master_review', 'scrum_master')

  if (normalizedCurrent === agentId) return 'active'
  if (completedAgents?.some(a => a.includes(agentId))) return 'done'
  return 'idle'
}

export default function AgentRoster({ currentAgent, completedAgents = [], agentLogs = [], agentStatuses = {}, streamingAgent = '' }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Agent Squad</h2>
      </div>

      {AGENTS.map((agent, i) => {
        const status = getAgentStatus(agent.id, currentAgent, completedAgents)
        const lastLog = agentLogs.filter(l => l.agent === agent.short).slice(-1)[0]
        const liveStatus = agentStatuses[agent.short]
        const isStreaming = streamingAgent === agent.short

        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`relative rounded-xl p-3 border transition-all duration-300 ${
              status === 'active'
                ? `${agent.borderColor} bg-dark-600/80 agent-active`
                : status === 'done'
                ? 'border-slate-700/50 bg-dark-700/60'
                : 'border-slate-800/30 bg-dark-800/40'
            }`}
            style={status === 'active' ? { boxShadow: `0 0 15px ${agent.glowColor}` } : {}}
          >
            <div className="flex items-center gap-3">
              <div className={`relative flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${agent.gradient} bg-opacity-20`}
                style={{ background: `linear-gradient(135deg, ${agent.glowColor}, transparent)` }}>
                <span>{agent.icon}</span>
                {status === 'active' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full animate-ping" />
                )}
                {status === 'done' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-blue rounded-full flex items-center justify-center text-[8px]">✓</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${
                    status === 'active' ? 'text-white' : status === 'done' ? 'text-slate-300' : 'text-slate-500'
                  }`}>{agent.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isStreaming
                      ? 'bg-neon-blue/20 text-neon-blue animate-pulse'
                      : status === 'active'
                      ? 'bg-neon-green/20 text-neon-green'
                      : status === 'done'
                      ? 'bg-neon-blue/10 text-neon-blue'
                      : 'bg-slate-800 text-slate-600'
                  }`}>
                    {isStreaming ? '◈ STREAM' : status === 'active' ? '● LIVE' : status === 'done' ? '✓ DONE' : '○ IDLE'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {liveStatus?.message || lastLog?.message || agent.description}
                </p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
