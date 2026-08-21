import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const defaultAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const crmTools: FunctionDeclaration[] = [
  {
    name: "create_customer",
    description: "Create a new customer or lead in the CRM",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Full name of the customer" },
        company: { type: Type.STRING, description: "Company name" },
        email: { type: Type.STRING, description: "Email address" },
        phone: { type: Type.STRING, description: "Phone number" },
        status: { type: Type.STRING, enum: ["Active", "Lead", "Inactive"] }
      },
      required: ["name", "email", "status"]
    }
  },
  {
    name: "create_invoice",
    description: "Create a new billing invoice",
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: "ID of the customer" },
        customerName: { type: Type.STRING, description: "Name of the customer" },
        amount: { type: Type.NUMBER, description: "Invoice amount" },
        status: { type: Type.STRING, enum: ["Paid", "Pending", "Overdue"] }
      },
      required: ["customerId", "customerName", "amount", "status"]
    }
  },
  {
    name: "send_outreach",
    description: "Send an outreach message (Email or WhatsApp) to a customer",
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING },
        customerName: { type: Type.STRING },
        platform: { type: Type.STRING, enum: ["Email", "WhatsApp"] },
        message: { type: Type.STRING },
        subject: { type: Type.STRING, description: "Required for Email" }
      },
      required: ["customerId", "platform", "message"]
    }
  },
  {
    name: "import_customers",
    description: "Import a list of multiple customers at once",
    parameters: {
      type: Type.OBJECT,
      properties: {
        customers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              company: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["Active", "Lead", "Inactive"] }
            },
            required: ["name", "email", "status"]
          }
        }
      },
      required: ["customers"]
    }
  },
  {
    name: "create_quote",
    description: "Create a new price quote for a customer",
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING },
        customerName: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        expiryDate: { type: Type.STRING, description: "ISO date string" },
        status: { type: Type.STRING, enum: ["Accepted", "Pending", "Expired"] }
      },
      required: ["customerId", "customerName", "amount", "expiryDate", "status"]
    }
  },
  {
    name: "create_product",
    description: "Add a new product to the catalog",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        price: { type: Type.NUMBER },
        category: { type: Type.STRING },
        stockLevel: { type: Type.NUMBER },
        description: { type: Type.STRING }
      },
      required: ["name", "price", "category", "stockLevel"]
    }
  },
  {
    name: "record_payment",
    description: "Record a payment for an invoice",
    parameters: {
      type: Type.OBJECT,
      properties: {
        invoiceId: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        method: { type: Type.STRING, enum: ["Credit Card", "Bank Transfer", "PayPal", "Cash"] },
        status: { type: Type.STRING, enum: ["Completed", "Processing", "Failed"] }
      },
      required: ["invoiceId", "amount", "method", "status"]
    }
  },
  {
    name: "update_record",
    description: "Update an existing record (customer, invoice, quote, or product)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        collection: { type: Type.STRING, enum: ["customers", "invoices", "quotes", "products"] },
        id: { type: Type.STRING, description: "The document ID to update" },
        updates: { 
          type: Type.OBJECT, 
          description: "The fields to update and their new values" 
        }
      },
      required: ["collection", "id", "updates"]
    }
  },
  {
    name: "delete_record",
    description: "Delete a record from the CRM",
    parameters: {
      type: Type.OBJECT,
      properties: {
        collection: { type: Type.STRING, enum: ["customers", "invoices", "quotes", "products"] },
        id: { type: Type.STRING }
      },
      required: ["collection", "id"]
    }
  },
  {
    name: "update_settings",
    description: "Update application settings (language, currency, etc.)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        language: { type: Type.STRING, enum: ["en", "no"] },
        currency: { type: Type.STRING },
        companyName: { type: Type.STRING },
        vatRate: { type: Type.NUMBER }
      }
    }
  },
  {
    name: "generate_report_summary",
    description: "Generate a summary report for a specific category",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, enum: ["Sales", "Customers", "Invoices", "Quotes"] },
        timeframe: { type: Type.STRING, enum: ["Last 7 Days", "Last 30 Days", "This Month", "All Time"] }
      },
      required: ["category", "timeframe"]
    }
  },
  {
    name: "send_email",
    description: "Sends a professional business email to a client or team member via the Aiappsy SMTP server.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING, description: "The recipient's email address." },
        subject: { type: Type.STRING, description: "A clear, professional subject line." },
        body: { type: Type.STRING, description: "The main content of the email. Supports plain text." }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "create_stripe_payment",
    description: "Generates a secure Stripe Checkout URL for an invoice. This allows the client to pay via Credit Card.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        invoiceNumber: { type: Type.STRING, description: "The unique reference number for the invoice (e.g., INV-001)." },
        amount: { type: Type.NUMBER, description: "The total amount to be paid (e.g., 500.00)." },
        currency: { type: Type.STRING, description: "The 3-letter ISO currency code (e.g., USD, EUR)." },
        customerName: { type: Type.STRING, description: "The name of the client who will receive the invoice." }
      },
      required: ["invoiceNumber", "amount", "customerName"]
    }
  },
  {
    name: "create_paypal_order",
    description: "Creates a PayPal payment order for a client. Use this as an alternative to Stripe.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: "The amount to bill the client." },
        currency: { type: Type.STRING, description: "The currency code (default: USD)." }
      },
      required: ["amount"]
    }
  },
  {
    name: "get_business_health_summary",
    description: "Simulates a search of the CRM database to provide a summary of total revenue and overdue tasks. Use this before giving high-level executive briefings.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        timeframe: { type: Type.STRING, description: "The period to analyze (e.g., 'this_month', 'last_quarter')." }
      }
    }
  },
  {
    name: "scrape_google_maps",
    description: "Search Google Maps for local business listings by niche and location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "The type of business/niche to find (e.g., 'Dentists', 'Lawyers')." },
        location: { type: Type.STRING, description: "The city or area to search in (e.g., 'Oslo', 'New York')." }
      },
      required: ["query", "location"]
    }
  },
  {
    name: "extract_emails_from_websites",
    description: "Crawl a list of business websites to find public email addresses.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        websites: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of website URLs to scan."
        }
      },
      required: ["websites"]
    }
  },
  {
    name: "import_leads_to_crm",
    description: "Import a list of scraped local business leads into the CRM contacts database.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        leads: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING, description: "Business name" },
              name: { type: Type.STRING, description: "Name (defaults to Office/Owner)" },
              email: { type: Type.STRING, description: "Public email address found" },
              phone: { type: Type.STRING, description: "Business phone number" },
              address: { type: Type.STRING, description: "Physical address" },
              rating: { type: Type.NUMBER, description: "Google rating (1-5)" }
            },
            required: ["company", "name", "email"]
          }
        }
      },
      required: ["leads"]
    }
  }
];

export async function callManagedAi(options: {
  prompt: string;
  systemInstruction?: string;
  responseSchema?: any;
  responseMimeType?: string;
}) {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to call managed AI");
  }

  return await response.json();
}

export async function getSmartInsights(data: any, customApiKey?: string, model?: string) {
  const ai = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : defaultAi;
  
  try {
    const response = await ai.models.generateContent({
      model: model || "gemini-3-flash-preview",
      contents: `
        You are an expert business analyst for Aiappsy CRM. 
        Analyze the following business data and provide 3-4 concise, actionable insights or recommendations.
        
        Data: ${JSON.stringify(data)}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { 
                type: Type.STRING,
                enum: ["positive", "warning", "info"]
              },
              action: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Button label, e.g., 'Send Reminder'" },
                  prompt: { type: Type.STRING, description: "The prompt to send to the AI Assistant, e.g., 'Send a WhatsApp reminder to John about invoice INV-123'" }
                },
                required: ["label", "prompt"]
              }
            },
            required: ["title", "description", "type"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    
    return [];
  } catch (error: any) {
    console.error("Error getting smart insights:", error);
    
    const isLeaked = error?.message?.includes("leaked") || JSON.stringify(error).includes("leaked");
    
    return [
      {
        title: isLeaked ? "API Key Issue" : "AI Insights Unavailable",
        description: isLeaked 
          ? "The default API key has been flagged. Please provide your own Gemini API key in Settings to continue using AI features."
          : "We couldn't generate insights at this moment. Please try again later.",
        type: isLeaked ? "warning" : "info",
        action: isLeaked ? {
          label: "Go to Settings",
          prompt: "Open settings page"
        } : undefined
      }
    ];
  }
}

export async function draftOutreach(options: {
  customerName: string;
  customerContext?: string;
  platform: "Email" | "WhatsApp";
  purpose: string;
  customApiKey?: string;
  model?: string;
}) {
  const ai = options.customApiKey ? new GoogleGenAI({ apiKey: options.customApiKey }) : defaultAi;
  
  try {
    const response = await ai.models.generateContent({
      model: options.model || "gemini-2.0-flash",
      contents: `
        Draft a professional ${options.platform} outreach message for ${options.customerName}.
        Purpose: ${options.purpose}
        Context: ${options.customerContext || "No additional context provided."}
        
        If it's an Email, provide a Subject line and a Body.
        If it's WhatsApp, provide only the message body.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            message: { type: Type.STRING }
          },
          required: ["message"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Error drafting outreach:", error);
    throw error;
  }
}
