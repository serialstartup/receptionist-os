"use client"

import {
  Bell,
  Plus,
  Search,
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  Users,
  Megaphone,
  MessageSquare,
  Bot,
  BarChart3,
  ClipboardList as ClipboardListIcon,
  Scissors,
  Settings,
  LogOut,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getNotifications } from "@/app/(dashboard)/actions"

interface TopBarProps {
  title: string
  subtitle?: string
  searchPlaceholder?: string
  showNewBooking?: boolean
  profile?: any
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Appointments", href: "/appointments", icon: ClipboardListIcon },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Services", href: "/services", icon: Scissors },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "AI Settings", href: "/ai-settings", icon: Bot },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

export function TopBar({
  title,
  subtitle,
  searchPlaceholder = "Search bookings...",
  showNewBooking = false,
  profile,
}: TopBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; title: string; description: string; time: string; type: string }[]>([])
  const pathname = usePathname()

  useEffect(() => {
    getNotifications().then(setNotifications).catch(() => {})
  }, [])

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U"

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
        {/* Title & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="max-w-[150px] truncate text-base font-bold text-foreground md:max-w-none md:text-lg">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden text-sm text-muted-foreground md:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors focus:outline-none",
                isNotificationsOpen 
                  ? "bg-accent text-foreground ring-2 ring-primary/20" 
                  : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {notifications.length}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-72 origin-top-right rounded-xl border border-border bg-card p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in duration-150">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border mb-1">
                    <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No new notifications.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{n.title}</span>
                            <span className="text-[10px] text-muted-foreground">{n.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{n.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative ml-2 border-l border-border pl-2 md:ml-3 md:pl-3">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-offset-background transition-all hover:bg-primary/20 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
            >
              {initials}
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right animate-in rounded-xl border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 duration-150 fade-in zoom-in">
                  <div className="mb-1 border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {profile?.full_name || "User"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Manager
                    </p>
                  </div>

                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>

                  <button
                    onClick={async () => {
                      const { signOut } = await import("@/app/(auth)/actions")
                      await signOut()
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive transition-all hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="text-lg font-bold tracking-tight text-foreground">
              BeautyAI
            </span>
            <button
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
            <div className="my-4 border-t border-border pt-4">
              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium",
                  pathname.startsWith("/settings")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
