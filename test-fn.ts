import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      tools: [{ functionDeclarations: [{ name: "lookup_plumbers", description: "find plumbers", parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING } } } }] }]
    }
  });
  const stream = await chat.sendMessageStream({ message: "Find plumbers in Oslo" });
  for await (const chunk of stream) {
    console.log("Chunk received!");
    console.log("text:", chunk.text);
    console.log("functionCalls:", chunk.functionCalls);
  }
}
test().catch(console.error);
