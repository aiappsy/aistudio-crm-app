import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const chat = ai.chats.create({
    model: "gemini-2.0-flash",
  });
  const stream = await chat.sendMessageStream({ message: "Say hi" });
  for await (const chunk of stream) {
    console.log(Object.keys(chunk));
    console.log("text:", chunk.text);
    console.log("functionCalls:", chunk.functionCalls);
  }
}
test().catch(console.error);
