import type { ChatCompletionTool } from "openai/resources/index.mjs"

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getServices",
      description:
        "Get a list of all services offered by the salon with their IDs, duration, and prices. Useful when the user asks about pricing or what services are provided.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAvailableSlots",
      description:
        "Find available appointment time slots for a specific service on a specific date.",
      parameters: {
        type: "object",
        properties: {
          service_id: {
            type: "string",
            description: "The ID of the requested service",
          },
          date: {
            type: "string",
            description:
              "The date to check availability in YYYY-MM-DD format (e.g., 2024-06-15)",
          },
        },
        required: ["service_id", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createAppointment",
      description: "Book an appointment for the customer.",
      parameters: {
        type: "object",
        properties: {
          service_id: {
            type: "string",
            description: "The ID of the service to book",
          },
          date: {
            type: "string",
            description: "The date of the appointment (YYYY-MM-DD)",
          },
          time: {
            type: "string",
            description:
              "The start time of the appointment (HH:mm, 24-hour format)",
          },
          customer_name: {
            type: "string",
            description: "The name of the customer",
          },
          customer_phone: {
            type: "string",
            description: "The phone number of the customer",
          },
        },
        required: [
          "service_id",
          "date",
          "time",
          "customer_name",
          "customer_phone",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancelAppointment",
      description: "Cancel an existing appointment for the customer.",
      parameters: {
        type: "object",
        properties: {
          customer_phone: {
            type: "string",
            description: "Customer's phone number to find their appointments",
          },
        },
        required: ["customer_phone"],
      },
    },
  },
]
