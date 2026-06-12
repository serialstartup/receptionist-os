"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Send, MessageSquare, Bot, UserCheck } from "lucide-react"
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
  messages: { content: string; role: string; created_at: string }[] | null
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

  const initials = (name: string | undefined) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?"

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar
        title="Messages"
        subtitle="Manage AI and human conversations across platforms."
        profile={profile}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Conversation List */}
        <div className="flex w-80 shrink-0 flex-col border-r bg-card">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-8 bg-background"
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
              <div className="flex flex-col">
                {filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelect(conv.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60 border-b border-border/50",
                      selectedId === conv.id && "bg-accent"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="text-sm font-semibold">
                          {initials(conv.customers?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                          conv.platform === "whatsapp" ? "bg-green-500" : "bg-pink-500"
                        )}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold truncate">
                          {conv.customers?.name ?? "Unknown"}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.messages?.[0]?.content ?? conv.customers?.phone ?? "—"}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "w-fit mt-0.5 h-4 text-[10px] px-1.5",
                          conv.ai_enabled
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-orange-500/10 text-orange-700 dark:text-orange-400"
                        )}
                      >
                        {conv.ai_enabled ? "AI Active" : "Human"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right: Chat Window */}
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex h-16 items-center justify-between border-b bg-card px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs font-semibold">
                        {initials(selectedConversation.customers?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
                        selectedConversation.platform === "whatsapp" ? "bg-green-500" : "bg-pink-500"
                      )}
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold leading-none">
                      {selectedConversation.customers?.name ?? "Unknown"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {selectedConversation.platform} ·{" "}
                      {selectedConversation.ai_enabled ? "AI Yanıtlıyor" : "Manuel Mod"}
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

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 bg-muted/20">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    No messages in this conversation yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((msg) => {
                      const isUser = msg.role === "user"
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[70%]",
                            isUser ? "self-start" : "self-end items-end"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                              isUser
                                ? "bg-card text-foreground rounded-tl-sm border border-border/50"
                                : "bg-primary text-primary-foreground rounded-tr-sm"
                            )}
                          >
                            {msg.content}
                          </div>
                          <span className="mt-0.5 text-[10px] text-muted-foreground px-1">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Input — Human Mode only */}
              {!selectedConversation.ai_enabled ? (
                <div className="border-t bg-card px-4 py-3 shrink-0">
                  <form className="flex items-center gap-2" onSubmit={handleSendReply}>
                    <Input
                      placeholder="Type a message..."
                      className="flex-1 rounded-full bg-background"
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
                  <p className="text-center text-[10px] text-muted-foreground mt-1.5">
                    Sending via {selectedConversation.platform} · AI paused
                  </p>
                </div>
              ) : (
                <div className="border-t bg-card px-4 py-3 shrink-0">
                  <p className="text-center text-xs text-muted-foreground">
                    AI is handling this conversation · <button onClick={handleToggleAI} className="underline hover:text-foreground transition-colors">Take Over</button> to reply manually
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-8 bg-muted/10">
              <div className="rounded-full bg-muted p-5 mb-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Select a conversation</h3>
              <p className="text-muted-foreground max-w-xs mt-1.5 text-sm">
                Choose a customer from the list to view messages and manage AI responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
