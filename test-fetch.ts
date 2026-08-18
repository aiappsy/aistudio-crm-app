console.log("TESTING API...");
fetch('http://localhost:3000/api/ai/generate', { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' }, 
  body: JSON.stringify({ 
    prompt: 'Find 2 local plumbers in Hamar Norway. Return STRICT JSON: {"results": [{"company": "str", "phone": "str"}]}', 
    useWebSearch: true 
  }) 
})
.then(async r => {
  console.log("Status:", r.status);
  console.log("Text:", await r.text());
})
.catch(console.error);
