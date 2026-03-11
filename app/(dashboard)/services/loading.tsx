import { TopBar } from "@/components/dashboard/top-bar"
import { Skeleton } from "@/components/ui/skeleton"

export default function ServicesLoading() {
  return (
    <div>
      <TopBar title="Services & Pricing" searchPlaceholder="Loading..." />
      <div className="p-6">
        <div className="flex justify-end mb-6">
           <Skeleton className="h-10 w-36 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Table Skeleton */}
          <div className="col-span-1 border border-border bg-card rounded-xl lg:col-span-2 min-h-[500px]">
            <div className="border-b border-border p-4 flex gap-4">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
            <div className="p-6 space-y-4">
               {Array.from({ length: 6 }).map((_, i) => (
                 <Skeleton key={i} className="h-12 w-full rounded-md" />
               ))}
            </div>
          </div>

          {/* Details Panel Skeleton */}
          <div className="border border-border bg-card rounded-xl p-6">
            <Skeleton className="h-6 w-1/3 mb-6" />
            <Skeleton className="h-8 w-2/4 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-6" />
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-24 w-full mb-6" />
            <Skeleton className="h-10 w-full mt-10" />
          </div>
        </div>
      </div>
    </div>
  )
}
