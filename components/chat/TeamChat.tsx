'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  MessageSquare,
  Send,
  Bell,
  Loader2,
  Crown,
  Scissors,
  Clock,
  CheckCheck,
  Pin,
  Users,
  X,
  Calendar,
  Search,
  AtSign,
  ArrowLeft,
  Phone,
  FileText,
  Tag,
  AlertTriangle,
  ShoppingBag,
  Wrench,
  User,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

export interface ChatMember {
  id: string
  name: string
  role: 'OWNER' | 'BARBER' | 'SUPER_ADMIN'
  avatar: string | null
  specialty?: string | null
  phone?: string | null
  email?: string | null
  isCurrentUser: boolean
}

export interface AttachedAppointment {
  id: string
  reservationCode: string
  clientName: string
  clientPhone?: string
  clientNotes?: string | null
  serviceName: string
  servicePrice: number
  barberName: string
  date: string
  status: string
  notes?: string | null
}

export interface AttachedNote {
  id: string
  title: string
  content: string
  color?: string | null
  category?: string | null
  createdAt?: string
}

export interface ChatMsg {
  id: string
  senderId: string
  senderName: string
  senderRole: 'OWNER' | 'BARBER' | 'SUPER_ADMIN'
  content: string
  channelId: string
  recipientId?: string | null
  recipientName?: string | null
  appointment?: AttachedAppointment | null
  note?: AttachedNote | null
  mentions?: string[]
  isImportant: boolean
  createdAt: string
}

interface CurrentUser {
  id: string
  memberId: string
  role: 'OWNER' | 'BARBER' | 'SUPER_ADMIN'
  barberId?: string | null
}

interface TeamChatProps {
  view?: 'owner' | 'barber'
}

const NOTE_COLOR_STYLES: Record<string, { bg: string; border: string; text: string; badge: string; accent: string }> = {
  yellow: {
    bg: 'bg-amber-50/95 dark:bg-[#151410] dark:bg-gradient-to-br dark:from-[#171510] dark:to-[#101014]',
    border: 'border-amber-300 dark:border-amber-500/40',
    text: 'text-amber-950 dark:text-zinc-100',
    badge: 'bg-amber-200/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
    accent: 'bg-amber-500'
  },
  rose: {
    bg: 'bg-rose-50/95 dark:bg-[#161012] dark:bg-gradient-to-br dark:from-[#191114] dark:to-[#101014]',
    border: 'border-rose-300 dark:border-rose-500/40',
    text: 'text-rose-950 dark:text-zinc-100',
    badge: 'bg-rose-200/80 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/40',
    accent: 'bg-rose-500'
  },
  emerald: {
    bg: 'bg-emerald-50/95 dark:bg-[#101612] dark:bg-gradient-to-br dark:from-[#101914] dark:to-[#101014]',
    border: 'border-emerald-300 dark:border-emerald-500/40',
    text: 'text-emerald-950 dark:text-zinc-100',
    badge: 'bg-emerald-200/80 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
    accent: 'bg-emerald-500'
  },
  blue: {
    bg: 'bg-sky-50/95 dark:bg-[#101418] dark:bg-gradient-to-br dark:from-[#10161b] dark:to-[#101014]',
    border: 'border-sky-300 dark:border-sky-500/40',
    text: 'text-sky-950 dark:text-zinc-100',
    badge: 'bg-sky-200/80 dark:bg-sky-500/20 text-sky-900 dark:text-sky-300 border-sky-300 dark:border-sky-500/40',
    accent: 'bg-sky-500'
  },
  purple: {
    bg: 'bg-purple-50/95 dark:bg-[#141118] dark:bg-gradient-to-br dark:from-[#15111a] dark:to-[#101014]',
    border: 'border-purple-300 dark:border-purple-500/40',
    text: 'text-purple-950 dark:text-zinc-100',
    badge: 'bg-purple-200/80 dark:bg-purple-500/20 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-500/40',
    accent: 'bg-purple-500'
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General / Avisos',
  URGENT: 'Urgente',
  SUPPLIES: 'Insumos & Compras',
  TEAM: 'Equipo / Barberos',
  MAINTENANCE: 'Mantenimiento'
}

export default function TeamChat({ view = 'owner' }: TeamChatProps) {
  // Members and channels
  const [members, setMembers] = useState<ChatMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [activeChannelId, setActiveChannelId] = useState<string>('general')
  const [activeMemberTarget, setActiveMemberTarget] = useState<ChatMember | null>(null)
  const [searchMember, setSearchMember] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)

  // Messages state
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  // Attached Appointment state
  const [attachedAppointment, setAttachedAppointment] = useState<AttachedAppointment | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [availableAppointments, setAvailableAppointments] = useState<AttachedAppointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentSearch, setAppointmentSearch] = useState('')

  // Attached Note state (Owner's communication notes)
  const [attachedNote, setAttachedNote] = useState<AttachedNote | null>(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [availableNotes, setAvailableNotes] = useState<AttachedNote[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [notesSearch, setNotesSearch] = useState('')

  // @ Mention dropdown state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [showMentionMenu, setShowMentionMenu] = useState(false)
  const [mentionCursorPos, setMentionCursorPos] = useState<number>(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastTimestampRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isOwnerView = view === 'owner'

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 1. Fetch team members
  const loadMembers = useCallback(async () => {
    try {
      setLoadingMembers(true)
      const res = await fetch('/api/chat/members')
      if (!res.ok) throw new Error('Error al cargar miembros')
      const data = await res.json()
      setMembers(data.members || [])
      if (data.currentUserId) {
        setCurrentUser(prev => ({
          id: data.currentUserId,
          memberId: data.currentUserId,
          role: data.currentRole,
          barberId: prev?.barberId
        }))
      }
    } catch {
      toast.error('No se pudo cargar la lista del equipo')
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  // 2. Fetch messages for active channel
  const loadMessages = useCallback(async (channelId: string) => {
    try {
      setLoadingMessages(true)
      const res = await fetch(`/api/chat/messages?channelId=${encodeURIComponent(channelId)}`)
      if (!res.ok) throw new Error('error')
      const data = await res.json()
      setMessages(data.messages || [])
      if (data.currentUser) {
        setCurrentUser(prev => ({
          ...prev,
          ...data.currentUser
        }))
      }
      if (data.messages?.length > 0) {
        lastTimestampRef.current = data.messages[data.messages.length - 1].createdAt
      } else {
        lastTimestampRef.current = null
      }
    } catch {
      toast.error('Error al cargar mensajes del canal')
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // 3. Poll messages in real-time
  const pollMessages = useCallback(async () => {
    if (!lastTimestampRef.current) return
    try {
      const res = await fetch(
        `/api/chat/messages?channelId=${encodeURIComponent(activeChannelId)}&since=${encodeURIComponent(lastTimestampRef.current)}`
      )
      if (!res.ok) return
      const data = await res.json()
      if (data.messages?.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const newMsgs = data.messages.filter((m: ChatMsg) => !existingIds.has(m.id))
          if (newMsgs.length === 0) return prev

          // Toast notification for incoming messages
          newMsgs.forEach((m: ChatMsg) => {
            if (m.senderId !== currentUser?.memberId) {
              const isOwnerMsg = m.senderRole === 'OWNER' || m.senderRole === 'SUPER_ADMIN'
              toast.info(
                `${isOwnerMsg ? '👑' : '✂️'} ${m.senderName}: ${m.content.slice(0, 35)}${m.content.length > 35 ? '...' : ''}`,
                { duration: 3000 }
              )
            }
          })
          return [...prev, ...newMsgs]
        })
        lastTimestampRef.current = data.messages[data.messages.length - 1].createdAt
      }
    } catch {
      // silent poll
    }
  }, [activeChannelId, currentUser?.memberId])

  // 4. Fetch appointments & agenda clients
  const loadAppointments = useCallback(async (query: string = '') => {
    try {
      setLoadingAppointments(true)
      const res = await fetch(`/api/chat/appointments?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Error al cargar citas')
      const data = await res.json()
      setAvailableAppointments(data.appointments || [])
    } catch {
      toast.error('Error al cargar agenda y citas')
    } finally {
      setLoadingAppointments(false)
    }
  }, [])

  // 5. Fetch business notes (Communication notes from navigation)
  const loadNotes = useCallback(async () => {
    try {
      setLoadingNotes(true)
      const res = await fetch('/api/notes')
      if (!res.ok) throw new Error('Error al cargar notas')
      const data = await res.json()
      setAvailableNotes(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error al cargar notas del negocio')
    } finally {
      setLoadingNotes(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  useEffect(() => {
    loadMessages(activeChannelId)
  }, [activeChannelId, loadMessages])

  useEffect(() => {
    const interval = setInterval(pollMessages, 3000)
    return () => clearInterval(interval)
  }, [pollMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Change conversation channel
  const handleSelectChannel = (channelId: string, memberTarget: ChatMember | null = null) => {
    setActiveChannelId(channelId)
    setActiveMemberTarget(memberTarget)
    setMobileShowChat(true)
    setText('')
    setAttachedAppointment(null)
    setAttachedNote(null)
    setIsImportant(false)
  }

  // Calculate direct channel ID between current user and target member
  const getDirectChannelId = (targetMember: ChatMember) => {
    if (!currentUser?.memberId) return 'general'
    const ids = [currentUser.memberId, targetMember.id].sort()
    return `direct_${ids[0]}__${ids[1]}`
  }

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!text.trim() && !attachedAppointment && !attachedNote) || sending) return

    setSending(true)

    // Detect mentions in text: @Name
    const mentionedNames: string[] = []
    const mentionRegex = /@([a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)/g
    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      mentionedNames.push(match[1])
    }

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim(),
          channelId: activeChannelId,
          recipientId: activeMemberTarget ? activeMemberTarget.id : null,
          recipientName: activeMemberTarget ? activeMemberTarget.name : null,
          appointment: attachedAppointment,
          note: attachedNote,
          mentions: mentionedNames,
          isImportant
        })
      })

      if (!res.ok) throw new Error('Error al enviar')
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      lastTimestampRef.current = data.message.createdAt
      setText('')
      setAttachedAppointment(null)
      setAttachedNote(null)
      setIsImportant(false)
      setShowMentionMenu(false)
      inputRef.current?.focus()
    } catch {
      toast.error('Error al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  // Toggle important notice
  const toggleImportant = async (msgId: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${msgId}/important`, { method: 'PATCH' })
      if (!res.ok) throw new Error('error')
      const data = await res.json()
      setMessages(prev => prev.map(m => (m.id === msgId ? data.message : m)))
      toast.success(data.message.isImportant ? 'Aviso fijado en notas importantes' : 'Aviso desfijado')
    } catch {
      toast.error('Error al actualizar aviso')
    }
  }

  // Handle typing to trigger @ mention menu
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const pos = e.target.selectionStart || 0
    setText(val)
    setMentionCursorPos(pos)

    // Check if user is typing @
    const textBeforeCursor = val.slice(0, pos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
      const query = textBeforeCursor.slice(atIndex + 1)
      if (!query.includes(' ')) {
        setMentionQuery(query.toLowerCase())
        setShowMentionMenu(true)
        return
      }
    }
    setShowMentionMenu(false)
    setMentionQuery(null)
  }

  // Insert mention into input
  const insertMention = (name: string) => {
    const textBeforeCursor = text.slice(0, mentionCursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    const prefix = text.slice(0, atIndex)
    const suffix = text.slice(mentionCursorPos)
    const newText = `${prefix}@${name} ${suffix}`
    setText(newText)
    setShowMentionMenu(false)
    setMentionQuery(null)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  // Format time
  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter members list for sidebar
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (m.isCurrentUser) return false
      if (!searchMember.trim()) return true
      return (
        m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
        (m.specialty && m.specialty.toLowerCase().includes(searchMember.toLowerCase()))
      )
    })
  }, [members, searchMember])

  // Filter members for @ mention autocomplete
  const mentionCandidates = useMemo(() => {
    const candidates = members.filter(m => !m.isCurrentUser)
    if (!mentionQuery) return candidates
    return candidates.filter(m => m.name.toLowerCase().includes(mentionQuery))
  }, [members, mentionQuery])

  // Filter notes for notes modal
  const filteredNotes = useMemo(() => {
    if (!notesSearch.trim()) return availableNotes
    return availableNotes.filter(
      n =>
        n.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
        n.content.toLowerCase().includes(notesSearch.toLowerCase()) ||
        (n.category && n.category.toLowerCase().includes(notesSearch.toLowerCase()))
    )
  }, [availableNotes, notesSearch])

  // Pinned messages for this channel
  const pinnedMessages = messages.filter(m => m.isImportant)

  // Render text with highlighted @ mentions
  const renderMessageText = (msgContent: string) => {
    const parts = msgContent.split(/(@[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const cleanMention = part.slice(1).toLowerCase()
        const isMyMention =
          currentUser &&
          (cleanMention === 'todos' ||
            (members.find(m => m.isCurrentUser)?.name.toLowerCase().includes(cleanMention) ?? false))

        return (
          <span
            key={i}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[11px] font-black tracking-tight ${
              isMyMention
                ? 'bg-amber-400 text-amber-950 ring-1 ring-amber-500 shadow-xs'
                : 'bg-zinc-800 text-amber-300'
            }`}
          >
            <AtSign size={10} className="inline shrink-0" />
            {part.slice(1)}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0">
      {/* ── MAIN SPLIT CONTAINER ── */}
      <div className="flex-1 bg-white border border-zinc-200 rounded-2xl md:rounded-3xl shadow-sm flex overflow-hidden min-h-0 relative w-full h-full">
        
        {/* ── LEFT SIDEBAR: CHANNELS, DIRECT MESSAGES & IMPORTANT NOTICES ── */}
        <div
          className={`w-full md:w-80 lg:w-92 xl:w-96 border-r border-zinc-200 bg-zinc-50 flex flex-col shrink-0 ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Compact Sidebar Header with Search & Status */}
          <div className="p-3.5 border-b border-zinc-200 bg-white">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchMember}
                onChange={e => setSearchMember(e.target.value)}
                placeholder="Buscar barbero o chat..."
                className="w-full pl-9 pr-8 py-2 bg-zinc-100/90 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-zinc-950 transition-all"
              />
              <span
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"
                title="En línea"
              />
            </div>
          </div>

          {/* Scrollable list: Channel, Direct Chats and Important Notices */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* 1. General Team Channel (Single, clean button) */}
            <div>
              <div className="px-1.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Canal</span>
                <span className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.2 rounded font-bold">
                  {members.length} miembros
                </span>
              </div>
              <button
                onClick={() => handleSelectChannel('general', null)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left ${
                  activeChannelId === 'general'
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200/80'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeChannelId === 'general' ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <Users size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black uppercase tracking-tight truncate flex items-center gap-1.5">
                    # Chat de Equipo
                  </div>
                  <div
                    className={`text-[10px] font-medium truncate ${
                      activeChannelId === 'general' ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    Canal general abierto
                  </div>
                </div>
              </button>
            </div>

            {/* 2. Direct 1-to-1 Conversations */}
            <div>
              <div className="px-1.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Mensajes Directos</span>
                <span className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.2 rounded font-bold">1 a 1</span>
              </div>

              {loadingMembers ? (
                <div className="flex items-center justify-center py-4 gap-2 text-zinc-400">
                  <Loader2 size={15} className="animate-spin" />
                  <span className="text-xs font-bold">Cargando...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-400 font-medium">
                  No se encontraron miembros
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredMembers.map(member => {
                    const directId = getDirectChannelId(member)
                    const isActive = activeChannelId === directId
                    const isOwner = member.role === 'OWNER' || member.role === 'SUPER_ADMIN'

                    return (
                      <button
                        key={member.id}
                        onClick={() => handleSelectChannel(directId, member)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-2xl transition-all text-left ${
                          isActive
                            ? 'bg-zinc-950 dark:bg-amber-400 dark:text-zinc-950 text-white shadow-md'
                            : 'bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-xs ${
                              isOwner
                                ? 'bg-amber-500 text-white'
                                : isActive
                                ? 'bg-zinc-800 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            {isOwner ? <Crown size={14} /> : <Scissors size={14} />}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold truncate">{member.name}</span>
                            <span
                              className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                                isOwner
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                  : isActive
                                  ? 'bg-zinc-800 dark:bg-zinc-900 text-zinc-300'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {isOwner ? 'Dueño' : 'Barbero'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {member.specialty || 'Chat directo'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 3. IMPORTANT NOTICES SECTION IN THE SIDEBAR */}
            <div>
              <div className="px-1.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Pin size={11} className="text-amber-600 dark:text-amber-400" />
                  Notas Importantes
                </span>
                <span className="text-[9px] bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                  {pinnedMessages.length}
                </span>
              </div>

              {pinnedMessages.length === 0 ? (
                <div className="p-3 bg-amber-50/50 dark:bg-[#121215] border border-dashed border-amber-200 dark:border-zinc-800 rounded-2xl text-center">
                  <p className="text-[11px] text-amber-800/70 dark:text-zinc-400 font-medium leading-tight">
                    Sin avisos fijados en este chat.
                  </p>
                  <p className="text-[9px] text-amber-700/50 dark:text-zinc-500 mt-0.5">
                    Marca un mensaje con el pin 📌 para destacarlo aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pinnedMessages.map(notice => (
                    <div
                      key={notice.id}
                      className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-[#181612] dark:to-[#121215] border border-amber-300/80 dark:border-amber-500/30 rounded-2xl shadow-xs text-left group transition-all"
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1">
                          <Bell size={10} className="text-amber-600 dark:text-amber-400 shrink-0" />
                          {notice.senderName}
                        </span>
                        <button
                          onClick={() => toggleImportant(notice.id)}
                          className="opacity-60 hover:opacity-100 text-amber-900 dark:text-amber-400 text-[9px] font-bold hover:underline cursor-pointer"
                          title="Desanclar nota"
                        >
                          Quitar
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug break-words">
                        {notice.content}
                      </p>
                      <span className="text-[9px] text-amber-700/80 dark:text-zinc-400 font-medium mt-1.5 block">
                        {formatTime(notice.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT MAIN PANEL: ACTIVE CONVERSATION ── */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white ${
            mobileShowChat ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Header of Active Chat */}
          <div className="px-4 sm:px-6 py-3 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button on mobile */}
              <button
                onClick={() => setMobileShowChat(false)}
                className="md:hidden p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>

              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                  activeChannelId === 'general'
                    ? 'bg-zinc-950'
                    : activeMemberTarget?.role === 'OWNER'
                    ? 'bg-amber-500'
                    : 'bg-zinc-800'
                }`}
              >
                {activeChannelId === 'general' ? (
                  <Users size={16} />
                ) : activeMemberTarget?.role === 'OWNER' ? (
                  <Crown size={16} />
                ) : (
                  <Scissors size={16} />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-zinc-950 truncate">
                    {activeChannelId === 'general'
                      ? 'Chat de Equipo (General)'
                      : activeMemberTarget?.name || 'Chat Individual'}
                  </h3>
                  {activeChannelId !== 'general' && activeMemberTarget && (
                    <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md">
                      {activeMemberTarget.role === 'OWNER' ? 'Dueño' : 'Barbero'}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-2 truncate">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    En línea
                  </span>
                  <span>•</span>
                  <span>{messages.length} mensajes</span>
                  <span>•</span>
                  <span>Usa @ para citar</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-2">
              {/* Owner can share communication notes */}
              {isOwnerView && (
                <button
                  onClick={() => {
                    loadNotes()
                    setShowNotesModal(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                  title="Compartir una nota de comunicación del negocio"
                >
                  <FileText size={13} className="text-amber-600" />
                  <span className="hidden sm:inline">Notas Negocio</span>
                </button>
              )}

              {/* Both can attach appointment or agenda client */}
              <button
                onClick={() => {
                  loadAppointments()
                  setShowAppointmentModal(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                title={isOwnerView ? 'Adjuntar cita de la barbería' : 'Adjuntar cita o cliente de mi agenda'}
              >
                <Calendar size={13} className="text-zinc-600" />
                <span>{isOwnerView ? 'Citas' : 'Mi Agenda'}</span>
              </button>

              {pinnedMessages.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                  <Pin size={11} className="text-amber-600" />
                  <span>{pinnedMessages.length}</span>
                </span>
              )}
            </div>
          </div>

          {/* ── MESSAGES FEED ── */}
          <div
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 min-h-0"
            style={{
              background: 'var(--chat-bg, #f8f8f9)',
            }}
          >
            <style>{`
              :root { --chat-bg: #f4f4f5; }
              html.dark { --chat-bg: #111113; }
            `}</style>
            {loadingMessages && (
              <div className="flex items-center justify-center h-full gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Cargando conversación...
                </span>
              </div>
            )}

            {!loadingMessages && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 py-10">
                <div className="w-14 h-14 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                  <MessageSquare size={28} />
                </div>
                <div className="text-center max-w-sm">
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                    No hay mensajes en este chat
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Escribe un mensaje, cita a un barbero con @ o adjunta algo de tu agenda o notas.
                  </p>
                </div>
              </div>
            )}

            {messages.map(msg => {
              const isMe = Boolean(currentUser && msg.senderId === currentUser.memberId)
              const msgIsOwner = msg.senderRole === 'OWNER' || msg.senderRole === 'SUPER_ADMIN'

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  {/* Sender Name & Role */}
                  <div className={`flex items-center gap-2 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar badge */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm text-[10px] shrink-0 ${
                        isMe
                          ? 'bg-zinc-950 dark:bg-zinc-700'
                          : msgIsOwner
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                    >
                      {isMe ? <User size={13} /> : msgIsOwner ? <Crown size={12} /> : <Scissors size={12} />}
                    </div>
                    {/* Name + role pill */}
                    <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-[11px] font-black uppercase tracking-tight ${
                        isMe ? 'text-zinc-950 dark:text-white' : 'text-zinc-700 dark:text-zinc-200'
                      }`}>
                        {isMe ? 'Tú' : msg.senderName}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        isMe
                          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                          : msgIsOwner
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300'
                      }`}>
                        {isMe ? 'Yo' : msgIsOwner ? 'Dueño' : 'Barbero'}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Bubble Container */}
                  <div className={`relative max-w-xl lg:max-w-2xl xl:max-w-3xl ${isMe ? 'ml-6' : 'mr-6'}`}>
                    {/* Important badge if notice */}
                    {msg.isImportant && (
                      <div
                        className={`mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 rounded-lg text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 ${
                          isMe ? 'float-right clear-both' : ''
                        }`}
                      >
                        <Bell size={10} className="text-amber-600 dark:text-amber-400" />
                        Nota / Aviso Importante
                      </div>
                    )}

                    <div
                      className={`clear-both p-4 rounded-2xl text-xs leading-relaxed shadow-sm transition-all ${
                        isMe
                          ? 'bg-zinc-900 dark:bg-zinc-800 text-white rounded-tr-sm border border-zinc-700'
                          : msgIsOwner
                          ? 'bg-white dark:bg-[#1a1710] border-2 border-amber-300 dark:border-amber-500/50 text-zinc-900 dark:text-zinc-100 rounded-tl-sm shadow-amber-100/50 dark:shadow-none'
                          : 'bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'
                      } ${msg.isImportant ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-[#111113]' : ''}`}
                    >
                      {/* Attached Communication Note Card */}
                      {msg.note && (
                        <div
                          className={`mb-3 p-3.5 rounded-2xl border text-left shadow-xs transition-all ${
                            NOTE_COLOR_STYLES[msg.note.color || 'yellow']?.bg || 'bg-amber-50'
                          } ${NOTE_COLOR_STYLES[msg.note.color || 'yellow']?.border || 'border-amber-300'} ${
                            NOTE_COLOR_STYLES[msg.note.color || 'yellow']?.text || 'text-amber-950'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 border-b pb-2 mb-2 border-black/10">
                            <div className="flex items-center gap-1.5">
                              <FileText size={14} className="shrink-0 text-amber-700" />
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                Nota de Comunicación
                              </span>
                            </div>
                            {msg.note.category && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white/70 border border-black/10">
                                {CATEGORY_LABELS[msg.note.category] || msg.note.category}
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-sm mb-1">{msg.note.title}</h4>
                          <p className="font-medium whitespace-pre-wrap leading-relaxed opacity-90">
                            {msg.note.content}
                          </p>
                        </div>
                      )}

                      {/* Attached Appointment / Agenda Client Card */}
                      {msg.appointment && (
                        <div
                          className={`mb-3 p-3.5 rounded-xl border text-left transition-all ${
                            isMe
                              ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                              : 'bg-white border-zinc-300 text-zinc-900 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 border-b pb-2 mb-2 border-zinc-200/40">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-amber-500" />
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                Cita #{msg.appointment.reservationCode || msg.appointment.id.slice(0, 6)}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                msg.appointment.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : msg.appointment.status === 'COMPLETED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : msg.appointment.status === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {msg.appointment.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Cliente</span>
                              <span className="font-bold flex items-center gap-1">
                                {msg.appointment.clientName}
                              </span>
                              {msg.appointment.clientPhone && (
                                <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                  <Phone size={9} /> {msg.appointment.clientPhone}
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Servicio</span>
                              <span className="font-bold text-amber-500">
                                {msg.appointment.serviceName}
                              </span>
                              <span className="text-[10px] text-zinc-400 block mt-0.5 font-semibold">
                                ${Number(msg.appointment.servicePrice).toLocaleString('es-CO')}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Barbero</span>
                              <span className="font-medium">{msg.appointment.barberName}</span>
                            </div>

                            <div>
                              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Fecha y Hora</span>
                              <span className="font-medium text-emerald-500">
                                {formatTime(msg.appointment.date)}
                              </span>
                            </div>
                          </div>

                          {msg.appointment.clientNotes && (
                            <div className="mt-2 pt-1.5 border-t border-zinc-200/20 text-[10px] text-amber-500 font-medium">
                              Nota de cliente: {msg.appointment.clientNotes}
                            </div>
                          )}

                          {msg.appointment.notes && (
                            <div className="mt-1 text-[10px] text-zinc-400 italic">
                              Nota de cita: {msg.appointment.notes}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Main Message Text with @ Mentions */}
                      {msg.content && (
                        <div className="whitespace-pre-wrap break-words font-medium">
                          {renderMessageText(msg.content)}
                        </div>
                      )}

                      {/* Footer: check icons if sender */}
                      {isMe && (
                        <div className="flex justify-end mt-1 text-zinc-400">
                          <CheckCheck size={13} />
                        </div>
                      )}
                    </div>

                    {/* Pin/Unpin Action Button on hover */}
                    <button
                      onClick={() => toggleImportant(msg.id)}
                      title={msg.isImportant ? 'Quitar de notas importantes' : 'Fijar en notas importantes'}
                      className={`absolute -top-2 ${isMe ? '-left-3' : '-right-3'} w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shadow-md transition-all cursor-pointer ${
                        msg.isImportant
                          ? 'bg-amber-500 opacity-100 ring-2 ring-white'
                          : 'bg-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-700'
                      }`}
                    >
                      <Pin size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ── ATTACHED APPOINTMENT OR NOTE PREVIEW IN INPUT ── */}
          {(attachedAppointment || attachedNote) && (
            <div className="mx-4 mt-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {attachedNote ? (
                  <FileText size={15} className="text-amber-600 shrink-0" />
                ) : (
                  <Calendar size={15} className="text-amber-600 shrink-0" />
                )}
                <div className="truncate">
                  <span className="font-black text-amber-950 uppercase tracking-wide mr-2">
                    {attachedNote ? 'Nota de Comunicación:' : 'Cita de Agenda:'}
                  </span>
                  {attachedNote ? (
                    <>
                      <span className="font-bold text-zinc-900">{attachedNote.title}</span>
                      <span className="text-zinc-500 mx-1.5">·</span>
                      <span className="text-zinc-600 truncate">{attachedNote.content.slice(0, 30)}...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-zinc-900">{attachedAppointment?.clientName}</span>
                      <span className="text-zinc-500 mx-1.5">·</span>
                      <span className="text-zinc-600">{attachedAppointment?.serviceName}</span>
                      <span className="text-zinc-500 mx-1.5">·</span>
                      <span className="text-emerald-700 font-bold">
                        {attachedAppointment && formatTime(attachedAppointment.date)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setAttachedAppointment(null)
                  setAttachedNote(null)
                }}
                className="text-amber-700 hover:text-amber-950 p-1 hover:bg-amber-200/60 rounded-lg transition-colors"
                title="Quitar adjunto"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── @ MENTION AUTOCOMPLETE POPUP ── */}
          {showMentionMenu && mentionCandidates.length > 0 && (
            <div className="mx-4 mb-2 bg-white border border-zinc-300 rounded-2xl shadow-xl overflow-hidden z-20 shrink-0 max-h-48 overflow-y-auto">
              <div className="px-3 py-2 bg-zinc-100 border-b border-zinc-200 text-[10px] font-black uppercase text-zinc-500 flex items-center justify-between">
                <span>Citar a un miembro</span>
                <span>Enter o Click para seleccionar</span>
              </div>
              <button
                type="button"
                onClick={() => insertMention('todos')}
                className="w-full px-3 py-2 text-left hover:bg-amber-50 flex items-center gap-2.5 border-b border-zinc-100 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black">
                  @
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-zinc-900">@todos</div>
                  <div className="text-[10px] text-zinc-400">Notificar a todos los miembros</div>
                </div>
              </button>
              {mentionCandidates.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => insertMention(member.name.replace(/\s+/g, ''))}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center gap-2.5 border-b border-zinc-100 last:border-b-0 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-zinc-200 text-zinc-800 flex items-center justify-center text-[10px]">
                    {member.role === 'OWNER' ? <Crown size={12} className="text-amber-600" /> : <Scissors size={12} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-900 flex items-center justify-between">
                      <span>@{member.name.replace(/\s+/g, '')}</span>
                      <span className="text-[9px] uppercase px-1 py-0.2 bg-zinc-100 rounded text-zinc-500">
                        {member.role === 'OWNER' ? 'Dueño' : 'Barbero'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">{member.specialty || member.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── INPUT TOOLBAR & FORM ── */}
          <div className="p-3 sm:p-4 bg-white border-t border-zinc-100 space-y-2 shrink-0">
            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* @ Mention quick insert */}
              <button
                type="button"
                onClick={() => {
                  setText(prev => `${prev}@`)
                  setShowMentionMenu(true)
                  inputRef.current?.focus()
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all cursor-pointer"
                title="Citar a un barbero u owner"
              >
                <AtSign size={13} className="text-zinc-500" />
                <span>Mencionar</span>
              </button>

              {/* Owner Communication Notes button */}
              {isOwnerView && (
                <button
                  type="button"
                  onClick={() => {
                    loadNotes()
                    setShowNotesModal(true)
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    attachedNote
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                  title="Compartir una nota de comunicación de tu libreta al chat"
                >
                  <FileText size={13} className="text-zinc-500" />
                  <span>{attachedNote ? 'Nota adjunta ✓' : 'Notas Negocio'}</span>
                </button>
              )}

              {/* Attach appointment / agenda client button */}
              <button
                type="button"
                onClick={() => {
                  loadAppointments()
                  setShowAppointmentModal(true)
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  attachedAppointment
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
                title={isOwnerView ? 'Adjuntar cita de la barbería' : 'Adjuntar cita o cliente de mi agenda'}
              >
                <Calendar size={13} className="text-zinc-500" />
                <span>{attachedAppointment ? 'Agenda adjunta ✓' : isOwnerView ? 'Adjuntar Cita' : 'Mi Agenda'}</span>
              </button>

              {/* Important toggle button */}
              <button
                type="button"
                onClick={() => setIsImportant(!isImportant)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isImportant
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
                title="Marcar como nota / aviso importante para que quede fijada en el panel"
              >
                <Pin size={12} className={isImportant ? 'text-white' : 'text-zinc-500'} />
                <span>{isImportant ? 'Aviso Activo 📌' : 'Nota Importante'}</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={handleTextChange}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !showMentionMenu) {
                    handleSend(e as unknown as React.FormEvent)
                  }
                }}
                placeholder={
                  activeChannelId === 'general'
                    ? 'Escribe al equipo... (escribe @ para citar)'
                    : `Mensaje directo para ${activeMemberTarget?.name || 'este chat'}...`
                }
                className="flex-1 px-4 sm:px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-950 focus:bg-white transition-all placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={(!text.trim() && !attachedAppointment && !attachedNote) || sending}
                className="bg-zinc-950 hover:bg-zinc-800 text-white px-5 sm:px-6 py-3 rounded-2xl transition-all disabled:opacity-40 flex items-center gap-2 shrink-0 shadow-md cursor-pointer"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  Enviar
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── OWNER NOTES SELECTOR MODAL (Communication Notes) ── */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 bg-zinc-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Notas de Comunicación del Negocio</h3>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Selecciona una nota de tu libreta para compartirla con el equipo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotesModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-zinc-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-4 border-b border-zinc-200 bg-zinc-50">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={notesSearch}
                  onChange={e => setNotesSearch(e.target.value)}
                  placeholder="Buscar notas por título, contenido o categoría..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-950 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {loadingNotes ? (
                <div className="flex items-center justify-center h-48 gap-3 text-zinc-400">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cargando notas...</span>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2">
                  <FileText size={36} className="opacity-30" />
                  <p className="text-xs font-black uppercase">No tienes notas de comunicación guardadas</p>
                  <p className="text-[11px]">Crea notas desde la sección Notas del menú lateral para compartirlas aquí.</p>
                </div>
              ) : (
                filteredNotes.map(note => {
                  const style = NOTE_COLOR_STYLES[note.color || 'yellow'] || NOTE_COLOR_STYLES.yellow

                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setAttachedNote(note)
                        setAttachedAppointment(null)
                        setShowNotesModal(false)
                        toast.success(`Nota "${note.title}" adjuntada al mensaje`)
                      }}
                      className={`p-4 rounded-2xl border ${style.border} ${style.bg} hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wide ${style.text}`}>
                            {note.title}
                          </span>
                          {note.category && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/80 border border-black/10">
                              {CATEGORY_LABELS[note.category] || note.category}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${style.text} opacity-80 line-clamp-2 leading-relaxed`}>
                          {note.content}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="shrink-0 px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Compartir
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── APPOINTMENT / AGENDA CLIENT SELECTOR MODAL ── */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 bg-zinc-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Calendar size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">
                    {isOwnerView ? 'Citas y Clientes del Negocio' : 'Mi Agenda & Clientes'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Selecciona una cita o cliente de tu agenda para aclarar dudas en el chat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-zinc-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-4 border-b border-zinc-200 bg-zinc-50">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={appointmentSearch}
                  onChange={e => {
                    setAppointmentSearch(e.target.value)
                    loadAppointments(e.target.value)
                  }}
                  placeholder="Buscar por cliente, teléfono, barbero o servicio..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-950 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Appointments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {loadingAppointments ? (
                <div className="flex items-center justify-center h-48 gap-3 text-zinc-400">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cargando agenda...</span>
                </div>
              ) : availableAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2">
                  <Calendar size={36} className="opacity-30" />
                  <p className="text-xs font-black uppercase">No se encontraron citas o clientes</p>
                  <p className="text-[11px]">Intenta buscar con otro término</p>
                </div>
              ) : (
                availableAppointments.map(app => (
                  <div
                    key={app.id}
                    onClick={() => {
                      setAttachedAppointment(app)
                      setAttachedNote(null)
                      setShowAppointmentModal(false)
                      toast.success(`Cita de ${app.clientName} adjuntada al chat`)
                    }}
                    className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-950 hover:shadow-md transition-all cursor-pointer bg-white group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wide text-zinc-950">
                          {app.clientName}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            app.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">
                          #{app.reservationCode}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-600 font-medium flex items-center gap-3 flex-wrap">
                        <span className="text-amber-700 font-bold">{app.serviceName}</span>
                        <span>•</span>
                        <span>Barbero: {app.barberName}</span>
                        <span>•</span>
                        <span>${app.servicePrice.toLocaleString('es-CO')}</span>
                      </div>

                      {app.clientNotes && (
                        <div className="text-[10px] text-amber-600 font-medium">
                          Nota cliente: {app.clientNotes}
                        </div>
                      )}

                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                        <Clock size={11} />
                        {formatTime(app.date)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="shrink-0 px-4 py-2 bg-zinc-100 group-hover:bg-zinc-950 group-hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Adjuntar
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
