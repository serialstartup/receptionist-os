"use client"

import { useState } from "react"
import { TopBar } from "@/components/dashboard/top-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { Plus, SlidersHorizontal, MoreVertical, Users } from "lucide-react"

type TabFilter = "all" | "new" | "returning"

const tagStyles: Record<string, string> = {
  NEW: "bg-success/10 text-success",
  RETURNING: "bg-primary/10 text-primary",
  VIP: "bg-warning/10 text-warning",
}

interface CustomersClientProps {
  customers: any[]
}

export function CustomersClient({ customers }: CustomersClientProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Basic client-side filtering logic for MVP
  const filteredCustomers = customers.filter(c => {
    if (activeTab === "all") return true
    if (activeTab === "new") return c.tags?.includes("NEW")
    if (activeTab === "returning") return c.visit_count > 1 || c.tags?.includes("RETURNING")
    return true
  })

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div>
      <TopBar title="Customers" searchPlaceholder="Search customers..." />

      <div className="p-6">
        {/* Action Row */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-wrap items-center gap-1 overflow-x-auto pb-2 sm:w-auto sm:pb-0">
            {(
              [
                { key: "all", label: "All Customers" },
                { key: "new", label: "New Leads" },
                { key: "returning", label: "Returning" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setCurrentPage(1)
                }}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-all focus:outline-none",
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all">
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="mt-6">
            <EmptyState 
              icon={Users}
              title="No customers found"
              description="You haven't added any customers yet. Add your first customer manual or via import."
              action={
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  Add Customer
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    "Name",
                    "Phone",
                    "Age",
                    "Visit Count",
                    "Last Service",
                    "Tags",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition-colors hover:bg-accent/30 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase">
                          {customer.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {customer.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {customer.age || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {customer.visit_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {customer.last_visit_at ? new Date(customer.last_visit_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {customer.tags && customer.tags.length > 0 ? (
                          customer.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                tagStyles[tag.toUpperCase()] || "bg-muted text-muted-foreground"
                              )}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No customers match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredCustomers.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredCustomers.length)}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-semibold text-foreground">{filteredCustomers.length}</span> results
                </p>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
                    // Logic to show pages around current page, simplified for MVP
                    let pageNum = currentPage
                    if (currentPage === 1) pageNum = i + 1
                    else if (currentPage === totalPages && totalPages > 2) pageNum = totalPages - 2 + i
                    else pageNum = currentPage - 1 + i
                    
                    if (pageNum > totalPages) return null

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                          currentPage === pageNum
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "border border-transparent text-foreground hover:bg-accent border-border"
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
