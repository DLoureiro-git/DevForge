import { useEffect, useRef, useState } from 'react'

interface UseSSEOptions {
  reconnect?: boolean
  reconnectInterval?: number
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
}

export function useSSE(url: string | null, options: UseSSEOptions = {}) {
  const {
    reconnect = true,
    reconnectInterval = 3000,
    onMessage,
    onError,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!url) {
      setIsConnected(false)
      return
    }

    const connect = () => {
      try {
        const eventSource = new EventSource(url)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          setIsConnected(true)
          setError(null)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            onMessage?.(data)
          } catch (err) {
            console.error('Failed to parse SSE message:', err)
          }
        }

        eventSource.onerror = (err) => {
          setIsConnected(false)
          setError(new Error('SSE connection failed'))
          onError?.(err)

          eventSource.close()

          // Reconnect if enabled
          if (reconnect) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, reconnectInterval)
          }
        }
      } catch (err) {
        setError(err as Error)
        console.error('Failed to create EventSource:', err)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [url, reconnect, reconnectInterval, onMessage, onError])

  return { isConnected, error }
}
