import { useState } from 'react'
import { motion } from 'framer-motion'

export default function QAPanel({ testResults = [], qaIterations = 0, codeArtifacts = [] }) {
  const [tab, setTab] = useState('tests')
  const passed = testResults.filter(t => t.status === 'PASS').length
  const failed = testResults.filter(t => t.status === 'FAIL').length
  const pct = testResults.length > 0 ? Math.round((passed / testResults.length) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Passed',      value: passed,              color: '#10B981' },
          { label: 'Failed',      value: failed,              color: '#F43F5E' },
          { label: 'Total Tests', value: testResults.length,  color: '#06B6D4' },
          { label: 'Code Files',  value: codeArtifacts.length,color: '#7C3AED' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Pass rate bar */}
      {testResults.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Pass Rate</span>
            <span className="text-sm font-bold" style={{ color: pct === 100 ? '#10B981' : '#F59E0B' }}>{pct}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: pct === 100 ? '#10B981' : 'linear-gradient(90deg,#F43F5E,#F59E0B)' }}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
          </div>
          {qaIterations > 1 && <p className="text-2xs text-slate-600 mt-1.5">QA iterations: {qaIterations}</p>}
        </div>
      )}

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-border">
          <button onClick={() => setTab('tests')} className={`tab ${tab === 'tests' ? 'tab-active' : ''}`}>
            Test Results ({testResults.length})
          </button>
          <button onClick={() => setTab('code')} className={`tab ${tab === 'code' ? 'tab-active' : ''}`}>
            Code Artifacts ({codeArtifacts.length})
          </button>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          {tab === 'tests' && (
            <div className="space-y-2">
              {testResults.length === 0 && <p className="text-sm text-slate-600 text-center py-8">No tests yet</p>}
              {testResults.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    t.status === 'PASS'
                      ? 'bg-emerald-dim border-emerald-DEFAULT/20'
                      : 'bg-rose-dim border-rose-DEFAULT/20'
                  }`}>
                  <span className="text-sm flex-shrink-0 mt-0.5">{t.status === 'PASS' ? '✓' : '✕'}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${t.status === 'PASS' ? 'text-emerald-DEFAULT' : 'text-rose-DEFAULT'}`}>
                      {t.test_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                    {t.bug_report && <p className="text-xs text-rose-DEFAULT/80 mt-1 font-mono">⚠ {t.bug_report}</p>}
                  </div>
                  <span className="text-2xs font-mono text-slate-600 flex-shrink-0">{t.story_id}</span>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'code' && (
            <div className="space-y-2">
              {codeArtifacts.length === 0 && <p className="text-sm text-slate-600 text-center py-8">No code yet</p>}
              {codeArtifacts.map((art, i) => (
                <div key={i} className="surface-3 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono text-violet-light">{art.filename}</span>
                    <span className="badge badge-violet text-2xs">{art.language}</span>
                  </div>
                  <p className="text-xs text-slate-500">{art.description}</p>
                  {art.content && (
                    <div className="mt-2 p-2 rounded bg-black/30 border border-border max-h-24 overflow-y-auto">
                      <pre className="text-2xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                        {art.content.slice(0, 300)}{art.content.length > 300 ? '\n…' : ''}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
