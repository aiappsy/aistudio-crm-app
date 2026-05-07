import { useState, useRef, useEffect, useCallback, ChangeEvent, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X, Send, Loader2, MessageSquare, Bot, User, CheckCircle2, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { crmTools } from "@/services/gemini";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { cn } from "@/lib/utils";

const aiDefault = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Message {
  role: "user" | "assistant";
  content: string;
  isSystem?: boolean;
  sources?: { uri: string; title: string }[];
}

export default function AIAssistant() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom key if available, otherwise fallback to default
  const ai = useMemo(() => {
    return settings?.geminiApiKey 
      ? new GoogleGenAI({ apiKey: settings.geminiApiKey })
      : aiDefault;
  }, [settings?.geminiApiKey]);

  // Initialize or update welcome message when language changes
  useEffect(() => {
    const welcome = t("welcome_message");
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: welcome }]);
    } else if (messages.length === 1 && messages[0].role === "assistant" && messages[0].content !== welcome) {
      setMessages([{ role: "assistant", content: welcome }]);
    }
  }, [language, t, messages]);

  const executeTool = async (name: string, args: any) => {
    if (!user) return "Error: User not authenticated";

    try {
      switch (name) {
        case "create_customer":
          await addDoc(collection(db, "customers"), {
            ...args,
            ownerId: user.uid,
            createdAt: serverTimestamp()
          });
          return `Successfully created customer: ${args.name}`;

        case "create_invoice":
          await addDoc(collection(db, "invoices"), {
            ...args,
            invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
            ownerId: user.uid,
            date: new Date().toISOString()
          });
          return `Successfully created invoice for ${args.customerName} for $${args.amount}`;

        case "send_outreach":
          await addDoc(collection(db, "outreach"), {
            ...args,
            status: "Sent",
            ownerId: user.uid,
            createdAt: serverTimestamp()
          });
          return `Successfully sent ${args.platform} message to ${args.customerName || args.customerId}`;

        case "import_customers":
          const results = [];
          for (const customer of args.customers) {
            await addDoc(collection(db, "customers"), {
              ...customer,
              ownerId: user.uid,
              createdAt: serverTimestamp()
            });
            results.push(customer.name);
          }
          return `Successfully imported ${results.length} customers: ${results.join(", ")}`;

        case "create_quote":
          await addDoc(collection(db, "quotes"), {
            ...args,
            quoteNumber: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
            ownerId: user.uid,
            createdAt: serverTimestamp()
          });
          return `Successfully created quote for ${args.customerName} for $${args.amount}`;

        case "create_product":
          await addDoc(collection(db, "products"), {
            ...args,
            ownerId: user.uid,
            createdAt: serverTimestamp()
          });
          return `Successfully added product: ${args.name}`;

        case "record_payment":
          await addDoc(collection(db, "payments"), {
            ...args,
            ownerId: user.uid,
            createdAt: serverTimestamp()
          });
          return `Successfully recorded payment of $${args.amount} for invoice ${args.invoiceId}`;

        case "update_record":
          const updateRef = doc(db, args.collection, args.id);
          await updateDoc(updateRef, {
            ...args.updates,
            updatedAt: serverTimestamp()
          });
          return `Successfully updated ${args.collection.slice(0, -1)} with ID ${args.id}`;

        case "delete_record":
          const deleteRef = doc(db, args.collection, args.id);
          await deleteDoc(deleteRef);
          return `Successfully deleted ${args.collection.slice(0, -1)} with ID ${args.id}`;

        case "update_settings":
          const settingsRef = doc(db, "settings", user.uid);
          await updateDoc(settingsRef, {
            ...args,
            updatedAt: serverTimestamp()
          });
          return `Successfully updated settings: ${Object.keys(args).join(", ")}`;

        case "generate_report_summary":
          const collectionName = args.category.toLowerCase();
          const q = query(collection(db, collectionName), where("ownerId", "==", user.uid));
          const snapshot = await getDocs(q);
          const count = snapshot.size;
          let totalAmount = 0;
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.amount) totalAmount += Number(data.amount);
            if (data.price) totalAmount += Number(data.price);
          });
          return `Report Summary for ${args.category} (${args.timeframe}): Found ${count} records. Total value: $${totalAmount.toFixed(2)}.`;

        default:
          return `Error: Unknown tool ${name}`;
      }
    } catch (error: any) {
      console.error(`Tool execution error (${name}):`, error);
      return `Error executing ${name}: ${error.message}`;
    }
  };

  const handleSend = useCallback(async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || input.trim();
    if (!messageToSend || loading) return;

    if (!overrideMessage) setInput("");
    setMessages(prev => [...prev, { role: "user", content: messageToSend }]);
    setLoading(true);

    // Token and BYOK Check
    const hasBYOK = !!settings?.geminiApiKey;
    const isEnterprise = settings?.tier === "enterprise" || userProfile?.role === "super_admin" || user?.email === "paljuritzen@gmail.com";
    const availableTokens = userProfile?.aiTokens || 0;
    const tokenExpiry = userProfile?.aiTokenExpiry?.toDate ? userProfile.aiTokenExpiry.toDate() : new Date(0);
    const now = new Date();
    const hasActiveTokenSession = tokenExpiry > now;

    if (!hasBYOK && !isEnterprise) {
      if (!hasActiveTokenSession) {
        if (availableTokens > 0) {
          // Deduct token and start 1-hour session
          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              aiTokens: availableTokens - 1,
              aiTokenExpiry: new Date(now.getTime() + 60 * 60 * 1000) // +1 hour
            });
          } catch (e) {
            console.error("Failed to deduct token", e);
          }
        } else {
          // Out of tokens
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "You are out of AI tokens. Please purchase more tokens in the Settings page or provide your own Gemini API key (BYOK) to continue using the AI Assistant." 
          }]);
          setLoading(false);
          return;
        }
      }
    }

    const processHistory = () => {
      let filtered = messages.filter(m => !m.isSystem && m.content);
      // Gemini API history must start with 'user'
      while (filtered.length > 0 && filtered[0].role !== "user") {
        filtered.shift();
      }
      return filtered.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));
    };

    try {
      const chat = ai.chats.create({
        model: settings?.aiModel || "gemini-3-flash-preview",
        history: processHistory(),
        config: {
          tools: [{ functionDeclarations: crmTools }, { googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true },
          systemInstruction: "You are a helpful CRM assistant. You can execute tasks like creating customers, importing customer lists, creating invoices, quotes, products, and recording payments. You can also update or delete existing records, update application settings, and generate summary reports. You have access to Google Search for competitive research, pricing advice, and finding information about companies or market trends. When a user asks you to do something, use the appropriate tool. If a user provides CSV data, parse it and use the import_customers tool. If you need more information, ask for it. Keep your responses very concise and direct, ideally under 50 words."
        }
      });

      const stream = await chat.sendMessageStream({
        message: messageToSend
      });
      
      let fullText = "";
      let hasStartedAssistantMessage = false;
      let collectedFunctionCalls: any[] = [];

      for await (const chunk of stream) {
        if (chunk.text) {
          if (!hasStartedAssistantMessage) {
            setLoading(false);
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);
            hasStartedAssistantMessage = true;
          }
          fullText += chunk.text;
          const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          const sources = groundingChunks?.map((c: any) => ({
            uri: c.web?.uri || c.maps?.uri,
            title: c.web?.title || c.maps?.title
          })).filter((s: any) => s.uri);

          setMessages(prev => {
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
          collectedFunctionCalls = [...collectedFunctionCalls, ...chunk.functionCalls];
        }
      }
      
      if (collectedFunctionCalls.length > 0) {
        const toolResults = [];
        for (const call of collectedFunctionCalls) {
          setMessages(prev => [...prev, { role: "assistant", content: `Executing: ${call.name}...`, isSystem: true }]);
          const toolResult = await executeTool(call.name, call.args);
          toolResults.push({
            functionResponse: {
              name: call.name,
              response: { result: toolResult }
            }
          });
        }

        // Send tool results back to model (stream the final response too)
        const finalStream = await chat.sendMessageStream({
          message: toolResults as any
        });

        let finalFullText = "";
        let hasStartedFinalMessage = false;

        for await (const chunk of finalStream) {
          if (chunk.text) {
            if (!hasStartedFinalMessage) {
              setMessages(prev => [...prev, { role: "assistant", content: "" }]);
              hasStartedFinalMessage = true;
            }
            finalFullText += chunk.text;
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const sources = groundingChunks?.map((c: any) => ({
              uri: c.web?.uri || c.maps?.uri,
              title: c.web?.title || c.maps?.title
            })).filter((s: any) => s.uri);

            setMessages(prev => {
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
      }
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      const errorMessage = `Error: ${error?.message || JSON.stringify(error)}`;
      setMessages(prev => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  }, [ai, input, loading, messages, settings?.aiModel, user]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleSend(`I've uploaded a file with the following content. Please process it (e.g., if it's a customer list, use the import_customers tool):\n\n${content}`);
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
    return () => window.removeEventListener("trigger-ai-assistant", handleTrigger);
  }, [handleSend]);

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
                  <CardTitle className="text-base font-semibold">{t("ai_assistant_title")}</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4" viewportRef={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((m, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex gap-2 max-w-[85%]",
                          m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          m.isSystem && "bg-accent text-accent-foreground"
                        )}>
                          {m.role === "user" ? <User className="h-4 w-4" /> : (m.isSystem ? <CheckCircle2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />)}
                        </div>
                        <div className={cn(
                          "p-3 rounded-lg text-sm",
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                          m.isSystem && "bg-accent/50 italic text-xs"
                        )}>
                          {m.content}
                          {m.sources && m.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-muted-foreground/20 text-[10px]">
                              <p className="font-semibold mb-1 opacity-70">Sources:</p>
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
                          <span className="text-xs text-muted-foreground italic">{t("thinking")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-3 border-t">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
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
                  <Input
                    placeholder={t("ai_assistant_placeholder")}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0">
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
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  );
}
