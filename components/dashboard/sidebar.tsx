"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut } from "@/app/(auth)/actions"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Megaphone,
  MessageSquare,
  Bot,
  BarChart3,
  Scissors,
  Settings,
  Sparkles,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Services", href: "/services", icon: Scissors },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "AI Settings", href: "/ai-settings", icon: Bot },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Help Center", href: "/help", icon: HelpCircle },
]

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-60"
      )}
    >
      {/* Header / Logo */}
      <div className={cn("flex h-16 items-center px-4", isCollapsed ? "justify-center" : "justify-between")}>
        <div className={cn("flex items-center gap-2.5 overflow-hidden", isCollapsed && "hidden")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground whitespace-nowrap">
            BeautyAI
          </span>
        </div>
        
        {/* Only show logo when collapsed */}
        {isCollapsed && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4 mt-6">
            <Sparkles className="h-4 w-4" />
          </div>
        )}

        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
               "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all absolute right-[-14px] top-6 bg-background border border-border shadow-md z-50",
               isCollapsed ? "shadow-primary/10" : "shadow-sm"
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 pt-6 overflow-y-auto hide-scrollbar overflow-x-hidden">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                isCollapsed ? "justify-center px-0 gap-0" : "px-3 gap-3"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive ? "text-primary" : ""
                )}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border px-3 py-3">
        {bottomNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
             <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                   "flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-150",
                   isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                   isCollapsed ? "justify-center px-0 gap-0" : "px-3 gap-3"
                )}
             >
                <item.icon
                   className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-primary" : ""
                   )}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
             </Link>
          )
        })}
      </div>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between gap-3 min-w-0 w-full")}>
           {/* Avatar */}
           <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary", isCollapsed && "hidden")}>
             SJ
           </div>

           {!isCollapsed && (
              <div className="min-w-0 flex-1">
                 <p className="truncate text-sm font-medium text-foreground">
                   Sarah Jenkins
                 </p>
                 <p className="truncate text-xs text-muted-foreground">
                   Salon Manager
                 </p>
              </div>
           )}

          <button
            onClick={async () => {
              await signOut()
            }}
            className={cn("flex items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors", isCollapsed ? "h-10 w-10 bg-sidebar-accent/30" : "h-8 w-8")}
            title="Log out"
          >
            <LogOut className={cn(isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
          </button>
        </div>
      </div>
    </aside>
  )
}
