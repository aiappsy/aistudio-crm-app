import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/ai/generate", async (req, res) => {
    const { prompt, systemInstruction, responseSchema, responseMimeType } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: responseMimeType || "text/plain",
          responseSchema: responseSchema
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    const { message, history, systemInstruction, tools } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = genAI.chats.create({
        model: "gemini-2.0-flash",
        history: history || [],
        config: {
          systemInstruction: systemInstruction,
          tools: tools ? [{ functionDeclarations: tools }, { googleSearch: {} }] : [{ googleSearch: {} }]
        }
      });

      const result = await chat.sendMessage({ message });
      
      res.json({ text: result.text, functionCalls: result.functionCalls });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to chat with AI" });
    }
  });

  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    const { 
      invoiceId, 
      invoiceNumber, 
      amount, 
      currency = "usd", 
      customerName, 
      stripeSecretKey,
      successUrl,
      cancelUrl
    } = req.body;

    const secretKey = stripeSecretKey || process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return res.status(400).json({ error: "Stripe Secret Key is not configured." });
    }

    try {
      const stripe = new Stripe(secretKey);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Invoice ${invoiceNumber}`,
                description: `Payment for invoice ${invoiceNumber} - ${customerName}`,
              },
              unit_amount: Math.round(amount * 100), // Stripe expects cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          invoiceId,
          invoiceNumber,
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // SMTP Email Route
  app.post("/api/send-email", async (req, res) => {
    const { host, port, user, pass, to, subject, body } = req.body;

    if (!host || !port || !user || !pass || !to || !subject || !body) {
      return res.status(400).json({ error: "Missing required fields for sending email." });
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: port == 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from: user, 
        to, 
        subject, 
        text: body, 
      });

      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error("Nodemailer error:", error);
      res.status(500).json({ error: error.message || "Failed to send email." });
    }
  });

  // PayPal Routes
  app.post("/api/paypal/create-order", async (req, res) => {
    const { amount, currency = "USD", clientId, secretKey } = req.body;
    
    if (!clientId || !secretKey) {
      return res.status(400).json({ error: "PayPal credentials not configured." });
    }

    try {
      const auth = Buffer.from(`${clientId}:${secretKey}`).toString("base64");
      
      // Get Access Token
      const tokenResponse = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      
      const tokenData = await tokenResponse.json() as any;
      if (!tokenResponse.ok) throw new Error(tokenData.error_description || "Failed to get PayPal token");
      
      const accessToken = tokenData.access_token;
      
      // Create Order
      const orderResponse = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toString(),
            }
          }]
        }),
      });
      
      const orderData = await orderResponse.json() as any;
      if (!orderResponse.ok) throw new Error(orderData.message || "Failed to create order");
      
      res.json({ id: orderData.id });
    } catch (error: any) {
      console.error("PayPal Create Order Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/paypal/capture-order", async (req, res) => {
    const { orderID, clientId, secretKey } = req.body;
    
    if (!clientId || !secretKey) {
      return res.status(400).json({ error: "PayPal credentials not configured." });
    }

    try {
      const auth = Buffer.from(`${clientId}:${secretKey}`).toString("base64");
      
      const tokenResponse = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      
      const tokenData = await tokenResponse.json() as any;
      if (!tokenResponse.ok) throw new Error(tokenData.error_description || "Failed to get PayPal token");
      
      const accessToken = tokenData.access_token;
      
      // Capture Order
      const captureResponse = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      
      const captureData = await captureResponse.json() as any;
      if (!captureResponse.ok) throw new Error(captureData.message || "Failed to capture order");
      
      res.json({ success: true, captureData });
    } catch (error: any) {
      console.error("PayPal Capture Order Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
