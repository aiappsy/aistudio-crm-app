import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
  });
  const stream = await chat.sendMessageStream({ message: "Let's say plumbers in Oslo Norway" });
  for await (const chunk of stream) {
    if (chunk.text) console.log("TEXT:", chunk.text);
    if (chunk.functionCalls) console.log("FUNCTION_CALLS:", chunk.functionCalls);
  }
}
test().catch(console.error);
