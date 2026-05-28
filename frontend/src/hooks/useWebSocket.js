import { useEffect, useRef, useCallback, useState } from 'react'

export function useWebSocket(sessionId, onMessage) {
  const ws = useRef(null)
  const [connected, setConnected] = useState(false)
  const pingInterval = useRef(null)

  const connect = useCallback(() => {
    if (!sessionId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws/${sessionId}`

    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      setConnected(true)
      pingInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)
    }

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type !== 'pong') {
          onMessage(data)
        }
      } catch (e) {
        console.error('WebSocket parse error:', e)
      }
    }

    ws.current.onclose = () => {
      setConnected(false)
      clearInterval(pingInterval.current)
    }

    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err)
      setConnected(false)
    }
  }, [sessionId, onMessage])

  useEffect(() => {
    connect()
    return () => {
      clearInterval(pingInterval.current)
      ws.current?.close()
    }
  }, [connect])

  return { connected }
}
