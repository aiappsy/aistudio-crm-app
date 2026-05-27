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
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
    }
  }, []);

  const playTTS = async (text: string) => {
    if (!text || !voiceMode) return;
    try {
      // Remove URLs, markdown formatting, emojis for better speech synthesis
      const cleanText = text.replace(/__|[*]/g, '').replace(/https?:\/\/[^\s]+/g, '').slice(0, 1000);
      
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel(); // Stop any current speech
        const utterance = new SpeechSynthesisUtterance(cleanText);
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
             // Optional: automatically resume listening after speaking
             // Need a small timeout to avoid capturing the end of the TTS
             setTimeout(() => {
               if (recognitionRef.current && !isListening) {
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
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          handleSend(transcript);
        };
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Use custom key if available, otherwise fallback to default
  const ai = useMemo(() => {
    let apiKeyToUse = "";
    if (settings?.geminiApiKey && typeof settings.geminiApiKey === "string" && settings.geminiApiKey.trim().length > 10) {
      apiKeyToUse = settings.geminiApiKey.trim();
    } else if (globalConfig?.systemApis?.geminiApiKey && typeof globalConfig.systemApis.geminiApiKey === "string" && globalConfig.systemApis.geminiApiKey.trim().length > 10) {
      apiKeyToUse = globalConfig.systemApis.geminiApiKey.trim();
    } else {
      apiKeyToUse = getGlobalApiKey();
    }
    return apiKeyToUse ? new GoogleGenAI({ apiKey: apiKeyToUse }) : aiDefault;
  }, [settings?.geminiApiKey, globalConfig?.systemApis?.geminiApiKey]);

  const previousOpenState = useRef(false);

  const handleSend = useCallback(
    async (overrideMessage?: string, isHiddenQuery: boolean = false) => {
      const messageToSend = overrideMessage || input.trim();
      if (!messageToSend || loading) return;

      if (!overrideMessage) setInput("");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: messageToSend, isHidden: isHiddenQuery },
      ]);
      setLoading(true);

      // Token and BYOK Check
      const hasBYOK = !!settings?.geminiApiKey;
      const currentModel = resolveModel(settings?.aiModel);
      const isPremiumModel = !["gemini-2.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"].includes(currentModel);
      
      const isEnterprise =
        settings?.tier === "enterprise" ||
        userProfile?.role === "super_admin" ||
        user?.email === "paljuritzen@gmail.com";
      const availableTokens = userProfile?.aiTokens || 0;
      const tokenExpiry = userProfile?.aiTokenExpiry?.toDate
        ? userProfile.aiTokenExpiry.toDate()
        : new Date(0);
      const now = new Date();
      const hasActiveTokenSession = tokenExpiry > now;

      if (isPremiumModel && !hasBYOK) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ **Premium Model Selected**\n\nYou have configured the assistant to use a premium AI model (e.g., Gemini 3.1 Pro), which requires you to bring your own API key.\n\nTo continue, please go to **Settings > Integrations** and add your Google AI Studio API Key. Alternatively, switch your model back to the included `Gemini 3.0 Flash` to continue using your standard AI actions.",
            isSystem: true,
          },
        ]);
        setLoading(false);
        return;
      }

      if (!hasBYOK && !isEnterprise) {
        if (!hasActiveTokenSession) {
          if (availableTokens > 0) {
            // Deduct credit and start 1-hour session
            try {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                aiTokens: availableTokens - 1,
                aiTokenExpiry: new Date(now.getTime() + 60 * 60 * 1000), // +1 hour
              });
            } catch (e) {
              console.error("Failed to deduct credit", e);
            }
          } else {
            // Out of credits
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content:
                  "You are out of AI Actions. Please upgrade your plan in the Settings page or provide your own Gemini API key (BYOK) to unlock unlimited usage.",
              },
            ]);
            setLoading(false);
            return;
          }
        }
      }

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
        }));
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
        
        const systemInstruction = `You are the AIAppsy CRM Agent, an autonomous execution engine for modern business management. You are NOT a passive advisor. You are a DOER.

CORE PHILOSOPHY: You do not just surface insights or flag risks. You determine the correct course of action and carry it out within the system. You confirm completion and move to the next priority. When a deal stalls, you do not send a reminder email to the rep. You review the communication history, draft a personalized follow-up, schedule it for optimal send time, and notify the rep after the action is taken.

The user's current UI language is ${language} (${language === 'no' ? 'Norwegian' : language === 'sv' ? 'Swedish' : language === 'da' ? 'Danish' : 'English'}). You MUST reply in this language.

YOUR CAPABILITIES:
1. TASK EXECUTION: Create contacts, update deals, send emails, schedule meetings, assign tasks - all autonomously upon request or proactively.
2. PIPELINE MONITORING: Continuously track deal velocity and engagement. Intervene when deals stall with re-engagement actions.
3. LEAD SCORING: Apply BANT, MEDDIC, or CHAMP frameworks using real interaction data to rank and prioritize leads automatically.
4. SMART FORECASTING: Generate revenue forecasts based on historical win rates, deal age distributions, and seasonal patterns.
5. DATA ENRICHMENT: Merge duplicates, fill missing fields, and enrich records with external data sources without manual effort.
6. REPORT GENERATION: Produce detailed pipeline, activity, and performance reports on demand or on schedule.
7. EMAIL DRAFTING: Compose personalized, context-aware emails based on each prospect's communication history and stage. Schedule at optimal send times.
8. WORKFLOW AUTOMATION: Trigger multi-step workflows based on conditions and events, reducing manual handoffs and delays.
9. CUSTOMER SUCCESS: Monitor health signals, detect churn risk early, and proactively schedule check-ins and business reviews.
10. DATA HYGIENE: Continuously audit data quality, merge duplicates, enrich records, and flag inconsistencies.

AUTOPILOT / AUTONOMOUS FLYWHEEL:
This user has Autopilot ${settings?.autopilotEnabled ? "ENABLED" : "DISABLED"}. 
${settings?.autopilotEnabled ? "You have explicit permission to take non-destructive actions autonomously and aggressively optimize their pipeline. Surface daily summaries instead of asking for permission." : "You must ask for explicit permission before executing workflows or sending communications."}

BUSINESS CONTEXT & BRAND VOICE:
${brandVoiceStr}

The user's current UI language is ${language} (${language === 'no' ? 'Norwegian' : 'English'}). You MUST reply in this language.

BEHAVIORAL RULES:
- For non-destructive actions (draft email, schedule meeting, create task): Execute immediately, then notify the user with the result.
- For destructive actions (delete, merge, escalate): Ask for confirmation before executing.
- Always use the Brand Voice guidelines when drafting communications.
- Always reference the Context Engine for business-specific knowledge.
- When you detect a risk or opportunity, act on it. Do not wait to be asked.
- Provide results as actionable intelligence, not raw data.
- If multiple actions are needed, execute them in sequence and report the combined outcome.
- Track every action you take in the audit log.

RESPONSE FORMAT: When executing actions, respond with a structured action card (or concise text):
[Action Type] - [Status]
Details: [What was done]
Next: [Recommended follow-up, if any]

When answering questions, be concise, data-driven, and action-oriented. End every response with a suggested next action the user can take or that you can execute on their behalf.`;

        const chat = ai.chats.create({
          model: resolveModel(settings?.aiModel),
          history: processHistory(),
          config: {
            tools: [{ functionDeclarations: crmTools }],
            systemInstruction,
          },
        });

        const stream = await chat.sendMessageStream({
          message: messageToSend,
        });

        let fullText = "";
        let hasStartedAssistantMessage = false;
        let collectedFunctionCalls: any[] = [];

        for await (const chunk of stream) {
          if (chunk.text) {
            if (!hasStartedAssistantMessage) {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "" },
              ]);
              hasStartedAssistantMessage = true;
            }
            fullText += chunk.text;
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
                lastMessage.content = fullText;
                if (sources && sources.length > 0) {
                  lastMessage.sources = sources;
                }
              }
              return [...newMessages];
            });
          }

          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            collectedFunctionCalls = [
              ...collectedFunctionCalls,
              ...chunk.functionCalls,
            ];
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

          // Send tool results back to model (stream the final response too)
          const finalStream = await chat.sendMessageStream({ message: toolResults as any });

          let finalFullText = "";
          let hasStartedFinalMessage = false;

          for await (const chunk of finalStream) {
            if (chunk.text) {
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
                    onClick={() => setVoiceMode(!voiceMode)}
                    className={cn("h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10", voiceMode && "bg-primary-foreground/20")}
                    title={voiceMode ? "Voice Mode On" : "Voice Mode Off"}
                  >
                    <Volume2 className={cn("h-4 w-4", !voiceMode && "opacity-50 line-through")} />
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
