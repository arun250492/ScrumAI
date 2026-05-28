import { motion } from 'framer-motion'

export default function QAPanel({ testResults = [], qaIterations = 0, codeArtifacts = [] }) {
  const passed = testResults.filter(t => t.status === 'PASS').length
  const failed = testResults.filter(t => t.status === 'FAIL').length
  const total = testResults.length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1 glass-bright rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-neon-green">{passed}</div>
          <div className="text-[11px] text-slate-400">Passed</div>
        </div>
        <div className="flex-1 glass-bright rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{failed}</div>
          <div className="text-[11px] text-slate-400">Failed</div>
        </div>
        <div className="flex-1 glass-bright rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-neon-blue">{total}</div>
          <div className="text-[11px] text-slate-400">Total</div>
        </div>
        <div className="flex-1 glass-bright rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-neon-purple">{codeArtifacts.length}</div>
          <div className="text-[11px] text-slate-400">Files</div>
        </div>
      </div>

      {codeArtifacts.length > 0 && (
        <div className="glass rounded-xl p-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Code Artifacts</h4>
          <div className="flex flex-wrap gap-2">
            {codeArtifacts.map((art, i) => (
              <span key={i} className="text-[11px] px-2 py-1 rounded bg-purple-900/30 border border-purple-500/20 text-purple-300 font-mono">
                📄 {art.filename}
              </span>
            ))}
          </div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="glass rounded-xl p-3 max-h-36 overflow-y-auto">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Test Results</h4>
          <div className="space-y-1.5">
            {testResults.map((test, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-2 p-2 rounded-lg ${
                  test.status === 'PASS'
                    ? 'bg-green-900/20 border border-green-500/20'
                    : 'bg-red-900/20 border border-red-500/20'
                }`}
              >
                <span className="text-sm flex-shrink-0">{test.status === 'PASS' ? '✅' : '❌'}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-200 line-clamp-1">{test.test_name}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{test.description}</p>
                  {test.bug_report && (
                    <p className="text-[10px] text-red-400 mt-0.5">🐛 {test.bug_report}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
