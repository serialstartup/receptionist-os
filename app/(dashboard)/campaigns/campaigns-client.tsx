"use client"

import { useState } from "react"
import { TopBar } from "@/components/dashboard/top-bar"
import { StatsCard } from "@/components/ui/stats-card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import {
  Plus,
  Mail,
  Wifi,
  DollarSign,
  MoreVertical,
  MessageSquare,
  Clock,
  Sparkles,
  Bot,
  X,
  Loader2,
  Zap,
  ChevronRight,
  Search,
  Scissors as ScissorsIcon
} from "lucide-react"
import { createCampaign, executeCampaign, updateCampaign, deleteCampaign } from "../actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TabFilter = "all" | "active" | "draft" | "completed"

interface CampaignsClientProps {
  campaigns: any[]
  profile?: any
}

const statusStyles: Record<string, string> = {
  ACTIVE: "text-success bg-success/10",
  DRAFT: "text-primary bg-primary/10",
  COMPLETED: "text-muted-foreground bg-muted",
  PAUSED: "text-warning bg-warning/10",
}

export function CampaignsClient({ campaigns, profile }: CampaignsClientProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "Promotional",
    discount_value: "10",
  })
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null)

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm("Send this campaign to all customers with a phone number?")) return
    setSendingCampaignId(campaignId)
    try {
      const result = await executeCampaign(campaignId)
      toast.success(`Campaign sent to ${result.sent} customers.`)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to send campaign: ${error.message}`)
    } finally {
      setSendingCampaignId(null)
    }
  }

  const aiSuggestions = [
    {
      name: "Slow Monday Morning Boost",
      type: "Promotional",
      discount: "20",
      description: "Target clients for 09:00 - 12:00 slots on Mondays.",
      icon: Clock,
    },
    {
      name: "Weekend Rush Early Bird",
      type: "Promotional",
      discount: "15",
      description: "Fill up Friday afternoon slots before the weekend.",
      icon: Sparkles,
    },
    {
      name: "Last Minute Filler",
      type: "Re-engagement",
      discount: "25",
      description: "Send to clients who haven't visited in 30 days for tomorrow.",
      icon: Zap,
    },
    {
      name: "Mid-week Transformation",
      type: "Promotional",
      discount: "10",
      description: "Special offer for Wednesday treatments.",
      icon: ScissorsIcon,
    }
  ]

  const applySuggestion = (suggestion: typeof aiSuggestions[0]) => {
    setFormData({
      ...formData,
      name: suggestion.name,
      type: suggestion.type,
      discount_value: suggestion.discount,
    })
    setShowAiSuggestions(false)
  }

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createCampaign({
        name: formData.name,
        type: formData.type,
        status: "ACTIVE", 
        discount_value: parseInt(formData.discount_value),
        rules: { 
          smart_dispatch: true,
          frequency: "weekly" 
        }
      })
      setIsModalOpen(false)
      setFormData({
        name: "",
        type: "Promotional",
        discount_value: "10",
      })
      router.refresh()
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error("Failed to create campaign. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCampaigns = campaigns.filter(c => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = c.name?.toLowerCase().includes(searchLower)
    
    if (!matchesSearch) return false

    if (activeTab === "all") return true
    return c.status?.toLowerCase() === activeTab
  })

  // Calculate totals
  const totalSent = campaigns.reduce((acc, curr) => acc + (curr.sent_count || 0), 0)
  const totalConversions = campaigns.reduce((acc, curr) => acc + (curr.conversion_count || 0), 0)
  const avgConversion = totalSent > 0 ? ((totalConversions / totalSent) * 100).toFixed(1) : "0.0"

  return (
    <div>
      <TopBar 
        title="Campaigns" 
        searchPlaceholder="Search by campaign name..."
        profile={profile}
      />

      <div className="p-6">
        {/* Action Row */}
        <div className="flex flex-col gap-4 sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 border border-primary/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
               <Bot className="h-4 w-4" />
            </div>
            <div>
               <p className="text-sm font-semibold text-foreground">AI Distributor Active</p>
               <p className="text-xs text-muted-foreground">Smart dispatching enabled for optimum booking rates</p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background pr-4 pl-9 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors">
               <Sparkles className="h-4 w-4 text-primary" />
               AI Rules
             </button>
             <button 
               onClick={() => setIsModalOpen(true)}
               className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
             >
               <Plus className="h-4 w-4" />
               New Campaign
             </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatsCard
            title="Messages Sent"
            value={totalSent.toLocaleString()}
            icon={Mail}
            trend={{ value: "Based on real data", positive: true }}
          />
          <StatsCard
            title="Avg. Conversion Rate"
            value={`${avgConversion}%`}
            icon={Wifi}
            trend={{ value: "Conversions / Total Sent", positive: true }}
          />
          <StatsCard
            title="Campaign Revenue"
            value={`$0`}
            icon={DollarSign}
            subtitle="Tracking starting soon"
          />
        </div>

        {/* Tabs */}
        {campaigns.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-1 overflow-x-auto border-b border-border font-medium">
            {(
              [
                { key: "all", label: "All Campaigns" },
                { key: "active", label: "Active" },
                { key: "draft", label: "Draft & Paused" },
                { key: "completed", label: "Completed" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "border-b-2 px-4 py-3 text-sm transition-all focus:outline-none",
                  activeTab === tab.key
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* List / Empty State */}
        {campaigns.length === 0 || filteredCampaigns.length === 0 ? (
          <div className="mt-8">
            <EmptyState 
              icon={MessageSquare}
              title={campaigns.length === 0 ? "No campaigns running" : "No results found"}
              description={campaigns.length === 0 
                ? "Start reaching out to your clients using our AI distributor. Create a campaign to see it here."
                : `We couldn't find any campaigns matching "${searchQuery}".`
              }
              action={campaigns.length === 0 && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Create First Campaign
                </button>
              )}
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    "Campaign Name",
                    "Status",
                    "AI Rules",
                    "Recipients",
                    "Conversion",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="transition-colors hover:bg-accent/30 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            "bg-primary/10 text-primary" // Default style
                          )}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {campaign.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.type || "Promotional"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
                          statusStyles[campaign.status?.toUpperCase()] || statusStyles.DRAFT
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {campaign.rules ? (
                         <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded w-fit capitalize">
                            <Sparkles className="h-3 w-3" />
                            {Object.keys(campaign.rules).length} Smart Rule(s)
                         </div>
                      ) : (
                         <span className="text-xs text-muted-foreground">Manual Dist.</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {campaign.sent_count?.toLocaleString() || "0"}
                    </td>
                    <td className="px-6 py-4">
                      {campaign.conversion_count !== null && campaign.conversion_count > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                             <span className="font-semibold text-foreground">
                               {((campaign.conversion_count / Math.max(1, campaign.sent_count)) * 100).toFixed(1)}%
                             </span>
                             <span className="text-muted-foreground">{campaign.conversion_count} bookings</span>
                          </div>
                          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.min(100, (campaign.conversion_count / Math.max(1, campaign.sent_count)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          No conversions yet
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleSendCampaign(campaign.id)}
                          disabled={sendingCampaignId === campaign.id}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          {sendingCampaignId === campaign.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3" />
                          )}
                          Send Now
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await updateCampaign(campaign.id, { status: "PAUSED" })
                                  toast.success("Campaign paused.")
                                  router.refresh()
                                } catch {
                                  toast.error("Failed to update campaign.")
                                }
                              }}
                            >
                              Pause
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await updateCampaign(campaign.id, { status: "ACTIVE" })
                                  toast.success("Campaign activated.")
                                  router.refresh()
                                } catch {
                                  toast.error("Failed to update campaign.")
                                }
                              }}
                            >
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={async () => {
                                if (!confirm("Delete this campaign?")) return
                                try {
                                  await deleteCampaign(campaign.id)
                                  toast.success("Campaign deleted.")
                                  router.refresh()
                                } catch {
                                  toast.error("Failed to delete campaign.")
                                }
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCampaigns.length === 0 && (
                   <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No campaigns found for the selected status.
                      </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">Create New AI Campaign</h3>
                {!showAiSuggestions && (
                  <button 
                    onClick={() => setShowAiSuggestions(true)}
                    className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary uppercase tracking-wider hover:bg-primary/20 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    Get Suggestions
                  </button>
                )}
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false)
                  setShowAiSuggestions(false)
                }}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {showAiSuggestions ? (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    onClick={() => setShowAiSuggestions(false)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    ← Back to manual
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a pre-optimized campaign template based on your business patterns:
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {aiSuggestions.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => applySuggestion(s)}
                      className="flex items-start gap-4 rounded-xl border border-border bg-accent/30 p-4 text-left hover:border-primary/50 hover:bg-accent transition-all group"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                           <h4 className="text-sm font-bold text-foreground">{s.name}</h4>
                           <span className="text-xs font-bold text-primary">%{s.discount} OFF</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 self-center" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-left-4 duration-300">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Campaign Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Summer Special SMS"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Discount Percentage (%)
                </label>
                <div className="relative">
                   <input
                     required
                     type="number"
                     min="0"
                     max="100"
                     placeholder="10"
                     value={formData.discount_value}
                     onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                     className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                   <p className="text-sm font-semibold text-foreground">AI Smart Rules Enabled</p>
                   <p className="text-xs text-muted-foreground">The AI will automatically determine the best time to send these messages.</p>
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
                      Creating...
                    </>
                  ) : (
                    "Launch Campaign"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )}
  </div>
)
}
