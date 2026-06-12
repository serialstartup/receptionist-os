import { TopBar } from "@/components/dashboard/top-bar"
import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar title="Messages" subtitle="Manage AI and human conversations across platforms." />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: conversation list skeleton */}
        <div className="flex w-80 shrink-0 flex-col border-r bg-card">
          <div className="border-b p-3">
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-3.5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: empty state */}
        <div className="flex flex-1 flex-col items-center justify-center bg-muted/10">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
    </div>
  )
}
