import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sparkles, Bot, Loader2, Send, Mic, MicOff, Volume2 } from "lucide-react";
import Markdown from "react-markdown";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useVoice } from "@/lib/VoiceContext";

export default function DailyPlanner({ data }: { data: any }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<{ role: "assistant" | "user", content: string, isSystem?: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [input, setInput] = useState("");
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);
  const { data: globalConfig } = useFirestoreDoc<any>("global_config", "main");
  
  const { isListening, setIsListening, voiceMode, setVoiceMode } = useVoice();
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Setup Speech Recognition
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [setIsListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setInput("");
         try {
           recognitionRef.current.start();
           setIsListening(true);
         } catch(e) {
           console.error("Speech start error", e);
           setIsListening(false);
         }
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  useEffect(() => {
    async function generatePlan() {
      if (!data) return;
      setLoading(true);
      try {
        const { getDailyBriefing, resolveModel } = await import("@/services/gemini");
        const customApiKey = settings?.geminiApiKey || globalConfig?.geminiApiKey;
        const modelToUse = resolveModel(settings?.aiModel || globalConfig?.aiModel);
        
        let promptData = `
          Based on the user's CRM database:
          Contacts/Deals: ${JSON.stringify(data.contacts.slice(0, 50).map((c: any) => ({ name: c.name, status: c.status, type: c.type, nextAction: c.nextAction })))}
          Invoices: ${JSON.stringify(data.invoices.slice(0, 10).map((i: any) => ({ total: i.total, status: i.status })))}
          
          You are the user's proactive AI Day Planner. Write a brief, encouraging morning briefing (max 3 short paragraphs).
          Tell them what they should focus on today, suggest 2-3 specific actionable tasks (like closing a deal, following up with a lead, or sending an invoice). Use markdown lists.
        `;

        if (!settings?.tier || settings.tier !== "pro") {
          // In standard mode, just give a simple generic summary if API not set up
          promptData = `You are a proactive AI assistant. Write a short, friendly, generic "welcoming the user to their day" message and suggest they could review their pending invoices or active deals.`;
        }
        
        const responseText = await getDailyBriefing(promptData, customApiKey, modelToUse);
        setMessages([{ role: "assistant", content: responseText }]);
      } catch (error) {
        console.error("AI Day Plan Error:", error);
        setMessages([{ role: "assistant", content: "Welcome to your day! Review your active deals in the Pipeline to get started."}]);
      } finally {
        setLoading(false);
      }
    }
    
    // Only generate once per session to save API calls
    if (messages.length === 0 && !loading) {
      generatePlan();
    }
  }, [data, settings, globalConfig]);

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const { crmTools, resolveModel } = await import("@/services/gemini");

      // We'll use the platform key for the daily planner chat
      const fallbackApiKey = typeof process !== 'undefined' ? process?.env?.GEMINI_API_KEY : "";
      const apiKeyToUse = settings?.geminiApiKey || globalConfig?.geminiApiKey || fallbackApiKey || "";
      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      const modelToUse = resolveModel(settings?.aiModel || globalConfig?.aiModel);

      // Using the exact tools and context setup similar to main AIAssistant 
      const processedHistory = [];
      let isFirst = true;

      // Ensure alternating roles by squashing consecutive messages
      const squashedMessages = [];
      for (const m of messages) {
        if (m.isSystem || !m.content) continue;
        if (squashedMessages.length === 0) {
           squashedMessages.push({ ...m });
        } else {
           const lastIdx = squashedMessages.length - 1;
           if (squashedMessages[lastIdx].role === m.role) {
              squashedMessages[lastIdx].content += "\n\n" + m.content;
           } else {
              squashedMessages.push({ ...m });
           }
        }
      }

      for (const m of squashedMessages) {
        if (isFirst && m.role === "assistant") {
          processedHistory.push({ role: "user", parts: [{ text: "Start the daily briefing." }] });
          processedHistory.push({ role: "model", parts: [{ text: m.content }] });
          isFirst = false;
        } else {
          processedHistory.push({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          });
          isFirst = false;
        }
      }

      const chat = ai.chats.create({
        model: modelToUse,
        history: processedHistory,
        config: {
          systemInstruction: `You are an expert sales, marketing, and CRM AI assistant embedded directly inside the Aiappsy CRM software. 
You are highly skilled in business strategy, sales optimization, and marketing execution. Give expert advice and help the user grow their business.
The user's current UI language is ${language} (${language === 'no' ? 'Norwegian' : language === 'sv' ? 'Swedish' : language === 'da' ? 'Danish' : 'English'}). You MUST reply in this language.
Here is the context of the user's data:
Contacts/Deals: ${JSON.stringify(data?.contacts?.slice(0, 50).map((c: any) => ({ name: c.name, status: c.status, type: c.type, nextAction: c.nextAction })))}
Invoices: ${JSON.stringify(data?.invoices?.slice(0, 10).map((i: any) => ({ total: i.total, status: i.status })))}
`,
          tools: [{ functionDeclarations: crmTools }],
        }
      });

      let response = await chat.sendMessage({ message: userMessage });
      const { executeToolHelper } = await import("@/services/executeToolHelper");

      while (response.functionCalls && response.functionCalls.length > 0) {
        const toolResults = [];
        for (const call of response.functionCalls) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Executing: ${call.name}...`, isSystem: true },
          ]);
          const result = await executeToolHelper(call.name, call.args, user, settings, globalConfig);
          toolResults.push({
            functionResponse: {
              name: call.name,
              response: { result },
            },
          });
        }
        setMessages((prev) => prev.filter(m => !m.isSystem));
        response = await chat.sendMessage({ message: toolResults as any });
      }

      const responseText = response.text || "I'm not sure how to respond to that.";
      setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
      
      if (voiceMode && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(responseText.replace(/[#*]/g, ""));
        const targetLang = language === "no" ? "no-NO" : language === "sv" ? "sv-SE" : language === "da" ? "da-DK" : "en-US";
        utterance.lang = targetLang;
        
        // Try to pick a Google voice or a local native voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith(targetLang.substring(0,2)) && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium")));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        
        utterance.onend = () => {
          if (voiceMode) {
            setTimeout(() => {
              if (recognitionRef.current && !isListening) {
                 try {
                   recognitionRef.current.start();
                   setIsListening(true);
                 } catch(e) {}
              }
            }, 500);
          }
        };

        window.speechSynthesis.speak(utterance);
      }

    } catch(err: any) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: `I encountered an error looking that up: ${err?.message || String(err)}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-lg relative overflow-hidden flex flex-col h-[400px]">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Bot size={120} />
      </div>
      <CardHeader className="pb-3 border-b border-primary/10 shrink-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <CardTitle className="text-lg font-bold">{t("daily_briefing_chat")}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVoiceMode(!voiceMode)}
          className={cn("h-8 w-8", voiceMode ? "text-primary" : "text-muted-foreground")}
          title={voiceMode ? "Voice Output Active" : "Voice Output Muted"}
        >
          <Volume2 className={cn("h-4 w-4", !voiceMode && "opacity-50")} />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 relative z-10 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-6 gap-3 text-muted-foreground h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">{t("planning_your_day")}</span>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start", msg.isSystem && "opacity-70 text-xs justify-center")}>
                  <div className={cn("max-w-[85%] rounded-lg p-3 text-sm", msg.role === "user" ? "bg-primary text-primary-foreground" : msg.isSystem ? "bg-transparent text-muted-foreground italic font-mono py-1" : "bg-muted")}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted max-w-[85%] rounded-lg p-3 text-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("thinking")}</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="p-3 border-t bg-card relative z-10 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex w-full items-center gap-2"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleListening}
            disabled={chatLoading}
            className={cn("shrink-0 transition-colors rounded-full", isListening && "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400")}
          >
            {isListening ? <Mic className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4 opacity-70" />}
          </Button>
          <Input
            placeholder={isListening ? t("listening") || "Listening..." : t("ask_anything")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-full"
            disabled={chatLoading || isListening || loading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || chatLoading || isListening || loading} className="rounded-full shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
