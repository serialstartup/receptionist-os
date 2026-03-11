"use client"

import { useState } from "react"
import Link from "next/link"
import { signUp } from "../actions"
import {
  Eye,
  EyeOff,
  User,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  CalendarCheck,
  Users,
  Headphones,
  Sparkles,
  Quote,
} from "lucide-react"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full max-w-5xl gap-0">
      {/* Left — Form */}
      <div className="flex-1 px-4 py-8 lg:px-12 lg:py-12">
        <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          Join the future
        </h2>
        <p className="mt-3 text-muted-foreground">
          Join thousands of beauty professionals using AI to grow their business
          effortlessly.
        </p>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Jane Doe"
                className="block w-full rounded-lg border border-border bg-input py-3 pr-4 pl-10 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="businessName"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Business Name
            </label>
            <div className="relative">
              <Building2 className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                placeholder="Glow Studio"
                className="block w-full rounded-lg border border-border bg-input py-3 pr-4 pl-10 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="jane@example.com"
                className="block w-full rounded-lg border border-border bg-input py-3 pr-4 pl-10 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Create Password
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-border bg-input py-3 pr-10 pl-10 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Must be at least 8 characters with a mix of letters and numbers.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          By signing up, you agree to our{" "}
          <a
            href="#"
            className="font-semibold text-primary hover:text-primary/80"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="font-semibold text-primary hover:text-primary/80"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>

      {/* Right — Social Proof */}
      <div className="hidden flex-1 rounded-2xl bg-accent/50 p-8 lg:block lg:p-10">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>

        <h3 className="text-2xl font-bold text-foreground">
          Trusted by 10k+ Studios
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Our AI-driven platform helps beauty entrepreneurs save over 15 hours a
          week on administrative tasks.
        </p>

        {/* Features */}
        <div className="mt-8 space-y-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarCheck className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Smart Scheduling
              </p>
              <p className="text-xs text-muted-foreground">
                AI that learns your workflow and optimizes your calendar
                automatically.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Client Insights
              </p>
              <p className="text-xs text-muted-foreground">
                Personalized recommendations for every client based on history
                and preferences.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Headphones className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Instant Support
              </p>
              <p className="text-xs text-muted-foreground">
                24/7 AI receptionist to handle bookings and common inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <div className="relative">
            <Quote className="absolute -top-1 right-0 h-8 w-8 text-primary/15" />
            <p className="text-sm leading-relaxed text-muted-foreground italic">
              &quot;BeautyAI changed my business. I can finally focus on my
              clients instead of my spreadsheet.&quot;
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              SM
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Sarah Miller
              </p>
              <p className="text-xs text-muted-foreground">
                Founder, Glow Aesthetic
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
