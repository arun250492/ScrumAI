import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ArchitectureViewer({ architecture }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!architecture) {
    return (
      <div className="flex items-center justify-center h-32 rounded-xl glass border border-slate-800/50">
        <div className="text-center">
          <span className="text-2xl">🏗️</span>
          <p className="text-sm text-slate-500 mt-1">Architecture pending...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'components', label: `Components (${architecture.components?.length || 0})` },
    { id: 'api', label: `APIs (${architecture.api_endpoints?.length || 0})` },
    { id: 'db', label: 'Database' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-bright rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3 border-b border-white/5">
        <span className="text-lg">🏛️</span>
        <h3 className="text-sm font-semibold text-white">System Architecture</h3>
        <div className="flex gap-1 ml-auto flex-wrap">
          {architecture.tech_stack?.map((tech, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue border border-neon-blue/20 font-mono">
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="flex border-b border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-[11px] font-semibold transition-all ${
              activeTab === tab.id
                ? 'text-neon-blue border-b-2 border-neon-blue bg-neon-blue/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-h-52 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-2">
            <p className="text-sm text-slate-300 leading-relaxed">{architecture.system_overview}</p>
            {architecture.diagram_description && (
              <div className="mt-3 p-3 rounded-lg bg-dark-700/50 border border-slate-700/50">
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">{architecture.diagram_description}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'components' && (
          <div className="grid grid-cols-2 gap-2">
            {architecture.components?.map((comp, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-dark-700/50 border border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">⚙️</span>
                  <span className="text-[11px] font-semibold text-white">{comp.name || comp}</span>
                </div>
                {comp.technology && (
                  <span className="text-[10px] text-neon-purple font-mono">{comp.technology}</span>
                )}
                {comp.description && (
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{comp.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-2">
            {architecture.api_endpoints?.map((ep, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-dark-700/50 border border-slate-700/50">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 mt-0.5 ${
                  ep.method === 'GET' ? 'bg-green-900/50 text-green-400' :
                  ep.method === 'POST' ? 'bg-blue-900/50 text-blue-400' :
                  ep.method === 'PUT' ? 'bg-yellow-900/50 text-yellow-400' :
                  ep.method === 'DELETE' ? 'bg-red-900/50 text-red-400' :
                  'bg-slate-800 text-slate-400'
                }`}>{ep.method || 'GET'}</span>
                <div>
                  <span className="text-[11px] font-mono text-neon-blue">{ep.path || ep}</span>
                  {ep.description && <p className="text-[10px] text-slate-500 mt-0.5">{ep.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'db' && (
          <div className="space-y-2">
            {architecture.database_schema?.map((table, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-dark-700/50 border border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">🗄️</span>
                  <span className="text-[11px] font-semibold text-neon-purple font-mono">{table.name || table}</span>
                </div>
                {table.fields && (
                  <div className="space-y-1">
                    {table.fields.slice(0, 4).map((field, j) => (
                      <div key={j} className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400 font-mono">{field.name || field}</span>
                        {field.type && <span className="text-neon-green/70 font-mono">{field.type}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
