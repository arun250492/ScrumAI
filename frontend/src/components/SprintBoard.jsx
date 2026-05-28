import { motion, AnimatePresence } from 'framer-motion'

const COLUMNS = [
  { id: 'BACKLOG', label: 'Backlog', color: 'text-slate-400', bg: 'bg-slate-800/30', dot: 'bg-slate-500' },
  { id: 'TODO', label: 'To Do', color: 'text-blue-400', bg: 'bg-blue-900/20', dot: 'bg-blue-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-900/20', dot: 'bg-yellow-500 animate-pulse' },
  { id: 'DONE', label: 'Done', color: 'text-green-400', bg: 'bg-green-900/20', dot: 'bg-green-500' },
]

const PRIORITY_COLORS = {
  HIGH: 'text-red-400 bg-red-900/30 border-red-500/30',
  MEDIUM: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30',
  LOW: 'text-green-400 bg-green-900/30 border-green-500/30',
}

const PRIORITY_ICONS = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }

function StoryCard({ story }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="story-card glass rounded-lg p-3 cursor-default"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-mono text-slate-500 font-semibold">{story.id}</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${PRIORITY_COLORS[story.priority] || PRIORITY_COLORS.LOW}`}>
            {PRIORITY_ICONS[story.priority]} {story.priority}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/20 font-mono">
            {story.story_points}pt
          </span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-white mb-1.5 leading-tight">{story.title}</h4>
      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-2">{story.description}</p>

      {story.acceptance_criteria?.length > 0 && (
        <div className="space-y-1">
          {story.acceptance_criteria.slice(0, 2).map((ac, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-neon-green text-[10px] mt-0.5 flex-shrink-0">✓</span>
              <span className="text-[10px] text-slate-500 line-clamp-1">{ac}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function SprintBoard({ sprintBacklog = [], productBacklog = [], sprintGoal = '', sprintStatus = '' }) {
  const allStories = [...sprintBacklog, ...productBacklog.filter(s => !sprintBacklog.find(sb => sb.id === s.id))]

  const columns = COLUMNS.map(col => ({
    ...col,
    stories: allStories.filter(s => s.status === col.id)
  }))

  const totalPoints = sprintBacklog.reduce((sum, s) => sum + (s.story_points || 0), 0)
  const donePoints = sprintBacklog.filter(s => s.status === 'DONE').reduce((sum, s) => sum + (s.story_points || 0), 0)
  const progress = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {sprintGoal && (
        <div className="glass-bright rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Sprint 1 Goal</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  sprintStatus === 'DONE' ? 'bg-neon-green/20 text-neon-green' :
                  sprintStatus === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-700 text-slate-400'
                }`}>{sprintStatus}</span>
              </div>
              <p className="text-sm font-medium text-white mt-1">{sprintGoal}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold gradient-text">{progress}%</div>
              <div className="text-[11px] text-slate-500">{donePoints}/{totalPoints} pts</div>
            </div>
          </div>
          <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 kanban-col">
        {columns.map(col => (
          <div key={col.id} className={`rounded-xl p-3 ${col.bg} border border-white/5`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className={`text-xs font-semibold uppercase tracking-wide ${col.color}`}>{col.label}</span>
              <span className="ml-auto text-[11px] text-slate-500 bg-dark-700/50 px-1.5 py-0.5 rounded font-mono">
                {col.stories.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[100px]">
              <AnimatePresence>
                {col.stories.map(story => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </AnimatePresence>
              {col.stories.length === 0 && (
                <div className="flex items-center justify-center h-16 rounded-lg border border-dashed border-slate-700/50">
                  <span className="text-[11px] text-slate-600">Empty</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
