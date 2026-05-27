import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import * as admin from "firebase-admin";
import multer from "multer";
import * as pdfParseLib from "pdf-parse";
const pdfParse = (pdfParseLib as any).default || pdfParseLib;
import * as googleTTS from "google-tts-api";
import * as cheerio from "cheerio";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin globally
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? undefined 
  : undefined; 

try {
  admin.initializeApp({
    storageBucket: "bizmaster-abfed.firebasestorage.app"
  });
} catch (error) {
  console.log("Firebase Admin already initialized or failed to initialize:", error);
}

const upload = multer({ storage: multer.memoryStorage() });

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
      successUrl,
      cancelUrl
    } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header." });
    }

    try {
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Fetch settings from Firestore
      const settingsDocRef = admin.firestore().collection("settings").doc(uid);
      const settingsDoc = await settingsDocRef.get();
      
      const settingsData = settingsDoc.data();
      const secretKey = settingsData?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

      if (!secretKey) {
        return res.status(400).json({ error: "Stripe Secret Key is not configured." });
      }

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

  // Notebook APIs
  app.post("/api/notebook/upload", upload.single("file"), async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).send("Unauthorized");
    
    try {
      const idToken = authHeader.split("Bearer ")[1];
      const decodedUser = await admin.auth().verifyIdToken(idToken); // verify user
      
      const { contactId, url, text, title } = req.body;
      const isContactWorkspace = !!contactId;
      const basePath = isContactWorkspace ? `contacts/${contactId}` : `users/${decodedUser.uid}`;
      
      let extractedText = "";
      let sourceName = "";
      
      if (req.file) {
        sourceName = req.file.originalname;
        if (req.file.mimetype === "application/pdf") {
            const data = await pdfParse(req.file.buffer);
            extractedText = data.text;
        } else {
            extractedText = req.file.buffer.toString("utf-8");
        }
      } else if (url) {
        sourceName = url;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch URL");
        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style, nav, footer, iframe, img').remove();
        extractedText = $('body').text().replace(/\s+/g, ' ').trim();
        if (!extractedText) extractedText = html.substring(0, 10000); // fallback
      } else if (text) {
        sourceName = title || "Pasted Text";
        extractedText = text;
      } else {
        return res.status(400).send("Missing file, url, or text");
      }
      
      // Save all sources as parsed text to avoid complexity with original files for signed urls
      // Still keep a copy in storage as text/plain.
      const safeSourceName = sourceName.substring(0, 50).replace(/[^a-zA-Z0-9\-]/g, '_');
      const fileName = `${Date.now()}_${safeSourceName}.txt`;
      const filePath = `${basePath}/notebook_sources/${fileName}`;
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      await file.save(extractedText, {
          metadata: { contentType: "text/plain" }
      });
      
      let downloadUrl = "";
      try {
          const [signedUrl] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 1000 * 60 * 60 * 24 * 365 // 1 year
          });
          downloadUrl = signedUrl;
      } catch (err) {
          downloadUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      }
      
      const data = {
          name: sourceName,
          storagePath: filePath,
          downloadUrl,
          extractedText,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "ready"
      };
      const docRef = await admin.firestore().collection(`${basePath}/notebook_sources`).add(data);
      
      res.json({ id: docRef.id, ...data });
    } catch (error: any) {
       console.error("Upload error:", error);
       res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notebook/chat", async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).send("Unauthorized");
      
      try {
        const idToken = authHeader.split("Bearer ")[1];
        const decodedUser = await admin.auth().verifyIdToken(idToken);
        
        const { contactId, message, geminiApiKey, language } = req.body;
        const apiKeyToUse = geminiApiKey && typeof geminiApiKey === "string" && geminiApiKey.trim().length > 10 ? geminiApiKey.trim() : process.env.GEMINI_API_KEY;
        const basePath = contactId ? `contacts/${contactId}` : `users/${decodedUser.uid}`;
        
        const sourcesSnap = await admin.firestore().collection(`${basePath}/notebook_sources`).where("status", "==", "ready").get();
        let contextStr = "";
        sourcesSnap.forEach(doc => {
           const d = doc.data();
           contextStr += `\n\n--- SOURCE: ${d.name} ---\n${d.extractedText}`;
        });
        
        if (!apiKeyToUse) {
           return res.status(500).json({ error: "No API key configured for Gemini." });
        }
        const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
        const prompt = `You are an expert sales analyst assisting with this context. Answer the user's query using only the provided context. Cite the specific source files when you reference them. The user's language preference is ${language} (${language === 'no' ? 'Norwegian' : language === 'sv' ? 'Swedish' : language === 'da' ? 'Danish' : 'English'}). You MUST reply in this language.\nContext:\n${contextStr}\n\nUser Query:\n${message}`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        
        res.json({ text: response.text });
      } catch (error: any) {
        console.error("Notebook chat error:", error);
        res.status(500).json({ error: error.message });
      }
  });

  app.post("/api/notebook/generate-audio-overview", async (req, res) => {
     const authHeader = req.headers.authorization;
     if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).send("Unauthorized");
     
     try {
       const idToken = authHeader.split("Bearer ")[1];
       const decodedUser = await admin.auth().verifyIdToken(idToken);
       
       const { contactId, geminiApiKey, language } = req.body;
       const apiKeyToUse = geminiApiKey && typeof geminiApiKey === "string" && geminiApiKey.trim().length > 10 ? geminiApiKey.trim() : process.env.GEMINI_API_KEY;
       const basePath = contactId ? `contacts/${contactId}` : `users/${decodedUser.uid}`;
       
       const sourcesSnap = await admin.firestore().collection(`${basePath}/notebook_sources`).where("status", "==", "ready").get();
       let contextStr = "";
       sourcesSnap.forEach(doc => {
          const d = doc.data();
          contextStr += `\n\n--- SOURCE: ${d.name} ---\n${d.extractedText}`;
       });
       
       if (!apiKeyToUse) {
           return res.status(500).json({ error: "No API key configured for Gemini." });
       }
       const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
       const response = await ai.models.generateContent({
           model: "gemini-2.5-flash",
           contents: `Based on the following context, write a natural, 2-host conversational dialogue script summarizing this information (Host 1: John, Host 2: Sarah). Provide output strictly as a JSON array of objects with 'speaker' (either "John" or "Sarah") and 'text'. Maximum 6 lines of dialogue total. The audio must be in ${language === 'no' ? 'Norwegian' : language === 'sv' ? 'Swedish' : language === 'da' ? 'Danish' : 'English'}. Include appropriate greetings in the selected language.\nContext:\n${contextStr}`,
           config: { responseMimeType: "application/json" }
       });
       
       let script: any[] = [];
       try {
           script = JSON.parse(response.text || "[]");
       } catch (e) {
           script = [];
       }
       
       let audioBuffers: Buffer[] = [];
       for (const line of script) {
            try {
                let textChunks = line.text.match(/.{1,180}(\s|$)/g) || [line.text];
                for (const chunk of textChunks) {
                    if (!chunk.trim()) continue;
                    const base64 = await googleTTS.getAudioBase64(chunk.trim(), {
                        lang: line.speaker === "Sarah" ? "en-GB" : "en-US",
                        slow: false
                    });
                    audioBuffers.push(Buffer.from(base64, 'base64'));
                    // Add small pause
                    const pause = Buffer.alloc(10000);
                    audioBuffers.push(pause);
                }
            } catch (e) {
                console.error("TTS error:", e);
            }
       }
       
       const finalBuffer = Buffer.concat(audioBuffers);
       const bucket = admin.storage().bucket();
       const fileName = `${basePath}/audio_briefs/brief_${Date.now()}.mp3`;
       const file = bucket.file(fileName);
       await file.save(finalBuffer, { metadata: { contentType: "audio/mp3" } });
       
       const [downloadUrl] = await file.getSignedUrl({
         action: 'read',
         expires: Date.now() + 1000 * 60 * 60 * 24 * 365 
       });
       
       res.json({ url: downloadUrl, script });
     } catch (error: any) {
        console.error("Notebook audio overview error:", error);
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
