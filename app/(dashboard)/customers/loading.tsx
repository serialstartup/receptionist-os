import { TopBar } from "@/components/dashboard/top-bar"
import { Skeleton } from "@/components/ui/skeleton"

export default function CustomersLoading() {
  return (
    <div>
      <TopBar title="Customers" searchPlaceholder="Loading..." />
      <div className="p-6">
        {/* Actions Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-muted/50 p-4 flex gap-4">
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
          </div>
          <div className="space-y-4 p-6">
             {Array.from({ length: 10 }).map((_, i) => (
               <Skeleton key={i} className="h-12 w-full" />
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
