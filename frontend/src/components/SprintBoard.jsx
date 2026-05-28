import { motion, AnimatePresence } from 'framer-motion'

const COLS = [
  { id: 'BACKLOG',     label: 'Backlog',      color: '#64748B', dot: '#334155' },
  { id: 'TODO',        label: 'To Do',        color: '#94A3B8', dot: '#475569' },
  { id: 'IN_PROGRESS', label: 'In Progress',  color: '#F59E0B', dot: '#F59E0B' },
  { id: 'DONE',        label: 'Done',         color: '#10B981', dot: '#10B981' },
]

const PRIORITY = {
  HIGH:   { label: 'High',   color: '#F43F5E', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.25)'   },
  MEDIUM: { label: 'Med',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
  LOW:    { label: 'Low',    color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)'  },
}

function StoryCard({ story }) {
  const p = PRIORITY[story.priority] || PRIORITY.LOW
  const criteria = story.acceptance_criteria || []

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="story-card"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-2xs font-mono text-slate-600">{story.id}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="badge text-2xs" style={{ background: p.bg, color: p.color, borderColor: p.border }}>
            {p.label}
          </span>
          <span className="badge badge-violet text-2xs">{story.story_points}pt</span>
        </div>
      </div>

      <p className="text-sm font-medium text-slate-100 leading-snug mb-2">{story.title}</p>
      <p className="text-xs text-slate-500 leading-relaxed truncate-2 mb-3">{story.description}</p>

      {criteria.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-white/5">
          {criteria.slice(0, 2).map((ac, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-emerald-DEFAULT text-xs mt-px flex-shrink-0">✓</span>
              <span className="text-2xs text-slate-500 leading-relaxed line-clamp-1">{ac}</span>
            </div>
          ))}
          {criteria.length > 2 && (
            <p className="text-2xs text-slate-600">+{criteria.length - 2} more criteria</p>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function SprintBoard({ sprintBacklog = [], productBacklog = [], sprintGoal = '', sprintStatus = '' }) {
  const all = [
    ...sprintBacklog,
    ...productBacklog.filter(s => !sprintBacklog.find(sb => sb.id === s.id))
  ]

  const cols = COLS.map(c => ({ ...c, stories: all.filter(s => s.status === c.id) }))

  const total = sprintBacklog.reduce((s, x) => s + (x.story_points || 0), 0)
  const done  = sprintBacklog.filter(s => s.status === 'DONE').reduce((s, x) => s + (x.story_points || 0), 0)
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  const doneCt = sprintBacklog.filter(s => s.status === 'DONE').length

  return (
    <div className="flex flex-col gap-5">
      {/* Sprint header */}
      {sprintGoal && (
        <div className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="section-label">Sprint Goal</span>
                <span className="badge badge-slate text-2xs">{sprintStatus}</span>
              </div>
              <p className="text-base font-semibold text-slate-100 leading-snug">{sprintGoal}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-2xl font-bold text-gradient">{pct}%</div>
              <div className="text-xs text-slate-500">{doneCt}/{sprintBacklog.length} stories</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-slate-500 font-mono flex-shrink-0">{done}/{total} pts</span>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-4 gap-3">
        {cols.map(col => (
          <div key={col.id} className="flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.dot }} />
              <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
              <span className="ml-auto text-2xs text-slate-600 font-mono">{col.stories.length}</span>
            </div>

            {/* Cards */}
            <div className="kanban-col flex flex-col gap-2">
              <AnimatePresence>
                {col.stories.map(s => <StoryCard key={s.id} story={s} />)}
              </AnimatePresence>
              {col.stories.length === 0 && (
                <div className="h-20 rounded-lg border border-dashed border-white/5 flex items-center justify-center">
                  <span className="text-xs text-slate-700">No stories</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
