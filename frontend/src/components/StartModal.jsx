import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EXAMPLES = [
  'Build a real-time collaborative task management app with user authentication, team workspaces, drag-and-drop boards, and Slack notifications.',
  'Create an AI-powered e-commerce platform with product recommendations, inventory management, payment processing, and analytics dashboard.',
  'Develop a healthcare patient portal with appointment scheduling, medical records access, prescription management, and doctor chat.',
]

export default function StartModal({ onStart, isOpen }) {
  const [projectName, setProjectName] = useState('')
  const [requirement, setRequirement] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!projectName.trim() || !requirement.trim()) return
    setLoading(true)
    try {
      await onStart({ project_name: projectName, requirement, openai_api_key: apiKey || undefined })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-bright rounded-2xl w-full max-w-2xl overflow-hidden border border-neon-purple/30"
            style={{ boxShadow: '0 0 60px rgba(157,78,221,0.3), 0 0 120px rgba(0,212,255,0.1)' }}
          >
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/30 to-cyan-900/20">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🤖</span>
                <div>
                  <h2 className="text-xl font-bold gradient-text">Start AI Scrum Sprint</h2>
                  <p className="text-slate-400 text-sm">6 AI agents will collaborate to deliver your project</p>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                {['🎯 PO', '⚡ SM', '🏗️ Arch', '💻 Dev', '🔬 QA', '📚 Docs'].map((a, i) => (
                  <span key={i} className="text-[11px] text-slate-400 font-semibold">{a}</span>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. TaskFlow Pro"
                  className="w-full bg-dark-700/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-neon-purple/60 focus:ring-1 focus:ring-neon-purple/30 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Project Requirement *
                </label>
                <textarea
                  value={requirement}
                  onChange={e => setRequirement(e.target.value)}
                  placeholder="Describe what you want to build in detail..."
                  rows={4}
                  className="w-full bg-dark-700/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-neon-purple/60 focus:ring-1 focus:ring-neon-purple/30 transition-all resize-none"
                  required
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRequirement(ex)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/20 transition-all"
                    >
                      Example {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  OpenAI API Key <span className="text-slate-600 normal-case font-normal">(or set OPENAI_API_KEY env var)</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-dark-700/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-neon-purple/60 focus:ring-1 focus:ring-neon-purple/30 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    {showKey ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !projectName.trim() || !requirement.trim()}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    bg-gradient-to-r from-neon-purple to-neon-blue text-white
                    hover:from-purple-500 hover:to-cyan-400
                    focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                  style={{ boxShadow: loading ? 'none' : '0 0 20px rgba(157,78,221,0.4)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Launching Sprint...
                    </span>
                  ) : '🚀 Launch AI Sprint'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
