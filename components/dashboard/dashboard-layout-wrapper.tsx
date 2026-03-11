"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils"

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true)
    // Optional: read from localStorage here if desired
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState) {
       setIsCollapsed(JSON.parse(savedState))
    }
  }, [])

  const handleToggle = () => {
     const nextState = !isCollapsed
     setIsCollapsed(nextState)
     localStorage.setItem("sidebarCollapsed", JSON.stringify(nextState))
  }

  if (!mounted) {
      return (
         <div className="min-h-screen bg-background">
            <div className="hidden md:block">
              <Sidebar isCollapsed={false} onToggle={() => {}} />
            </div>
            <main className="md:pl-60 transition-all duration-300">
               {children}
            </main>
         </div>
      )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
      </div>
      <main className={cn("transition-all duration-300", isCollapsed ? "md:pl-[80px]" : "md:pl-60")}>
        {children}
      </main>
    </div>
  )
}
