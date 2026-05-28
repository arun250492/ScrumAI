import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { id: 'jira',  label: 'Jira',           logo: '🔵' },
  { id: 'azure', label: 'Azure DevOps',   logo: '🔷' },
  { id: 'teams', label: 'Teams',          logo: '🟣' },
]

function Field({ label, type = 'text', value, onChange, placeholder, mono }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input ${mono ? 'font-mono' : ''}`} />
    </div>
  )
}

function StatusBadge({ status }) {
  if (!status) return null
  const ok = status.ok
  return (
    <div className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border ${ok
      ? 'bg-emerald-dim border-emerald-DEFAULT/25 text-emerald-DEFAULT'
      : 'bg-rose-dim border-rose-DEFAULT/25 text-rose-DEFAULT'}`}>
      {ok ? '✓' : '✕'} {status.message}
    </div>
  )
}

export default function IntegrationPanel({ isOpen, onClose, sprintState }) {
  const [tab, setTab] = useState('jira')

  // Jira state
  const [jira, setJira] = useState({ base_url: '', email: '', api_token: '', project_key: '' })
  const [jiraStatus, setJiraStatus] = useState(null)
  const [jiraPushing, setJiraPushing] = useState(false)

  // Azure state
  const [azure, setAzure] = useState({ organization: '', project: '', pat: '' })
  const [azureStatus, setAzureStatus] = useState(null)
  const [azurePushing, setAzurePushing] = useState(false)

  // Teams state
  const [teams, setTeams] = useState({ webhook_url: '' })
  const [teamsStatus, setTeamsStatus] = useState(null)
  const [teamsSending, setTeamsSending] = useState(false)

  const post = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return r.json()
  }

  const testJira = async () => {
    try {
      const r = await post('/api/integrations/jira/test', jira)
      setJiraStatus({ ok: r.ok, message: r.ok ? `Connected as ${r.display_name}` : r.detail })
    } catch { setJiraStatus({ ok: false, message: 'Connection failed' }) }
  }

  const pushJira = async () => {
    setJiraPushing(true)
    try {
      const r = await post('/api/integrations/jira/push', {
        ...jira,
        stories: sprintState?.sprint_backlog || [],
        sprint_goal: sprintState?.sprint_goal,
        project_name: sprintState?.project_name,
      })
      setJiraStatus({ ok: r.ok, message: r.ok ? `✅ Created epic ${r.epic_key} + ${r.stories_created?.length} stories` : r.detail })
    } catch { setJiraStatus({ ok: false, message: 'Push failed' }) }
    setJiraPushing(false)
  }

  const testAzure = async () => {
    try {
      const r = await post('/api/integrations/azure/test', azure)
      setAzureStatus({ ok: r.ok, message: r.ok ? `Connected to project: ${r.project_name}` : r.detail })
    } catch { setAzureStatus({ ok: false, message: 'Connection failed' }) }
  }

  const pushAzure = async () => {
    setAzurePushing(true)
    try {
      const r = await post('/api/integrations/azure/push', {
        ...azure,
        stories: sprintState?.sprint_backlog || [],
        sprint_goal: sprintState?.sprint_goal,
        project_name: sprintState?.project_name,
      })
      setAzureStatus({ ok: r.ok, message: r.ok ? `✅ Created epic + ${r.stories_created?.length} work items` : r.detail })
    } catch { setAzureStatus({ ok: false, message: 'Push failed' }) }
    setAzurePushing(false)
  }

  const testTeams = async () => {
    try {
      const r = await post('/api/integrations/teams/test', teams)
      setTeamsStatus({ ok: r.ok, message: r.ok ? 'Test card sent to Teams channel' : r.detail })
    } catch { setTeamsStatus({ ok: false, message: 'Connection failed' }) }
  }

  const notifyTeams = async () => {
    setTeamsSending(true)
    const stories = sprintState?.sprint_backlog || []
    const tests = sprintState?.test_results || []
    try {
      const r = await post('/api/integrations/teams/notify', {
        webhook_url: teams.webhook_url,
        project_name: sprintState?.project_name || '',
        sprint_goal: sprintState?.sprint_goal || '',
        stories_done: stories.filter(s => s.status === 'DONE').length,
        stories_total: stories.length,
        tests_passed: tests.filter(t => t.status === 'PASS').length,
        tests_total: tests.length,
        velocity: stories.filter(s => s.status === 'DONE').reduce((a, s) => a + (s.story_points || 0), 0),
      })
      setTeamsStatus({ ok: r.ok, message: r.ok ? 'Sprint summary sent to Teams' : r.detail })
    } catch { setTeamsStatus({ ok: false, message: 'Failed to send' }) }
    setTeamsSending(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}>

          <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/7">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Integrations</h3>
                <p className="text-xs text-slate-500">Push stories to your project management tool</p>
              </div>
              <button onClick={onClose} className="btn-ghost w-8 h-8 p-0 text-slate-500 hover:text-slate-300">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/7">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`tab flex items-center gap-2 ${tab === t.id ? 'tab-active' : ''}`}>
                  <span>{t.logo}</span>{t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6 space-y-4">
              {tab === 'jira' && (
                <>
                  <Field label="Jira Base URL" value={jira.base_url} onChange={v => setJira(p => ({ ...p, base_url: v }))} placeholder="https://yourorg.atlassian.net" />
                  <Field label="Email" value={jira.email} onChange={v => setJira(p => ({ ...p, email: v }))} placeholder="you@company.com" />
                  <Field label="API Token" type="password" value={jira.api_token} onChange={v => setJira(p => ({ ...p, api_token: v }))} placeholder="Your Jira API token" mono />
                  <Field label="Project Key" value={jira.project_key} onChange={v => setJira(p => ({ ...p, project_key: v }))} placeholder="PROJ" mono />
                  {jiraStatus && <StatusBadge status={jiraStatus} />}
                  <div className="flex gap-2 pt-1">
                    <button onClick={testJira} className="btn-secondary flex-1">Test Connection</button>
                    <button onClick={pushJira} disabled={jiraPushing || !sprintState?.sprint_backlog?.length}
                      className="btn-primary flex-1">
                      {jiraPushing ? 'Pushing…' : 'Push Sprint →'}
                    </button>
                  </div>
                  <p className="text-2xs text-slate-600">Creates an Epic for the sprint goal + individual Story issues with acceptance criteria and priority.</p>
                </>
              )}

              {tab === 'azure' && (
                <>
                  <Field label="Organization" value={azure.organization} onChange={v => setAzure(p => ({ ...p, organization: v }))} placeholder="yourorg" />
                  <Field label="Project" value={azure.project} onChange={v => setAzure(p => ({ ...p, project: v }))} placeholder="MyProject" />
                  <Field label="Personal Access Token (PAT)" type="password" value={azure.pat} onChange={v => setAzure(p => ({ ...p, pat: v }))} placeholder="Your Azure DevOps PAT" mono />
                  {azureStatus && <StatusBadge status={azureStatus} />}
                  <div className="flex gap-2 pt-1">
                    <button onClick={testAzure} className="btn-secondary flex-1">Test Connection</button>
                    <button onClick={pushAzure} disabled={azurePushing || !sprintState?.sprint_backlog?.length}
                      className="btn-primary flex-1">
                      {azurePushing ? 'Pushing…' : 'Push to ADO →'}
                    </button>
                  </div>
                  <p className="text-2xs text-slate-600">Creates an Epic + User Story work items with story points, priority, and acceptance criteria.</p>
                </>
              )}

              {tab === 'teams' && (
                <>
                  <Field label="Teams Incoming Webhook URL" value={teams.webhook_url} onChange={v => setTeams(p => ({ ...p, webhook_url: v }))} placeholder="https://outlook.office.com/webhook/..." mono />
                  <p className="text-xs text-slate-500">In Teams → channel → Connectors → Incoming Webhook → copy the URL.</p>
                  {teamsStatus && <StatusBadge status={teamsStatus} />}
                  <div className="flex gap-2 pt-1">
                    <button onClick={testTeams} className="btn-secondary flex-1">Send Test Card</button>
                    <button onClick={notifyTeams} disabled={teamsSending || !sprintState?.workflow_complete}
                      className="btn-primary flex-1">
                      {teamsSending ? 'Sending…' : 'Post Sprint Summary →'}
                    </button>
                  </div>
                  <p className="text-2xs text-slate-600">Posts a rich Adaptive Card with sprint metrics to your Teams channel. Enable after sprint completes.</p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
