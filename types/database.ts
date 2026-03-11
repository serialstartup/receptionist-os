// BeautyAI — Database TypeScript Types

export type Business = {
  id: string
  name: string
  phone: string | null
  email: string | null
  website: string | null
  location: string | null
  logo_url: string | null
  timezone: string
  working_hours_start: string // "09:00"
  working_hours_end: string // "18:00"
  working_days: number[] // [1,2,3,4,5,6] — 0=Sun, 6=Sat
  created_at: string
}

export type User = {
  id: string
  business_id: string
  full_name: string | null
  avatar_url: string | null
  role: "admin" | "staff" | "viewer"
  created_at: string
}

export type Staff = {
  id: string
  business_id: string
  name: string
  role: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export type Service = {
  id: string
  business_id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  duration_minutes: number
  is_active: boolean
  created_at: string
}

export type Customer = {
  id: string
  business_id: string
  name: string | null
  phone: string | null
  email: string | null
  age: number | null
  notes: string | null
  tags: string[]
  visit_count: number
  last_visit_at: string | null
  created_at: string
}

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no-show"

export type AppointmentSource =
  | "whatsapp"
  | "instagram"
  | "dashboard"
  | "website"

export type Appointment = {
  id: string
  business_id: string
  customer_id: string | null
  service_id: string | null
  staff_id: string | null
  start_time: string
  end_time: string
  status: AppointmentStatus
  source: AppointmentSource | null
  notes: string | null
  created_at: string
}

export type MessageRole = "user" | "assistant" | "agent"
export type MessageChannel = "whatsapp" | "instagram"

export type Message = {
  id: string
  business_id: string
  customer_id: string | null
  channel: MessageChannel | null
  role: MessageRole
  content: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type CampaignStatus = "draft" | "active" | "scheduled" | "completed"

export type Campaign = {
  id: string
  business_id: string
  name: string | null
  message: string | null
  channel: string
  status: CampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
}

export type CampaignRecipientStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"

export type CampaignRecipient = {
  id: string
  campaign_id: string
  customer_id: string
  status: CampaignRecipientStatus
  sent_at: string | null
}

// Joined types for common queries
export type AppointmentWithDetails = Appointment & {
  customer: Customer | null
  service: Service | null
  staff: Staff | null
}

export type MessageWithCustomer = Message & {
  customer: Customer | null
}

export type CampaignWithRecipients = Campaign & {
  recipients: CampaignRecipient[]
}
