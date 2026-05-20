"use client"

import { useState } from "react"
import { TopBar } from "@/components/dashboard/top-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { Plus, SlidersHorizontal, MoreVertical, Users, X, Loader2, Search, Pencil, Trash2 } from "lucide-react"
import { createCustomer, updateCustomer, deleteCustomer } from "../actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TabFilter = "all" | "new" | "returning"

const tagStyles: Record<string, string> = {
  NEW: "bg-success/10 text-success",
  RETURNING: "bg-primary/10 text-primary",
  VIP: "bg-warning/10 text-warning",
}

interface CustomersClientProps {
  customers: any[]
  profile?: any
}

export function CustomersClient({ customers, profile }: CustomersClientProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    notes: "",
  })

  const [editingCustomer, setEditingCustomer] = useState<any | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    notes: "",
  })
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    minVisits: 0,
    hasNotes: false,
    hasEmail: false,
  })

  const router = useRouter()
  const itemsPerPage = 10

  const openEdit = (customer: any) => {
    setEditingCustomer(customer)
    setEditFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      age: customer.age?.toString() || "",
      notes: customer.notes || "",
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return
    setIsEditSubmitting(true)
    try {
      await updateCustomer(editingCustomer.id, {
        ...editFormData,
        age: editFormData.age ? parseInt(editFormData.age) : undefined,
      })
      setEditingCustomer(null)
      toast.success("Customer updated.")
      router.refresh()
    } catch {
      toast.error("Failed to update customer.")
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer? All their appointments will remain but they'll be unlinked.")) return
    try {
      await deleteCustomer(id)
      toast.success("Customer deleted.")
      router.refresh()
    } catch {
      toast.error("Failed to delete customer.")
    }
  }

  const resetFilters = () => {
    setFilters({
      minVisits: 0,
      hasNotes: false,
      hasEmail: false,
    })
    setActiveTab("all")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createCustomer({
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
      })
      setIsModalOpen(false)
      setFormData({ name: "", phone: "", email: "", age: "", notes: "" })
      toast.success("Customer created.")
      router.refresh()
    } catch {
      toast.error("Failed to create customer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Basic client-side filtering logic for MVP
  const filteredCustomers = customers.filter(c => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchLower) ||
      c.phone?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower)

    if (!matchesSearch) return false

    // Status filtering
    if (activeTab === "new" && !c.tags?.includes("NEW")) return false
    if (activeTab === "returning" && !(c.visit_count > 1 || c.tags?.includes("RETURNING"))) return false

    // Advanced filtering
    if (filters.minVisits > 0 && (c.visit_count || 0) < filters.minVisits) return false
    if (filters.hasNotes && !c.notes) return false
    if (filters.hasEmail && !c.email) return false

    return true
  })

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div>
      <TopBar 
        title="Customers" 
        searchPlaceholder="Search by name, phone or email..."
        profile={profile}
      />

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
          <div className="flex w-full flex-1 items-center gap-3 sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 w-full rounded-lg border border-border bg-background pr-4 pl-9 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors",
                isFilterModalOpen ? "bg-accent text-foreground" : "text-foreground hover:bg-accent"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(filters.minVisits > 0 || filters.hasNotes || filters.hasEmail) && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  !
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </div>

        {customers.length === 0 || filteredCustomers.length === 0 ? (
          <div className="mt-6">
            <EmptyState 
              icon={Users}
              title={customers.length === 0 ? "No customers found" : "No results found"}
              description={customers.length === 0 
                ? "You haven't added any customers yet. Add your first customer manual or via import."
                : `We couldn't find any customers matching "${searchQuery}".`
              }
              action={customers.length === 0 && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Add Customer
                </button>
              )}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(customer)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* New Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add New Customer</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Phone Number
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="+90..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Age (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Special preferences or history..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all h-24 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Create Customer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Customer</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <input required type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Phone Number</label>
                  <input required type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Age (Optional)</label>
                  <input type="number" value={editFormData.age} onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email (Optional)</label>
                  <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Internal Notes (Optional)</label>
                  <textarea value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all h-24 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingCustomer(null)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={isEditSubmitting} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-sm">
                  {isEditSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Advanced Filters</h3>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                  Activity
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Minimum Visits</span>
                    <select 
                      value={filters.minVisits}
                      onChange={(e) => setFilters({ ...filters, minVisits: parseInt(e.target.value) })}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value={0}>Any</option>
                      <option value={2}>2+ visits</option>
                      <option value={5}>5+ visits</option>
                      <option value={10}>10+ visits</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={filters.hasNotes}
                      onChange={(e) => setFilters({ ...filters, hasNotes: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">Has internal notes</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={filters.hasEmail}
                      onChange={(e) => setFilters({ ...filters, hasEmail: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">Has email address</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-8">
              <button
                onClick={resetFilters}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
