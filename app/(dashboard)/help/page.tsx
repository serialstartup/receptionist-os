import { TopBar } from "@/components/dashboard/top-bar"
import { HelpCircle, Mail, MessageCircle, Phone, FileText, ExternalLink, ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "How does the AI receptionist handle conflicting appointments?",
    answer: "BeautyAI uses real-time calendar syncing. Before confirming any appointment, it checks your synced calendar for existing blocks and only offers available slots, completely eliminating double-booking."
  },
  {
    question: "Can I customize what the AI says to my clients?",
    answer: "Yes. In the AI Settings page, you can provide a custom business bio, choose the AI's tone (e.g., Luxury, Friendly), and set specific rules for how it interacts with clients."
  },
  {
    question: "Which languages does the AI currently support?",
    answer: "The AI natively supports over 10 languages including English, Spanish, Turkish, German, and French. It automatically detects the language your customer is using and replies in that same language."
  },
  {
    question: "How do I connect my existing scheduling software?",
    answer: "Go to the Settings page and select 'Integrations'. From there, you can link popular platforms like Google Calendar, Apple Calendar, and select salon management tools."
  },
  {
    question: "Is there a limit to how many messages the AI can send?",
    answer: "Your monthly limit depends on your pricing tier. The Base plan includes 1,000 AI interactions per month. You can upgrade your plan or purchase add-on bundles if you need more capacity."
  }
]

export default function HelpCenterPage() {
  return (
    <div>
      <TopBar title="Help Center" subtitle="Find answers and get support for BeautyAI." />

      <div className="p-6 mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {/* Main FAQ Content */}
          <div className="lg:col-span-1 xl:col-span-2 space-y-6">
             <div className="rounded-xl border border-border bg-card p-6">
               <div className="flex items-center gap-2 mb-6">
                 <HelpCircle className="h-6 w-6 text-primary" />
                 <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
               </div>
               
               <div className="space-y-4">
                 {faqs.map((faq, i) => (
                   <details key={i} className="group border border-border rounded-lg bg-accent/30 [&_summary::-webkit-details-marker]:hidden">
                     <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-foreground">
                       {faq.question}
                       <span className="transition group-open:-rotate-180">
                         <ChevronDown className="h-4 w-4 text-muted-foreground" />
                       </span>
                     </summary>
                     <div className="p-4 pt-0 text-sm leading-relaxed text-muted-foreground border-t border-border/50">
                       {faq.answer}
                     </div>
                   </details>
                 ))}
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a href="#" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all group">
                   <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                   </div>
                   <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Documentation</h3>
                      <p className="text-xs text-muted-foreground">Read our detailed guides</p>
                   </div>
                   <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a href="#" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all group">
                   <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MessageCircle className="h-5 w-5" />
                   </div>
                   <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Community Forum</h3>
                      <p className="text-xs text-muted-foreground">Join other salon owners</p>
                   </div>
                   <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
             </div>
          </div>

          {/* Contact Support */}
          <div className="space-y-6">
             <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
               <h2 className="text-xl font-bold text-foreground mb-4">Contact Support</h2>
               <p className="text-sm text-muted-foreground mb-8">
                 Can't find what you're looking for? Our support team is here to help you get the most out of BeautyAI.
               </p>

               <form className="space-y-5">
                 <div>
                   <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
                   <select className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                     <option>Technical Issue</option>
                     <option>Billing Question</option>
                     <option>Feature Request</option>
                     <option>Other</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                   <textarea 
                     rows={5}
                     placeholder="Describe your issue in detail..."
                     className="w-full resize-y rounded-lg border border-border bg-background p-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                   />
                 </div>
                 <button type="button" className="w-full rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                   Send Message
                 </button>
               </form>
             </div>

             <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-bold text-foreground mb-4">Other ways to reach us</h3>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-foreground">
                         <Mail className="h-4 w-4" />
                      </div>
                      <div>
                         <p className="text-xs text-muted-foreground">Email Support</p>
                         <p className="text-sm font-medium text-foreground">support@beautyai.com</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-foreground">
                         <Phone className="h-4 w-4" />
                      </div>
                      <div>
                         <p className="text-xs text-muted-foreground">Phone (Pro Plan)</p>
                         <p className="text-sm font-medium text-foreground">+1 (800) 123-4567</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}
