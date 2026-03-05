/**
 * INTAKE CHAT — O componente mais importante do DevForge
 *
 * Interface conversacional estilo WhatsApp/iMessage
 * onde o PM Agent conduz o intake inteligente.
 */

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles } from 'lucide-react'

interface Message {
  id: string
  role: 'USER' | 'AGENT' | 'SYSTEM'
  content: string
  quickReplies?: string[]
  createdAt: string
}

interface IntakeChatProps {
  projectId: string
  onComplete: (prd: any) => void
}

export default function IntakeChat({ projectId, onComplete }: IntakeChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Carregar histórico de mensagens
  useEffect(() => {
    loadMessages()
  }, [projectId])

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const project = await res.json()

      // Primeira mensagem do agente se não houver histórico
      if (!project.messages || project.messages.length === 0) {
        const welcomeMsg: Message = {
          id: 'welcome',
          role: 'AGENT',
          content: 'Olá! 👋 Sou o DevForge AI e vou ajudar-te a construir o teu projecto.\n\nDescreve-me a tua ideia como se explicasses a um amigo. Qual é o projecto que tens em mente?',
          createdAt: new Date().toISOString()
        }
        setMessages([welcomeMsg])
      } else {
        setMessages(project.messages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: input,
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsSending(true)
    setIsTyping(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      const data = await res.json()

      // Simular typing delay (300-800ms)
      const typingDelay = 300 + Math.random() * 500
      await new Promise(resolve => setTimeout(resolve, typingDelay))

      setIsTyping(false)

      const agentMessage: Message = {
        id: Date.now().toString(),
        role: 'AGENT',
        content: data.response,
        quickReplies: data.quickReplies,
        createdAt: new Date().toISOString()
      }

      setMessages(prev => [...prev, agentMessage])

      // Se intake completo, callback
      if (data.isComplete && data.prd) {
        onComplete(data.prd)
      }
    } catch (error) {
      setIsTyping(false)
      console.error('Error sending message:', error)

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'SYSTEM',
        content: 'Ups! Algo correu mal. Tenta novamente.',
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    setInput(reply)
    // Auto-send após pequeno delay (parecer mais natural)
    setTimeout(() => {
      const sendBtn = document.getElementById('send-btn')
      sendBtn?.click()
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[--bg-surface] rounded-2xl border border-[--border-bright] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[--border] bg-[--bg-raised]/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[--phase-intake] to-[--phase-plan] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[--status-success] rounded-full border-2 border-[--bg-raised]" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-[--text-primary]">DevForge AI</h3>
            <p className="text-xs text-[--text-muted]">Consultor de Produto</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={msg.id}>
            {/* Message Bubble */}
            <div
              className={`flex ${
                msg.role === 'USER' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'USER'
                    ? 'bg-[--phase-intake] text-white ml-auto'
                    : msg.role === 'AGENT'
                    ? 'bg-[--bg-raised] text-[--text-primary] border border-[--border]'
                    : 'bg-[--status-warning]/10 text-[--status-warning] border border-[--status-warning]/20 text-center text-sm'
                }`}
              >
                <p className="whitespace-pre-wrap font-body text-sm leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>

            {/* Quick Replies (só para mensagens do agente) */}
            {msg.role === 'AGENT' && msg.quickReplies && msg.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 ml-0 md:ml-4">
                {msg.quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(reply)}
                    className="px-4 py-2 rounded-full border border-[--border-bright] hover:border-[--phase-intake] hover:bg-[--phase-intake]/10 text-sm font-medium text-[--text-secondary] hover:text-[--phase-intake] transition-all duration-200"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Timestamp (só para USER e última do AGENT) */}
            {(msg.role === 'USER' || (msg.role === 'AGENT' && index === messages.length - 1)) && (
              <p
                className={`text-xs text-[--text-muted] mt-1 ${
                  msg.role === 'USER' ? 'text-right mr-1' : 'ml-4'
                }`}
              >
                {new Date(msg.createdAt).toLocaleTimeString('pt-PT', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[--bg-raised] border border-[--border] rounded-2xl px-5 py-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[--text-muted] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-[--text-muted] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-[--text-muted] rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[--border] bg-[--bg-raised]/30">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreve a tua mensagem..."
            disabled={isSending}
            rows={1}
            className="flex-1 bg-[--bg-base] border border-[--border] rounded-xl px-4 py-3 text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--phase-intake] resize-none font-body text-sm disabled:opacity-50 disabled:cursor-not-allowed max-h-32"
            style={{
              minHeight: '44px',
              height: 'auto'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = target.scrollHeight + 'px'
            }}
          />

          <button
            id="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[--phase-intake] to-[--phase-plan] hover:shadow-lg hover:shadow-[--phase-intake]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center group"
          >
            <Send className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <p className="text-xs text-[--text-muted] mt-3 text-center">
          Enter para enviar • Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
