'use client'

import { useEffect } from 'react'
import { getPusherClient } from './client'

interface Binding {
  event: string
  // Payload shape is caller-defined per event (mirrors pusher-js's own typing) — callers supply concretely-typed handlers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvent: (payload: any) => void
}

/**
 * Subscribes to a Pusher channel for the lifetime of the component and binds
 * one or more events on it. Replaces the old
 * `supabase.channel(name).on('postgres_changes', ...).subscribe()` pattern.
 */
export function usePusherChannel(channelName: string | null, bindings: Binding[]) {
  // Bindings are read fresh each effect run via a stable-length dep array of
  // event names — callers should keep handlers referentially stable via
  // useCallback where they close over changing state (see call sites).
  const eventKey = bindings.map((b) => b.event).join(',')

  useEffect(() => {
    if (!channelName) return
    const pusher = getPusherClient()
    const channel = pusher.subscribe(channelName)

    for (const { event, onEvent } of bindings) {
      channel.bind(event, onEvent)
    }

    return () => {
      for (const { event, onEvent } of bindings) {
        channel.unbind(event, onEvent)
      }
      pusher.unsubscribe(channelName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, eventKey])
}
