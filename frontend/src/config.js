// Same-origin in production (FastAPI serves the frontend)
export const API_BASE = ''
export const WS_BASE = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
