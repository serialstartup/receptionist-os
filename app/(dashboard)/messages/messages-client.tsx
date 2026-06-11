"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MoreVertical, Send, User, MessageSquare, Phone as PhoneIcon, Bot, UserCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getConversationMessages, toggleAITakeover, sendHumanReply, getConversations } from "@/app/(dashboard)/actions"
import { toast } from "sonner"
import { TopBar } from "@/components/dashboard/top-bar"

interface Conversation {
  id: string
  platform: string
  current_state: string
  ai_enabled: boolean
  last_message_at: string
  customers: { id: string; name: string; phone: string } | null
}

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

interface MessagesClientProps {
  profile: any
  conversations: Conversation[]
}

export function MessagesClient({ profile, conversations }: MessagesClientProps) {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [togglingAI, setTogglingAI] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [localConversations, setLocalConversations] = useState(conversations)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedConversation = localConversations.find((c) => c.id === selectedId) ?? null

  const filtered = localConversations.filter((c) => {
    const name = c.customers?.name?.toLowerCase() ?? ""
    const phone = c.customers?.phone?.toLowerCase() ?? ""
    const q = search.toLowerCase()
    return name.includes(q) || phone.includes(q)
  })

  const handleSelect = async (id: string) => {
    setSelectedId(id)
    setLoadingMessages(true)
    try {
      const data = await getConversationMessages(id)
      setMessages(data as Message[])
    } catch {
      setMessages([])
      toast.error("Failed to load messages.")
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConversation || !replyText.trim() || sendingReply) return
    setSendingReply(true)
    try {
      const result = await sendHumanReply(selectedConversation.id, replyText.trim())
      setReplyText("")
      if (result.message) {
        setMessages((prev) => [...prev, result.message as Message])
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send message.")
    } finally {
      setSendingReply(false)
    }
  }

  const handleToggleAI = async () => {
    if (!selectedConversation) return
    setTogglingAI(true)
    const next = !selectedConversation.ai_enabled
    try {
      await toggleAITakeover(selectedConversation.id, next)
      setLocalConversations((prev) =>
        prev.map((c) => (c.id === selectedConversation.id ? { ...c, ai_enabled: next } : c))
      )
    } catch {
      // revert on error — no state change
    } finally {
      setTogglingAI(false)
    }
  }

  // Poll messages for selected conversation every 4 seconds
  useEffect(() => {
    if (!selectedId) return
    const poll = async () => {
      if (document.visibilityState !== "visible") return
      try {
        const data = await getConversationMessages(selectedId)
        setMessages((prev) => {
          const incoming = data as Message[]
          const lastPrev = prev[prev.length - 1]?.id
          const lastNew = incoming[incoming.length - 1]?.id
          return lastPrev !== lastNew ? incoming : prev
        })
      } catch {
        // silent — don't disrupt UX on poll failure
      }
    }
    const interval = setInterval(poll, 4000)
    return () => clearInterval(interval)
  }, [selectedId])

  // Poll conversations list every 10 seconds
  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState !== "visible") return
      try {
        const data = await getConversations()
        setLocalConversations(data)
      } catch {
        // silent
      }
    }
    const interval = setInterval(poll, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const platformIcon = (platform: string) => {
    if (platform === "whatsapp") return <span className="h-3 w-3 rounded-full bg-green-500 inline-block" />
    if (platform === "instagram") return <span className="h-3 w-3 rounded-full bg-pink-500 inline-block" />
    return <PhoneIcon className="h-3 w-3 text-muted-foreground" />
  }

  const initials = (name: string | undefined) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?"

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        title="Messages"
        subtitle="Manage AI and human conversations across platforms."
        profile={profile}
      />

      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        <Card className="flex flex-1 overflow-hidden">
          {/* Left: Conversation List */}
          <div className="flex w-80 flex-col border-r shrink-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-sm text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                  {search ? "No matching conversations." : "No conversations yet."}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5 p-2">
                  {filtered.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelect(conv.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-lg p-3 text-left transition-all hover:bg-accent",
                        selectedId === conv.id && "bg-accent"
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-xs">
                          {initials(conv.customers?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-1 flex-col gap-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold truncate">
                            {conv.customers?.name ?? "Unknown"}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.customers?.phone ?? "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {platformIcon(conv.platform)}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "h-4 text-[10px] px-1.5",
                              conv.ai_enabled ? "bg-primary/10 text-primary" : "bg-muted"
                            )}
                          >
                            {conv.ai_enabled ? "AI Active" : "Human"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: Chat Window */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {initials(selectedConversation.customers?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-sm font-semibold leading-none">
                        {selectedConversation.customers?.name ?? "Unknown"}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {selectedConversation.platform} •{" "}
                        {selectedConversation.ai_enabled ? "AI Active" : "Human Mode"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={selectedConversation.ai_enabled ? "outline" : "default"}
                    size="sm"
                    onClick={handleToggleAI}
                    disabled={togglingAI}
                    className="flex items-center gap-1.5"
                  >
                    {selectedConversation.ai_enabled ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        Take Over
                      </>
                    ) : (
                      <>
                        <Bot className="h-3.5 w-3.5" />
                        Hand Back to AI
                      </>
                    )}
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                      No messages in this conversation yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {messages.map((msg) => {
                        const isUser = msg.role === "user"
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col max-w-[75%]",
                              isUser ? "self-start" : "self-end items-end"
                            )}
                          >
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                isUser
                                  ? "bg-accent text-foreground rounded-tl-sm"
                                  : "bg-primary text-primary-foreground rounded-tr-sm"
                              )}
                            >
                              {msg.content}
                            </div>
                            <span className="mt-1 text-[10px] text-muted-foreground px-1">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        )
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input (Human Mode only) */}
                {!selectedConversation.ai_enabled && (
                  <div className="border-t p-3 shrink-0">
                    <form
                      className="flex items-center gap-2"
                      onSubmit={handleSendReply}
                    >
                      <Input
                        placeholder="Type a message..."
                        className="flex-1 rounded-full"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={sendingReply}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="rounded-full shrink-0"
                        disabled={sendingReply || !replyText.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    <p className="text-center text-[10px] text-muted-foreground mt-2">
                      Sending via {selectedConversation.platform} — AI is paused for this conversation.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <div className="rounded-full bg-accent p-6 mb-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Select a conversation</h3>
                <p className="text-muted-foreground max-w-sm mt-2 text-sm">
                  Choose a customer from the list to view their message history and manage AI responses.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
