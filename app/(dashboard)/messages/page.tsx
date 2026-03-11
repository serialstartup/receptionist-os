import { TopBar } from "@/components/dashboard/top-bar"
import { Lock, MessageSquare } from "lucide-react"

export default function MessagesPage() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar title="Messages" subtitle="Communicate with your clients" />

      <div className="flex-1 p-6 relative flex flex-col items-center justify-center">
        {/* Blurred background effect to signify locked feature */}
        <div className="absolute inset-4 blur-sm opacity-50 pointer-events-none rounded-2xl border border-border bg-card flex flex-col justify-between overflow-hidden">
           <div className="p-4 border-b border-border space-y-4">
              <div className="h-10 w-48 bg-muted rounded-md" />
           </div>
           <div className="flex-1 p-6 space-y-6">
              <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-muted" /><div className="w-1/3 h-16 rounded-2xl bg-muted" /></div>
              <div className="flex gap-4 justify-end"><div className="w-1/4 h-12 rounded-2xl bg-primary/20" /></div>
              <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-muted" /><div className="w-1/2 h-20 rounded-2xl bg-muted" /></div>
           </div>
           <div className="p-4 border-t border-border">
              <div className="h-12 w-full bg-muted rounded-full" />
           </div>
        </div>

        {/* Lock Overlay Content */}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-md text-center bg-card p-10 rounded-2xl shadow-lg border border-border/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 ring-8 ring-primary/5">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
            Messaging Hub Coming Soon
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We are building a unified inbox for seamless, real-time communication with your clients. This feature will be unlocked in our next major update.
          </p>
          <div className="flex gap-4 w-full justify-center">
            <button disabled className="rounded-xl px-6 py-3 font-semibold bg-muted text-muted-foreground cursor-not-allowed">
              Unlock Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
