"use client"

import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import {
  Bot,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { useState } from "react"

type PersonalityTone = "friendly" | "professional" | "luxury" | "energetic"

const toneOptions: {
  key: PersonalityTone
  label: string
  description: string
}[] = [
  {
    key: "friendly",
    label: "Friendly & Casual",
    description: "Warm, approachable tone for a relaxed salon atmosphere",
  },
  {
    key: "professional",
    label: "Professional",
    description: "Polished and formal for an upscale experience",
  },
  {
    key: "luxury",
    label: "Luxury",
    description: "Elegant and exclusive for high-end clientele",
  },
  {
    key: "energetic",
    label: "Energetic",
    description: "Upbeat and enthusiastic for a lively salon vibe",
  },
]

const automationRules = [
  {
    key: "auto-confirm",
    label: "Auto-confirm bookings",
    description: "AI will confirm appointments without manual review",
    enabled: true,
  },
  {
    key: "smart-reschedule",
    label: "Smart rescheduling",
    description: "AI suggests alternative times when cancelling",
    enabled: true,
  },
  {
    key: "follow-up",
    label: "Post-visit follow-ups",
    description: "Automatically send thank you messages after appointments",
    enabled: false,
  },
  {
    key: "upsell",
    label: "Service upselling",
    description: "AI recommends additional services based on customer history",
    enabled: false,
  },
]

const knowledgeFiles = [
  { name: "Salon_Brochure_2024.pdf", size: "2.4 MB", date: "Oct 12, 2024" },
  { name: "Product_List.xlsx", size: "540 KB", date: "Sep 28, 2024" },
]

export default function AdvancedAISettingsPage() {
  const [selectedTone, setSelectedTone] = useState<PersonalityTone>("friendly")
  const [rules, setRules] = useState(automationRules)

  const toggleRule = (key: string) => {
    setRules((prev) =>
      prev.map((r) => (r.key === key ? { ...r, enabled: !r.enabled } : r))
    )
  }

  return (
    <div>
      <TopBar title="Advanced AI Settings" />

      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground">
          Advanced AI Configuration
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fine-tune your AI assistant&apos;s behavior, knowledge base, and
          automation rules.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Personality & Tone */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Personality & Tone
                </h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how your AI communicates with customers
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {toneOptions.map((tone) => (
                  <button
                    key={tone.key}
                    onClick={() => setSelectedTone(tone.key)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-all",
                      selectedTone === tone.key
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {tone.label}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tone.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground">
                Custom Instructions
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add specific rules and guidelines for the AI to follow
              </p>
              <textarea
                placeholder="Example: Always greet customers by name. Never suggest services under $50. If a customer asks about pricing for a service not in our list, politely redirect them to call us directly..."
                className="mt-4 h-40 w-full resize-y rounded-lg border border-border bg-background p-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  0 / 2000 characters
                </p>
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  Save Instructions
                </button>
              </div>
            </div>

            {/* Knowledge Base */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground">
                Knowledge Base
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload documents to help the AI answer questions about your
                business
              </p>

              {/* Upload Area */}
              <div className="mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/30">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Drop files here or click to upload
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, DOCX, TXT, CSV up to 10MB
                </p>
              </div>

              {/* File List */}
              <div className="mt-4 space-y-2">
                {knowledgeFiles.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {file.size} • Uploaded {file.date}
                        </p>
                      </div>
                    </div>
                    <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Automation Rules */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-bold text-foreground">
                Automation Rules
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Control what your AI can do automatically
              </p>

              <div className="mt-4 space-y-4">
                {rules.map((rule) => (
                  <div key={rule.key} className="flex items-start gap-3">
                    <button
                      onClick={() => toggleRule(rule.key)}
                      className={cn(
                        "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
                        rule.enabled ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                          rule.enabled ? "right-0.5" : "left-0.5"
                        )}
                      />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {rule.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Training Status */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-bold text-foreground">
                Training Status
              </h3>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm text-foreground">
                    Base model trained
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm text-foreground">
                    Service catalog synced
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm text-foreground">
                    Knowledge base pending
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Overall readiness
                  </span>
                  <span className="font-semibold text-foreground">75%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[75%] rounded-full bg-primary" />
                </div>
              </div>

              <button className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Retrain AI Model
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
