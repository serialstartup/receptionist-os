"use client"

import { useState } from "react"
import { Search, MoreVertical, Send, User, MessageSquare, Instagram, Phone as WhatsApp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function MessagesPage() {
  const [selectedThread, setSelectedThread] = useState<string | null>(null)

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Manage your AI assistant and human takeovers across WhatsApp and Instagram.
        </p>
      </div>

      <Card className="flex flex-1 overflow-hidden border-none bg-background/50 backdrop-blur-xl transition-all duration-300">
        {/* Left Sidebar: Threads */}
        <div className="flex w-full flex-col border-r md:w-80 lg:w-96">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-8 bg-background/50"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1 p-2">
              {[1, 2, 3].map((i) => (
                <button
                  key={i}
                  onClick={() => setSelectedThread(i.toString())}
                  className={`flex items-start gap-4 rounded-lg p-3 text-left transition-all hover:bg-accent ${
                    selectedThread === i.toString() ? "bg-accent" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Customer {i}</span>
                      <span className="text-xs text-muted-foreground">14:30</span>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      Is there any availability for tomorrow afternoon?
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {i % 2 === 0 ? (
                        <WhatsApp className="h-3 w-3 text-green-500" />
                      ) : (
                        <Instagram className="h-3 w-3 text-pink-500" />
                      )}
                      <Badge variant="secondary" className="h-4 text-[10px] px-1">AI Logic</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Pane: Chat Window */}
        <div className="flex flex-1 flex-col bg-background/20">
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold leading-none">Customer {selectedThread}</h2>
                    <p className="text-xs text-muted-foreground mt-1">AI Agent Active • WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    Human Takeover
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex max-w-[80%] flex-col gap-2 rounded-2xl bg-accent p-4 text-sm">
                    Hi! I'd like to book a lash lift for tomorrow.
                  </div>
                  <div className="flex max-w-[80%] self-end flex-col gap-2 rounded-2xl bg-primary p-4 text-sm text-primary-foreground">
                    Hello! Let me check that for you...
                  </div>
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t backdrop-blur-md">
                <form className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message to take over..."
                    className="flex-1 bg-background/50 rounded-full"
                  />
                  <Button type="submit" size="icon" className="rounded-full shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-8">
              <div className="rounded-full bg-accent p-6 mb-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Select a conversation</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Choose a customer from the list to view their history and manage the AI response.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
