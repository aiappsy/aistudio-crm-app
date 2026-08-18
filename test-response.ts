import { GoogleGenAI, Type } from "@google/genai";
import { crmTools } from "./src/services/gemini.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      tools: [{ functionDeclarations: crmTools }]
    },
    history: [
      { role: "user", parts: [{ text: "Let's say plumbers in Oslo Norway" }] },
      { role: "model", parts: [{ functionCall: { name: "scrape_google_maps", args: { query: "plumber", location: "Oslo, Norway" } } }] }
    ]
  });
  
  const toolResults = [{
    functionResponse: { name: "scrape_google_maps", response: { error: "Not implemented" } }
  }];
  
  const stream = await chat.sendMessageStream({ message: toolResults as any });
  for await (const chunk of stream) {
    if (chunk.text) console.log("TEXT:", chunk.text);
    if (chunk.functionCalls) console.log("FUNCTION_CALLS:", chunk.functionCalls);
  }
}
test().catch(console.error);
