import { createClient } from "@/lib/supabase/server"
import { DashboardLayoutWrapper } from "@/components/dashboard/dashboard-layout-wrapper"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  let profile = null

  if (userData.user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userData.user.id)
      .single()
    profile = data
  }

  return <DashboardLayoutWrapper profile={profile}>{children}</DashboardLayoutWrapper>
}
