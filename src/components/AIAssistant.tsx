import { executeToolHelper } from "@/services/executeToolHelper";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  ChangeEvent,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  MessageSquare,
  Bot,
  User,
  CheckCircle2,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { crmTools, resolveModel } from "@/services/gemini";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { cn } from "@/lib/utils";

const getGlobalApiKey = () => {
  try {
    // Attempt standard Vite env or process env fallback
    return (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) 
      || (typeof process !== 'undefined' && process?.env?.GEMINI_API_KEY) 
      || "";
  } catch (e) {
    return "";
  }
};
const aiDefault = new GoogleGenAI({ apiKey: getGlobalApiKey() || "dummy-key" });

interface Message {
  role: "user" | "assistant";
  content: string;
  isSystem?: boolean;
  isHidden?: boolean;
  sources?: { uri: string; title: string }[];
}

import { useVoice } from "@/lib/VoiceContext";

export default function AIAssistant() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);
  const { data: globalConfig } = useFirestoreDoc<any>("global_config", "main");
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice mode state
  const { voiceMode, setVoiceMode, isListening, setIsListening } = useVoice();
  const voiceModeRef = useRef(voiceMode);
  const isListeningRef = useRef(isListening);
  
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const handleSendRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          if (handleSendRef.current) {
            handleSendRef.current(transcript);
          }
        };
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
      }
      if ("speechSynthesis" in window) {
        // Force the browser to start fetching voices
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  const playTTS = async (text: string) => {
    if (!text || !voiceModeRef.current) return;
    try {
      // Remove URLs, markdown formatting, emojis for better speech synthesis
      const cleanText = text.replace(/__|[*]/g, '').replace(/https?:\/\/[^\s]+/g, '').slice(0, 1000);
      
      // Try OpenAI TTS first
      if (settings?.openaiApiKey) {
        console.log("Trying OpenAI TTS, have key");
        try {
          const res = await fetch("/api/ai/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: cleanText,
              openaiApiKey: settings?.openaiApiKey,
              voice: settings?.openAiVoice || "alloy"
            })
          });

          if (res.ok) {
            console.log("OpenAI TTS success, playing buffer via AudioContext");
            const arrayBuffer = await res.arrayBuffer();
            
            // Initialize AudioContext if needed
            if (!audioContextRef.current) {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
              audioContextRef.current = new AudioContext();
            }
            const actx = audioContextRef.current;
            if (actx.state === "suspended") {
              await actx.resume();
            }

            const audioBuffer = await actx.decodeAudioData(arrayBuffer);
            const source = actx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(actx.destination);
            
            source.onended = () => {
              if (voiceModeRef.current) {
                 setTimeout(() => {
                   if (recognitionRef.current && !isListeningRef.current) {
                     try {
                       recognitionRef.current.start();
                       setIsListening(true);
                     } catch(e) {}
                   }
                 }, 500);
              }
            };
            
            try {
              source.start(0);
              return; // Exits function if play succeeds
            } catch (playErr) {
              console.error("Audio play failed (maybe autoplay blocked), falling back:", playErr);
            }
          } else {
             const errText = await res.text();
             console.error("OpenAI TTS returned not OK status:", errText);
             
             // Only display an alert the first time we see this error 
             if (!window.sessionStorage.getItem("openai_tts_error_shown")) {
               setMessages((prev) => [
                 ...prev, 
                 { role: "assistant", content: `System Error: OpenAI TTS failed (Check API Key / Billing). Falling back to browser voice. Error: ${errText.slice(0, 100)}` }
               ]);
               window.sessionStorage.setItem("openai_tts_error_shown", "true");
             }
          }
        } catch (openaiErr: any) {
          console.error("OpenAI TTS failed, falling back to browser TTS", openaiErr);
        }
      } else {
        console.log("No OpenAI key found in settings, falling back to browser TTS", settings?.openaiApiKey);
      }

      // Fallback to browser TTS
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel(); // Stop any current speech
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const targetLang = language === "no" ? "no-NO" : language === "sv" ? "sv-SE" : language === "da" ? "da-DK" : "en-GB";
        utterance.lang = targetLang;
        
        // Try to pick a Google voice or a local native voice
        const voices = window.speechSynthesis.getVoices();
        
        let preferredVoice = voices.find(v => v.lang.startsWith(targetLang.substring(0,2)) && (v.name.includes("Microsoft") && v.name.includes("Online")));
        
        if (!preferredVoice) {
          preferredVoice = voices.find(v => v.lang.startsWith(targetLang.substring(0,2)) && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium")));
        }

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        
        utterance.onend = () => {
          if (voiceModeRef.current) {
             // Optional: automatically resume listening after speaking
             // Need a small timeout to avoid capturing the end of the TTS
             setTimeout(() => {
               if (recognitionRef.current && !isListeningRef.current) {
                 try {
                   recognitionRef.current.start();
                   setIsListening(true);
                 } catch(e) {}
               }
             }, 300);
          }
        };

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("TTS Failed", e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === "no" ? "no-NO" : language === "sv" ? "sv-SE" : language === "da" ? "da-DK" : "en-US";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const getApiKeyToUse = () => {
    if (settings?.geminiApiKey && typeof settings.geminiApiKey === "string" && settings.geminiApiKey.trim().length > 10) {
      return settings.geminiApiKey.trim();
    } else if (globalConfig?.systemApis?.geminiApiKey && typeof globalConfig.systemApis.geminiApiKey === "string" && globalConfig.systemApis.geminiApiKey.trim().length > 10) {
      return globalConfig.systemApis.geminiApiKey.trim();
    }
    return getGlobalApiKey();
  };

  const ai = useMemo(() => {
    const key = getApiKeyToUse();
    return key ? new GoogleGenAI({ apiKey: key }) : aiDefault;
  }, [settings?.geminiApiKey, globalConfig?.systemApis?.geminiApiKey]);

  const previousOpenState = useRef(false);

  const handleSend = useCallback(
    async (overrideMessage?: string, isHiddenQuery: boolean = false) => {
      const apiKeyToUse = getApiKeyToUse();
      const messageToSend = overrideMessage || input.trim();
      if (!messageToSend || loading) return;

      if (!overrideMessage) setInput("");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: messageToSend, isHidden: isHiddenQuery },
      ]);
      setLoading(true);

      // Token and BYOK Check - Not mandatory anymore
      const currentModel = resolveModel(settings?.aiModel);
      const isPremiumModel = !["gemini-2.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"].includes(currentModel);

      const processHistory = () => {
        let filtered = messages.filter((m) => !m.isSystem && m.content);

        const alternatingFiltered = [];
        for (const m of filtered) {
          const cleanMessage = { ...m };
          if (alternatingFiltered.length === 0) {
            if (cleanMessage.role === "user")
              alternatingFiltered.push(cleanMessage);
          } else {
            const lastIndex = alternatingFiltered.length - 1;
            const lastRole = alternatingFiltered[lastIndex].role;
            if (cleanMessage.role !== lastRole) {
              alternatingFiltered.push(cleanMessage);
            } else {
              alternatingFiltered[lastIndex].content +=
                "\n\n" + cleanMessage.content;
            }
          }
        }

        return alternatingFiltered.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })) as any[];
      };

      try {
        const brandVoice = settings?.brandVoice || {};
        const brandVoiceStr = `
Tone: ${brandVoice.tone || 'Professional'}
Formality Level: ${brandVoice.formalityLevel || 3}/5
Greeting Preference: ${brandVoice.greetingPreference || 'Hi [Name],'}
Closing Preference: ${brandVoice.closingPreference || 'Best regards,'}
Prohibited Phrases: ${brandVoice.prohibitedPhrases || 'None'}
`;
        
        const systemInstruction = `You are the CRM Executive AI Assistant—a proactive business partner, researcher, and lead generation specialist.

CORE PERSONALITY:
- Action-oriented, highly professional, and sales-focused.
- You do not just answer questions; you proactively suggest strategies to grow the user's business.
- You speak with clarity, keeping conversational responses concise (under 60 words) and letting your actions (tool calls) do the heavy lifting.

LEAD GENERATION & SCRAPING PROTOCOL:
1. If the user asks to find leads, prospects, or businesses in a specific area (e.g., "Find cafes in Oslo"), immediately execute 'scrape_google_maps' with the niche and location.
2. Once business results are returned:
   - Summarize the find (e.g., "I found 5 cafes in Oslo.").
   - Proactively suggest: "Shall I crawl their websites to extract email addresses for outreach?"
3. If approved, call 'extract_emails_from_websites' with the scraped URL list.
4. When email addresses are extracted:
   - Rank the leads by rating and availability of contact emails.
   - Proactively suggest: "Would you like me to import these leads into your CRM Contacts list now?"
5. If approved, call 'import_leads_to_crm' to write them to the CRM.
6. Once imported, offer to draft a personalized cold email template or WhatsApp message for the leads.

CRM & BILLING PROTOCOL:
- You can create invoices, products, quotes, and record payments using their respective tools.
- When the user asks to invoice someone, explicitly ask if they would like you to generate the invoice and send it to the customer (via email). If they say yes, use \`create_invoice\` and then \`send_email\` to send the invoice and payment link. 
- When an invoice is created, ask if they want to generate a Stripe payment URL so their customer can pay immediately.
- If a tool reports missing credentials (e.g. SMTP or Stripe keys):
  - For SMTP (Gmail) settings, ask the user to provide their Email Address and an App Password directly in the chat, then use 'update_smtp_settings' tool to configure them natively. Use smtp.gmail.com and 587 as defaults for Gmail.
  - For other keys (Stripe, Twilio), guide the user to the "Integrations" page to set them up.

CRITICAL RULES:
- If asked to categorize or find leads for a specific niche/industry, always ensure you populate the 'industry' field of the contact data.
- Always call the tools when appropriate. Do not explain what you are going to do before calling the tool unless necessary.
- Write to the "contacts" collection (which handles both customers and leads) for all contact-related activities.
- Always respond in the same language the user addresses you in.

The user's current UI language is ${language} (${language === 'no' ? 'Norwegian' : language === 'sv' ? 'Swedish' : language === 'da' ? 'Danish' : 'English'}). You MUST reply in this language.

AUTOPILOT:
This user has Autopilot ${settings?.autopilotEnabled ? "ENABLED" : "DISABLED"}. 

BUSINESS CONTEXT & BRAND VOICE:
${brandVoiceStr}`;

        let fullText = "";
        let hasStartedAssistantMessage = false;
        let collectedFunctionCalls: any[] = [];
        
        let chat: any;
        const historyData = processHistory();
        
        if (apiKeyToUse) {
          // Direct client-side SDK if BYOK is provided
          chat = ai.chats.create({
            model: resolveModel(settings?.aiModel),
            history: historyData,
            config: {
              tools: [{ functionDeclarations: crmTools }],
              systemInstruction,
            },
          });
          
          const stream = await chat.sendMessageStream({ message: messageToSend });
          for await (const chunk of stream) {
            if (chunk.text !== undefined && chunk.text !== null) {
              if (!hasStartedAssistantMessage) {
                setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
                hasStartedAssistantMessage = true;
              }
              fullText += chunk.text;
              const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
              const sources = groundingChunks?.map((c: any) => ({
                uri: c.web?.uri || c.maps?.uri,
                title: c.web?.title || c.maps?.title,
              })).filter((s: any) => s.uri);

              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === "assistant") {
                  lastMessage.content = fullText;
                  if (sources && sources.length > 0) { lastMessage.sources = sources; }
                }
                return [...newMessages];
              });
            }
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              collectedFunctionCalls = [...collectedFunctionCalls, ...chunk.functionCalls];
            } else if (chunk.candidates?.[0]?.content?.parts) {
              const partCalls = chunk.candidates[0].content.parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
              if (partCalls.length > 0) {
                collectedFunctionCalls = [...collectedFunctionCalls, ...partCalls];
              }
            }
          }
        } else {
          // Server-side route
          const res = await fetch("/api/ai/chat", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
               message: messageToSend,
               history: historyData,
               systemInstruction,
               tools: crmTools
             })
          });
          if (!res.ok) throw new Error(await res.text());
          const backendData = await res.json();
          
          fullText = backendData.text || "";
          hasStartedAssistantMessage = true;
          
          if (backendData.functionCalls && backendData.functionCalls.length > 0) {
             collectedFunctionCalls = backendData.functionCalls;
          }
          
          if (fullText) {
             setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
          }
        }
        
        if (collectedFunctionCalls.length === 0) {
          if (!hasStartedAssistantMessage) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "I couldn't generate a response. This may be due to safety filters or an empty response." },
            ]);
            playTTS("I couldn't generate a response. This may be due to safety filters.");
          } else {
            playTTS(fullText);
          }
        }

        if (collectedFunctionCalls.length > 0) {
          const toolResults = [];
          for (const call of collectedFunctionCalls) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `Executing: ${call.name}...`,
                isSystem: true,
              },
            ]);
            const toolResult = await executeToolHelper(call.name, call.args, user, settings, globalConfig);
            toolResults.push({
              functionResponse: {
                name: call.name,
                response: { result: toolResult },
              },
            });
          }

          let finalFullText = "";
          let hasStartedFinalMessage = false;

          if (apiKeyToUse && chat) {
            // Send tool results back to model (stream the final response too)
            const finalStream = await chat.sendMessageStream({ message: toolResults as any });
            
            for await (const chunk of finalStream) {
              if (chunk.text !== undefined && chunk.text !== null) {
                if (!hasStartedFinalMessage) {
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "" },
                  ]);
                  hasStartedFinalMessage = true;
                }
                finalFullText += chunk.text;
                const groundingChunks =
                  chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                const sources = groundingChunks
                  ?.map((c: any) => ({
                    uri: c.web?.uri || c.maps?.uri,
                    title: c.web?.title || c.maps?.title,
                  }))
                  .filter((s: any) => s.uri);

                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === "assistant") {
                    lastMessage.content = finalFullText;
                    if (sources && sources.length > 0) {
                      lastMessage.sources = sources;
                    }
                  }
                  return [...newMessages];
                });
              }
            }
          } else {
             // Backend fallback
             historyData.push({ role: "user", parts: [{ text: messageToSend }] });
             historyData.push({ role: "model", parts: collectedFunctionCalls.map((fc: any) => ({ functionCall: fc })) });
             
             const res = await fetch("/api/ai/chat", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                 message: toolResults, // Send tool result back to backend as the next user message to continue chat
                 history: historyData,
                 systemInstruction,
                 tools: crmTools
               })
             });
             if (!res.ok) throw new Error(await res.text());
             const finalBackendData = await res.json();
             finalFullText = finalBackendData.text || "Action complete.";
             hasStartedFinalMessage = true;
             setMessages((prev) => [
               ...prev,
               { role: "assistant", content: finalFullText },
             ]);
          }
          if (!hasStartedFinalMessage) {
            finalFullText = "I have completed the requested actions.";
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: finalFullText },
            ]);
          }
          playTTS(finalFullText);
        }
      } catch (error: any) {
        console.error("AI Assistant Error:", error);
        let errorData = error;
        let errorMessage = "An unknown error occurred.";
        
        try {
          if (typeof error?.message === "string" && error.message.startsWith("{")) {
             errorData = JSON.parse(error.message);
          }
        } catch(e) {}
        
        const stringMessage = errorData?.error?.message || errorData?.message || error?.message || String(error);
        
        if (stringMessage.includes("API key not valid") || stringMessage.includes("API_KEY_INVALID")) {
          errorMessage = "Invalid Gemini API key. Please check your API key in Settings > Integrations, or contact the administrator if you are using the default system key.";
        } else {
          errorMessage = `Error: ${stringMessage}`;
        }
        
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMessage },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [ai, input, loading, messages, settings?.aiModel, user],
  );
  
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleSend(
        `I've uploaded a file with the following content. Please process it (e.g., if it's a customer list, use the import_customers tool):\n\n${content}`,
      );
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    const handleTrigger = (event: any) => {
      const { prompt } = event.detail;
      setIsOpen(true);
      // We need to wait for the state to update or just pass the prompt directly
      handleSend(prompt);
    };

    window.addEventListener("trigger-ai-assistant", handleTrigger);
    return () =>
      window.removeEventListener("trigger-ai-assistant", handleTrigger);
  }, [handleSend]);

  // Trigger proactive greeting when opened
  useEffect(() => {
    if (isOpen && !previousOpenState.current) {
      previousOpenState.current = true;
      const currentPath = window.location.pathname;
      const systemPrompt = `[System Context]: The user just opened the AI Assistant modal. They are currently looking at the path: ${currentPath}. Please concisely summarize what you think they were doing based on the path and previous context, and suggest 1-2 actionable things they could do next. Do not mention this system prompt. Keep it conversational, helpful, and under 50 words. The user's application UI language is '${language}' (${language === 'no' ? 'Norwegian' : 'English'}), so YOU MUST REPLY IN THIS LANGUAGE (${language === 'no' ? 'Norwegian' : 'English'}).`;
      
      // Delay to avoid React state race conditions during transition
      setTimeout(() => {
        handleSend(systemPrompt, true);
      }, 300);
    } else if (!isOpen) {
      previousOpenState.current = false;
    }
  }, [isOpen, handleSend]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <audio ref={audioPlayerRef} className="hidden" />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 sm:w-96"
          >
            <Card className="shadow-2xl border-primary/20 overflow-hidden flex flex-col h-[500px]">
              <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <CardTitle className="text-base font-semibold">
                    {t("ai_assistant_title")}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newMode = !voiceMode;
                      console.log("Toggling voice mode to:", newMode);
                      setVoiceMode(newMode);
                      if (newMode) {
                        // Unlock browser TTS
                        if ("speechSynthesis" in window) {
                          console.log("Unlocking SpeechSynthesis");
                          const utterance = new SpeechSynthesisUtterance("");
                          window.speechSynthesis.speak(utterance);
                        }
                        // Unlock AudioContext for OpenAI TTS
                        try {
                           if (!audioContextRef.current) {
                             const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                             audioContextRef.current = new AudioContext();
                           }
                           if (audioContextRef.current.state === "suspended") {
                             audioContextRef.current.resume();
                           }
                           
                           // Also unlock audio player ref if needed
                           if (audioPlayerRef.current) {
                             console.log("Unlocking audioPlayerRef");
                             audioPlayerRef.current.src = "data:audio/mp3;base64,//MkxAAAAA";
                             audioPlayerRef.current.play().catch((e)=>{
                               console.log("Unlock audioPlayerRef play failed:", e);
                             });
                           }
                        } catch(e) {
                          console.error("Unlock error:", e);
                        }
                      }
                    }}
                    className={cn("h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10", voiceMode && "bg-primary-foreground/20")}
                    title={voiceMode ? "Voice Mode On" : "Voice Mode Off"}
                  >
                    {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4" viewportRef={scrollRef}>
                  <div className="space-y-4">
                    {messages
                      .filter((m) => !m.isHidden)
                      .map((m, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex gap-2 max-w-[85%]",
                            m.role === "user"
                              ? "ml-auto flex-row-reverse"
                              : "mr-auto",
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              m.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                              m.isSystem && "bg-accent text-accent-foreground",
                            )}
                          >
                            {m.role === "user" ? (
                              <User className="h-4 w-4" />
                            ) : m.isSystem ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={cn(
                              "p-3 rounded-lg text-sm",
                              m.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted",
                              m.isSystem && "bg-accent/50 italic text-xs",
                            )}
                          >
                            {m.content}
                            {m.sources && m.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-muted-foreground/20 text-[10px]">
                                <p className="font-semibold mb-1 opacity-70">
                                  Sources:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {m.sources.map((s, idx) => (
                                    <a
                                      key={idx}
                                      href={s.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline bg-background/50 px-1 rounded truncate max-w-[150px]"
                                      title={s.title}
                                    >
                                      {s.title || s.uri}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    {loading && (
                      <div className="flex gap-2 mr-auto max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground italic">
                            {t("thinking")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-3 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex w-full items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".csv,.txt"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="shrink-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleListening}
                    disabled={loading}
                    className={cn("shrink-0 transition-colors", isListening && "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400")}
                  >
                    {isListening ? <Mic className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4 opacity-70" />}
                  </Button>
                  <Input
                    placeholder={isListening ? "Listening..." : t("ai_assistant_placeholder")}
                    value={input ?? ""}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                    disabled={loading || isListening}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={loading || !input.trim()}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
