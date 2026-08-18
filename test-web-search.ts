import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: "Find 5 local businesses for plumber in Austin TX. Return strict JSON." }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    console.log("SUCCESS:", response.text);
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test().catch(console.error);
