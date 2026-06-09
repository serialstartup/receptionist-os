import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // AI Monitoring: auto-enabled for OpenAI on Node server
  // sendDefaultPii: true above enables input/output capture
  streamGenAiSpans: true,

  includeLocalVariables: true,

  enableLogs: true,
})
