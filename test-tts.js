import fs from "fs";

async function run() {
  console.log("Fetching TTS...");
  try {
    const res = await fetch("http://localhost:3000/api/ai/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Testing one two three",
        openaiApiKey: "invalid-key-testing"
      })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (e) {
    console.error(e);
  }
}
run();
