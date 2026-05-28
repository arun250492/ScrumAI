import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EXAMPLES = [
  { label: 'SaaS App', text: 'Build a multi-tenant SaaS project management tool with workspaces, real-time collaboration, role-based permissions, Stripe billing, and an analytics dashboard.' },
  { label: 'E-Commerce', text: 'Build an AI-powered e-commerce platform with product catalog, inventory management, cart, Stripe checkout, order tracking, and a merchant admin panel.' },
  { label: 'Healthcare', text: 'Build a healthcare patient portal with appointment booking, medical records, prescription management, video consultations, and HIPAA-compliant audit logs.' },
]

const AGENTS = [
  { short: 'PO',  name: 'Product Owner',  color: '#F43F5E', icon: '◈' },
  { short: 'SM',  name: 'Scrum Master',   color: '#F59E0B', icon: '⚡' },
  { short: 'AA',  name: 'Architect',      color: '#06B6D4', icon: '⬡' },
  { short: 'Dev', name: 'Developer',      color: '#7C3AED', icon: '⌥' },
  { short: 'QA',  name: 'QA Engineer',    color: '#10B981', icon: '◎' },
  { short: 'Doc', name: 'Doc Engineer',   color: '#FB923C', icon: '◻' },
]

export default function StartModal({ isOpen, onStart }) {
  const [name, setName] = useState('')
  const [req, setReq] = useState('')
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !req.trim()) return
    setLoading(true)
    setError('')
    try {
      await onStart({ project_name: name, requirement: req, openai_api_key: key || undefined })
    } catch (err) {
      setError(err.message || 'Failed to start sprint')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>

          <motion.div initial={{ scale: 0.96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="w-full max-w-xl rounded-2xl overflow-hidden"
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>

            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-white/7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>🤖</div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-50">New Sprint</h2>
                  <p className="text-xs text-slate-500">6 AI agents will run a complete Scrum cycle</p>
                </div>
              </div>

              {/* Agent pills */}
              <div className="flex flex-wrap gap-2">
                {AGENTS.map(a => (
                  <div key={a.short} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
                    style={{ background: a.color + '12', color: a.color, border: `1px solid ${a.color}25` }}>
                    <span className="font-mono">{a.icon}</span>
                    <span className="font-medium">{a.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. TaskFlow Pro" required
                  className="input" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Requirement</label>
                <textarea value={req} onChange={e => setReq(e.target.value)}
                  placeholder="Describe what you want to build in detail..." rows={4} required
                  className="input resize-none" />
                <div className="flex gap-2 mt-2">
                  {EXAMPLES.map(ex => (
                    <button key={ex.label} type="button" onClick={() => setReq(ex.text)}
                      className="btn-ghost text-xs border border-white/8 rounded-md">
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  OpenAI API Key
                  <span className="text-slate-600 font-normal ml-1">(or set OPENAI_API_KEY env var)</span>
                </label>
                <div className="relative">
                  <input type={showKey ? 'text' : 'password'} value={key} onChange={e => setKey(e.target.value)}
                    placeholder="sk-..." className="input font-mono pr-10" />
                  <button type="button" onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs transition-colors">
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-DEFAULT bg-rose-dim border border-rose-DEFAULT/25 rounded-lg px-3 py-2">
                  ⚠ {error}
                </p>
              )}

              <button type="submit" disabled={loading || !name.trim() || !req.trim()} className="btn-primary w-full py-3 text-sm">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Launching Sprint…
                  </span>
                ) : 'Launch Sprint →'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
