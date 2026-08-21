import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreCollection, useFirestoreDoc } from "@/lib/useFirestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Send, Trash2, Headphones, Sparkles, Loader2, BookOpen, Search, User, Link as LinkIcon, Type, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";

interface NotebookSource {
  id: string;
  name: string;
  storagePath: string;
  downloadUrl: string;
  status: string;
  extractedText?: string;
}

export default function Notebook() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const { data: contacts, loading: contactsLoading } = useFirestoreCollection<any>("contacts");
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);

  const [selectedContactId, setSelectedContactId] = useState<string | null>(location.state?.selectedContactId || null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: sources } = useFirestoreCollection<NotebookSource>(
    selectedContactId ? `contacts/${selectedContactId}/notebook_sources` : (user?.uid ? `users/${user.uid}/notebook_sources` : "")
  );

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [addingMode, setAddingMode] = useState<"none" | "url" | "text">("none");
  const [inputUrl, setInputUrl] = useState("");
  const [inputText, setInputText] = useState("");
  const [inputTitle, setInputTitle] = useState("");

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [chatting, setChatting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [generatingGuide, setGeneratingGuide] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const filteredContacts = (contacts || []).filter((c: any) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (selectedContactId) {
      formData.append("contactId", selectedContactId);
    }

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/notebook/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddUrl = async () => {
    if (!inputUrl || !user) return;
    setUploading(true);
    setAddingMode("none");
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/notebook/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl, contactId: selectedContactId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setInputUrl("");
    } catch (e: any) { alert("Adding URL failed: " + e.message); }
    finally { setUploading(false); }
  };

  const handleAddText = async () => {
    if (!inputText || !user) return;
    setUploading(true);
    setAddingMode("none");
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/notebook/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, title: inputTitle, contactId: selectedContactId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setInputText("");
      setInputTitle("");
    } catch (e: any) { alert("Adding text failed: " + e.message); }
    finally { setUploading(false); }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Remove this source?")) return;
    const basePath = selectedContactId ? `contacts/${selectedContactId}` : `users/${user?.uid}`;
    await deleteDoc(doc(db, `${basePath}/notebook_sources`, sourceId));
  };

  const sendMessageToNotebook = async (msg: string) => {
    if (!user) return;
    setChatting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/notebook/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: selectedContactId,
          message: msg,
          geminiApiKey: settings?.geminiApiKey,
          language,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "assistant", text: data.text }]);
    } catch (e: any) {
      setChatHistory((prev) => [...prev, { role: "assistant", text: "Error: " + e.message }]);
    } finally {
      setChatting(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    const newMsg = chatMessage.trim();
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", text: newMsg }]);
    await sendMessageToNotebook(newMsg);
  };

  const handleGenerateStudyGuide = async () => {
    const prompt =
      "Please generate a structured study guide and FAQ for this account based on the sources, including Timeline, Key Risks, and Client Pain Points.";
    setChatHistory((prev) => [...prev, { role: "user", text: prompt }]);
    setGeneratingGuide(true);
    await sendMessageToNotebook(prompt);
    setGeneratingGuide(false);
  };

  const handleGenerateAudio = async () => {
    if (!user) return;
    setGeneratingAudio(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/notebook/generate-audio-overview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: selectedContactId,
          geminiApiKey: settings?.geminiApiKey,
          language,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAudioUrl(data.url);
    } catch (e: any) {
      alert("Failed to generate audio overview: " + e.message);
    } finally {
      setGeneratingAudio(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
      {/* Sidebar for Selection */}
      <Card className="w-full md:w-80 shrink-0 flex flex-col border-border shadow-sm">
        <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            Intelligence Hub
          </CardTitle>
          <CardDescription>Select an account to explore insights and reports</CardDescription>
        </CardHeader>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading accounts...
            </div>
          ) : (
            <div className="divide-y divide-border">
              <button
                onClick={() => {
                  setSelectedContactId(null);
                  setChatHistory([]);
                  setAudioUrl(null);
                }}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${
                  selectedContactId === null ? "bg-primary/10 border-l-4 border-primary" : "border-l-4 border-transparent"
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-foreground">Global Hub</p>
                  <p className="text-sm truncate text-muted-foreground">General Workspace</p>
                </div>
              </button>
              {filteredContacts.map((contact: any) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedContactId(contact.id);
                    setChatHistory([]);
                    setAudioUrl(null);
                  }}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${
                    selectedContactId === contact.id ? "bg-primary/10 border-l-4 border-primary" : "border-l-4 border-transparent"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-foreground">{contact.name}</p>
                    <p className="text-sm truncate text-muted-foreground">{contact.company}</p>
                  </div>
                </button>
              ))}
              {filteredContacts.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No accounts found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 h-full divide-x divide-border">
          
          {/* Sources Column */}
          <div className="md:col-span-1 bg-muted/10 flex flex-col h-full border-r border-border min-w-[250px]">
            <div className="p-4 border-b border-border shrink-0">
              <h3 className="font-semibold px-1">{selectedContactId ? "Account Sources" : "My Uploads"}</h3>
              <p className="text-xs text-muted-foreground px-1 mt-1">Upload files to build the Hub</p>
            </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
                
                {addingMode === "none" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors col-span-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground mb-1" />
                      ) : (
                        <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      )}
                      <p className="text-sm font-medium text-foreground">Upload File</p>
                    </button>
                    <button
                      className="flex gap-2 items-center justify-center border border-border rounded-lg p-2 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setAddingMode("url")}
                    >
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Add URL</span>
                    </button>
                    <button
                      className="flex gap-2 items-center justify-center border border-border rounded-lg p-2 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setAddingMode("text")}
                    >
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Paste Text</span>
                    </button>
                  </div>
                )}

                {addingMode === "url" && (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3 relative group">
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-6 w-6 text-muted-foreground" onClick={() => setAddingMode("none")}>
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="text-sm font-semibold">Web Link</p>
                    <Input 
                      placeholder="https://example.com" 
                      value={inputUrl} 
                      onChange={e => setInputUrl(e.target.value)} 
                      className="h-9 text-sm"
                    />
                    <Button onClick={handleAddUrl} disabled={uploading || !inputUrl} size="sm" className="w-full">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add Link
                    </Button>
                  </div>
                )}

                {addingMode === "text" && (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3 relative group">
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-6 w-6 text-muted-foreground" onClick={() => setAddingMode("none")}>
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="text-sm font-semibold">Raw Text</p>
                    <Input 
                      placeholder="Title (optional)" 
                      value={inputTitle} 
                      onChange={e => setInputTitle(e.target.value)} 
                      className="h-9 text-sm"
                    />
                    <Textarea 
                      placeholder="Paste your text here..." 
                      value={inputText} 
                      onChange={e => setInputText(e.target.value)} 
                      className="min-h-[100px] text-sm resize-y"
                    />
                    <Button onClick={handleAddText} disabled={uploading || !inputText} size="sm" className="w-full">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Text
                    </Button>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  {(sources || []).map((s: NotebookSource) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm hover:border-primary/30 group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <a
                          href={s.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium truncate hover:underline"
                        >
                          {s.name}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                        onClick={() => handleDeleteSource(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Action / Chat Column */}
            <div className="md:col-span-3 flex flex-col h-full min-w-0">
               {/* Fixed Action Panel */}
               <div className="p-4 shrink-0 bg-primary/5 border-b border-primary/20 flex flex-col sm:flex-row gap-4 justify-between items-center z-10 w-full relative">
                  <div>
                    <h3 className="font-bold flex items-center gap-2 text-primary">
                      <Headphones className="h-4 w-4" /> Content Actions
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                    <Button
                      onClick={handleGenerateStudyGuide}
                      disabled={generatingGuide || (sources || []).length === 0}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {generatingGuide ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
                      Generate Guide
                    </Button>

                    {audioUrl ? (
                      <audio controls className="h-8 w-full sm:w-64 outline-none" src={audioUrl}>
                        Your browser does not support the audio element.
                      </audio>
                    ) : (
                      <Button
                        onClick={handleGenerateAudio}
                        disabled={generatingAudio || (sources || []).length === 0}
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        {generatingAudio ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Generate Audio Briefing
                      </Button>
                    )}
                  </div>
               </div>

               {/* Chat Display Area */}
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 w-full custom-scrollbar relative">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground w-full px-4 max-w-sm mx-auto text-center">
                      <Sparkles className="h-10 w-10 mb-4 opacity-30 text-primary" />
                      <p className="mb-2 font-medium text-foreground text-lg">AI Assistant Ready</p>
                      <p className="text-sm">Upload sources and start asking questions. The AI will synthesize answers directly from your documents.</p>
                    </div>
                  ) : (
                    <div className="space-y-6 w-full pr-2">
                       {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end lg:pr-8" : "justify-start lg:pl-8"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm md:text-base leading-relaxed ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted rounded-tl-sm text-foreground border border-border"
                            }`}
                          >
                            {msg.text.split("\n").map((line, j) => (
                              <p key={j} className={j > 0 ? "mt-3" : ""}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                      {chatting && (
                        <div className="flex justify-start lg:pl-8 mt-4">
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-5 py-3.5 text-foreground flex items-center gap-3 border border-border">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="text-sm font-medium">Synthesizing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
               </div>

               {/* Separated Input Bar Container */}
               <div className="w-full bg-background border-t border-border shrink-0 p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChat();
                    }}
                    className="flex relative items-center max-w-4xl mx-auto"
                  >
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder={(sources || []).length > 0 ? "Ask a question..." : "Upload a source first..."}
                      disabled={(sources || []).length === 0 || chatting}
                      className="pr-14 h-14 w-full rounded-2xl bg-muted/30 border-border focus-visible:ring-1 focus-visible:ring-primary/50"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!chatMessage.trim() || (sources || []).length === 0 || chatting}
                      className="absolute right-2 h-10 w-10 rounded-xl shadow-md"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
               </div>
            </div>
          </div>
        </div>
    </div>
  );
}
