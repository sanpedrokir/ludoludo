'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePusherChannel } from '@/lib/pusher/usePusherChannel'
import { getMessages, sendMessage } from '@/lib/actions/chat'
import { AVATARS } from '@/components/PlayerAvatar'

interface Message {
  id: string
  userId: string
  displayName: string
  avatarId: number
  content: string
  createdAt: string
}

interface Props {
  roomId: string
  currentUserId: string
}

export default function ChatWindow({ roomId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMessages(roomId).then((data) => setMessages(data as unknown as Message[]))
  }, [roomId])

  const onNewMessage = useCallback((payload: Message) => {
    setMessages(prev => [...prev, payload])
  }, [])

  usePusherChannel(`chat:${roomId}`, [{ event: 'new-message', onEvent: onNewMessage }])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setSendError(null)
    setInput('')
    const { error } = await sendMessage(roomId, content)
    if (error) {
      setSendError(error)
      setInput(content)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="rounded-2xl border border-amber-100 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-amber-600 text-white px-4 py-2 flex items-center gap-2">
        <span className="text-sm">💬</span>
        <span className="font-bold text-sm">Room Chat</span>
      </div>

      {/* Message list */}
      <div className="px-3 py-3 flex flex-col gap-2 overflow-y-auto" style={{ minHeight: 80, maxHeight: 200 }}>
        {messages.length === 0 && (
          <p className="text-center text-amber-500 text-xs py-2">No messages yet — say hi! 👋</p>
        )}
        {messages.map(msg => {
          const isMe = msg.userId === currentUserId
          const avatar = AVATARS.find(a => a.id === (msg.avatarId ?? 1)) ?? AVATARS[0]
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-sm flex-shrink-0`}>
                {avatar.emoji}
              </div>
              <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-amber-400 font-semibold mb-0.5 px-1">{isMe ? 'You' : msg.displayName}</span>
                <div className={`px-3 py-1.5 rounded-2xl text-sm break-words ${
                  isMe
                    ? 'bg-amber-600 text-white rounded-tr-sm'
                    : 'bg-amber-50 text-amber-900 border border-amber-100 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {sendError && (
        <p className="text-xs text-red-500 px-3 pb-1 text-center">{sendError}</p>
      )}

      {/* Input */}
      <div className="flex gap-2 p-2 border-t border-amber-100">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          maxLength={200}
          placeholder="Type a message…"
          className="flex-1 px-3 py-2 rounded-xl border border-amber-200 text-sm text-gray-900 placeholder-amber-300 focus:outline-none focus:border-amber-400 bg-amber-50"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="px-3 py-2 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 disabled:opacity-40 transition-colors"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
