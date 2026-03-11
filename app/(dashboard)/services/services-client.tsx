"use client"

import { useState } from "react"
import { TopBar } from "@/components/dashboard/top-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, Search, Scissors, X, Loader2 } from "lucide-react"
import { createService } from "../actions"
import { useRouter } from "next/navigation"

type Category = "all" | "hair" | "nails" | "skin" | "massage"

interface ServicesClientProps {
  services: any[]
}

const categoryColors: Record<string, string> = {
  HAIR: "bg-primary/10 text-primary",
  NAILS: "bg-destructive/10 text-destructive",
  MASSAGE: "bg-success/10 text-success",
  SKIN: "bg-chart-1/10 text-chart-1",
}

export function ServicesClient({ services }: ServicesClientProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("all")
  const [searchQuery, setSearchQuery] = useState("")
  // Set the first service as safely selected if array exists, otherwise null
  const [selectedService, setSelectedService] = useState<any | null>(
    services.length > 0 ? services[0] : null
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "HAIR",
    price: "",
    duration_minutes: "30",
    description: "",
  })

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createService({
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        description: formData.description,
      })
      setIsModalOpen(false)
      setFormData({
        name: "",
        category: "HAIR",
        price: "",
        duration_minutes: "30",
        description: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error creating service:", error)
      alert("Failed to create service. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredServices = services.filter((s) => {
    const matchesCategory =
      activeCategory === "all" || s.category?.toLowerCase() === activeCategory
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Format duration
  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    return `${mins}m`
  }

  return (
    <div>
      <TopBar
        title="Services & Pricing"
        subtitle="Manage your salon menu, pricing, and service durations."
        searchPlaceholder="Search services..."
      />

      <div className="p-6">
        <div className="flex items-center justify-end">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            Add New Service
          </button>
        </div>

        {services.length === 0 ? (
          <div className="mt-6">
            <EmptyState 
              icon={Scissors}
              title="No services offered yet"
              description="Your menu is currently empty. Add the services you offer to start accepting appointments."
              action={
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Add Service
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Services Table */}
            <div className="col-span-1 overflow-hidden rounded-xl border border-border bg-card lg:col-span-2 flex flex-col min-h-[500px]">
              {/* Category Filters + Search */}
              <div className="flex flex-col items-start gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-1">
                  {(["all", "hair", "nails", "skin", "massage"] as Category[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          "rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-all focus:outline-none",
                          activeCategory === cat
                            ? "bg-accent text-foreground font-semibold shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {cat === "all" ? "All" : cat}
                      </button>
                    )
                  )}
                </div>
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Find a service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-background pr-4 pl-9 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {[
                        "Service Name",
                        "Category",
                        "Duration",
                        "Price",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredServices.map((service) => (
                      <tr
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-accent/30 group",
                          selectedService?.id === service.id && "bg-accent/40"
                        )}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-foreground">
                            {service.name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-semibold tracking-wider uppercase",
                              categoryColors[service.category?.toUpperCase()] || "bg-muted text-muted-foreground"
                            )}
                          >
                            {service.category || "OTHER"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {formatDuration(service.duration_minutes)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">
                          ${service.price}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              service.is_active
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {service.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredServices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                          No services match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Service Details Panel */}
            {selectedService ? (
              <div className="rounded-xl border border-border bg-card p-6 h-fit">
                <h3 className="text-lg font-bold text-foreground">
                  Service Details
                </h3>

                <div className="mt-5 space-y-5">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">{selectedService.name}</h4>
                    <p className="text-primary font-medium mt-1">${selectedService.price} • {formatDuration(selectedService.duration_minutes)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Description
                    </p>
                    <p className="mt-1.5 rounded-lg border border-border bg-accent/30 p-3 text-sm leading-relaxed text-muted-foreground min-h-[80px]">
                      {selectedService.description || "No description provided."}
                    </p>
                  </div>

                  {/* Staff Assignment & Buffer removed for MVP as per plan */}

                  <button className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-primary hover:bg-accent/80 transition-colors mt-4">
                    Edit Details
                  </button>
                </div>
              </div>
            ) : (
               <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                  <Scissors className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Select a service to view its details</p>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add New Service</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Service Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Signature Haircut"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="HAIR">Hair</option>
                    <option value="NAILS">Nails</option>
                    <option value="SKIN">Skin</option>
                    <option value="MASSAGE">Massage</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Price ($)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Duration (Minutes)
                </label>
                <select
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer"
                >
                  <option value="15">15 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">1 hour</option>
                  <option value="90">1 hour 30 mins</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Description
                </label>
                <textarea
                  placeholder="Describe your service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-24 resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
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
                      Creating...
                    </>
                  ) : (
                    "Create Service"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
