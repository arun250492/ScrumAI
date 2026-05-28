import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function DocumentationPanel({ documentation, releaseNotes, sprintNotes }) {
  const [activeTab, setActiveTab] = useState('docs')

  const tabs = [
    { id: 'docs', label: '📚 Docs', content: documentation },
    { id: 'release', label: '🚀 Release Notes', content: releaseNotes },
    { id: 'sprint', label: '📋 Sprint Report', content: sprintNotes },
  ]

  const activeContent = tabs.find(t => t.id === activeTab)?.content

  if (!documentation && !releaseNotes && !sprintNotes) {
    return (
      <div className="flex items-center justify-center h-24 rounded-xl glass border border-slate-800/50">
        <div className="text-center">
          <span className="text-2xl">📚</span>
          <p className="text-sm text-slate-500 mt-1">Documentation will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-bright rounded-xl overflow-hidden">
      <div className="flex border-b border-white/5">
        {tabs.map(tab => (
          tab.content && (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-[11px] font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-neon-orange border-b-2 border-neon-orange bg-orange-500/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          )
        ))}
      </div>

      <div className="p-4 max-h-64 overflow-y-auto prose prose-invert prose-sm max-w-none
        prose-headings:text-neon-blue prose-headings:font-semibold
        prose-code:text-neon-green prose-code:bg-dark-700/70 prose-code:px-1 prose-code:rounded
        prose-pre:bg-dark-700 prose-pre:border prose-pre:border-slate-700/50
        prose-a:text-neon-purple
        prose-strong:text-white
        prose-li:text-slate-300
        prose-p:text-slate-300">
        {activeContent ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {activeContent}
          </ReactMarkdown>
        ) : (
          <p className="text-slate-500 text-sm">No content available</p>
        )}
      </div>
    </div>
  )
}
