import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const Owl = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path d="M10 14 L14 6 L19 12 Q24 10 29 12 L34 6 L38 14 Q42 22 40 32 Q36 42 24 42 Q12 42 8 32 Q6 22 10 14Z" fill="hsl(var(--primary))" />
    <ellipse cx="24" cy="33" rx="9" ry="7" fill="hsl(var(--primary-foreground))" opacity=".85" />
    <circle cx="17.5" cy="21" r="6" fill="hsl(var(--primary-foreground))" /><circle cx="30.5" cy="21" r="6" fill="hsl(var(--primary-foreground))" />
    <circle cx="18.5" cy="21.5" r="2.8" fill="hsl(var(--foreground))" /><circle cx="29.5" cy="21.5" r="2.8" fill="hsl(var(--foreground))" />
    <circle cx="19.3" cy="20.5" r=".9" fill="#fff" /><circle cx="30.3" cy="20.5" r=".9" fill="#fff" />
    <path d="M22 26 L24 29.5 L26 26Z" fill="hsl(var(--accent))" />
  </svg>
);

export const AIChatWidget = () => {
  const [open, setOpen] = useState(false);
  const GREETING: Msg = { role: "assistant", content: "Hello, I'm **MakerGPT**, your Imagemakers study helper. Tell me the subject and the topic, and I will explain it step by step so you can solve it yourself." };
  const [messages, setMessages] = useState<Msg[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem("wiz-chat") || "[]"); if (Array.isArray(saved) && saved.length) return saved; } catch { /* ignore */ }
    return [GREETING];
  });
  useEffect(() => { try { localStorage.setItem("wiz-chat", JSON.stringify(messages.slice(-40))); } catch { /* ignore */ } }, [messages]);
  const clearChat = () => { localStorage.removeItem("wiz-chat"); setMessages([GREETING]); };
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const openTutor = () => setOpen(true);
    window.addEventListener("imagemakers-open-ai", openTutor);
    return () => window.removeEventListener("imagemakers-open-ai", openTutor);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        upsertAssistant("Please sign in again before using the AI Tutor.");
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: [...messages.slice(1).slice(-20), userMsg].map((m) => ({ role: m.role, content: m.content })),
          type: "homework",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Something went wrong" }));
        upsertAssistant(err.error || "Sorry, I'm having trouble right now. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!resp.body) {
        upsertAssistant("Sorry, I couldn't get a response. Please try again.");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || raw.trim() === "" || !raw.startsWith("data: ")) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      upsertAssistant("Oops! Something went wrong. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-28 md:bottom-8 right-4 md:right-8 z-50 w-16 h-16 rounded-full bg-card border-2 border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300 grid place-items-center hover:-translate-y-1 hover:rotate-[-6deg] active:scale-95"
          aria-label="Open MakerGPT"
        >
          <Owl className="w-12 h-12" />
        </button>

      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-28 md:bottom-8 right-4 md:right-8 z-50 w-[calc(100vw-2rem)] max-w-[380px] h-[min(520px,75vh)] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-card"><Owl className="h-8 w-8" /></span>
              <div>
                <p className="font-bold text-sm">MakerGPT</p>
                <p className="text-[10px] opacity-80">Hints, not answers · remembers our chat</p>
              </div>
            </div>
            <button onClick={clearChat} className="ml-auto mr-1 rounded-lg px-2 py-1 text-[10px] font-bold hover:bg-primary-foreground/20">New chat</button>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-primary-foreground/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef as any}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Owl className="w-6 h-6" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {msg.content.replace(/\\\[([\s\S]*?)\\\]/g, (_m, x) => `$$${x}$$`).replace(/\\\(([\s\S]*?)\\\)/g, (_m, x) => `$${x}$`)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Owl className="w-6 h-6" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What are you stuck on?"
                className="flex-1 rounded-xl text-sm"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
