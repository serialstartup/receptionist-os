"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// import { signOut } from "@/app/(auth)/actions"
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList as ClipboardListIcon,
  Users,
  Megaphone,
  Bot,
  BarChart3,
  Scissors,
  Sparkles,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Appointments", href: "/appointments", icon: ClipboardListIcon },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Services", href: "/services", icon: Scissors },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Integrations", href: "/integrations", icon: Sparkles },
  { name: "AI Settings", href: "/ai-settings", icon: Bot },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Help Center", href: "/help", icon: HelpCircle },
]

// const bottomNavigation = [
//   { name: "Settings", href: "/settings", icon: Settings },
// ]

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  profile?: any
}

export function Sidebar({
  isCollapsed = false,
  onToggle,
  profile,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-60"
      )}
    >
      {/* Header / Logo */}
      <div
        className={cn(
          "flex h-16 items-center px-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5 overflow-hidden",
            isCollapsed && "hidden"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight whitespace-nowrap text-foreground">
            BeautyAI
          </span>
        </div>

        {/* Only show logo when collapsed */}
        {isCollapsed && (
          <div className="mt-6 mb-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
        )}

        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "absolute top-6 right-[-14px] z-50 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-md transition-all hover:bg-accent hover:text-foreground",
              isCollapsed ? "shadow-primary/10" : "shadow-sm"
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="hide-scrollbar flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto px-3 pt-6">
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
                isCollapsed ? "justify-center gap-0 px-0" : "gap-3 px-3"
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
      {/* <div className="border-t border-sidebar-border px-3 py-3">
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
                isCollapsed ? "justify-center gap-0 px-0" : "gap-3 px-3"
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
      </div> */}
    </aside>
  )
}
