import { TopBar } from "@/components/dashboard/top-bar"
import { Skeleton } from "@/components/ui/skeleton"

export default function CampaignsLoading() {
  return (
    <div>
      <TopBar title="AI Marketing Campaigns" searchPlaceholder="Loading..." />
      <div className="p-6">
        {/* Actions Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <Skeleton className="h-16 w-64 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>

        {/* Table/List Skeleton */}
        <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-muted/50 p-4">
             <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-4 p-6">
             <Skeleton className="h-12 w-full" />
             <Skeleton className="h-12 w-full" />
             <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
