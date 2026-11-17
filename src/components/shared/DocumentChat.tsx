import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DocumentChatProps {
  documentUrl: string;
  documentTitle: string;
  documentType: string;
  id: number | string;
}

// Set VITE_CHAT_WEBHOOK_URL to point at a different n8n flow without changing code.
const CHAT_URL =
  import.meta.env.VITE_CHAT_WEBHOOK_URL ?? "https://n8n.arokolabs.com/webhook/8ad47f16-6e98-404c-9cda-f4bacdb9bd17";
const SUGGESTIONS = ["Summarize the key points", "What are the main findings?", "Explain the budget allocation"];
const EASE = "transition-all duration-200 ease-out";

const DocumentChat = ({ documentUrl, documentTitle, documentType, id }: DocumentChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), [messages, loading]);

  const send = async (text: string, history: Message[]) => {
    setLoading(true);
    setFailed(null);
    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentURL: documentUrl,
          text,
          history: history.slice(-6).map(({ role, content }) => ({ role, content })),
          documentName: documentTitle,
          documentType,
          documentId: id,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.text();
      let answer = raw;
      try {
        const data = JSON.parse(raw);
        answer = Array.isArray(data) && data[0]?.output ? data[0].output : typeof data === "string" ? data : raw;
      } catch {
        /* plain text reply */
      }
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: answer || "No answer came back." }]);
    } catch {
      setFailed(text);
    } finally {
      setLoading(false);
    }
  };

  const submit = (e?: React.FormEvent, preset?: string) => {
    e?.preventDefault();
    const text = (preset ?? input).trim();
    if (!text || loading) return;
    const next = [...messages, { id: crypto.randomUUID(), role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    send(text, next.slice(0, -1));
  };

  return (
    <section aria-labelledby="chat-heading" className="flex h-full min-h-[480px] flex-col">
      <h2 id="chat-heading" className="display-condensed font-display text-3xl font-extrabold leading-none tracking-tight">
        Ask this document
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">Answers come only from this document, not from the wider web.</p>

      <div role="log" aria-live="polite" className="mt-4 flex-1 space-y-6 overflow-y-auto border-y border-border py-5">
        {messages.length === 0 && (
          <div>
            <p className="text-sm text-muted-foreground">Try one of these, or write your own question.</p>
            <ul className="mt-3 space-y-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button onClick={() => submit(undefined, s)} className={`text-left font-medium text-primary underline decoration-gold decoration-2 underline-offset-4 hover:text-foreground ${EASE}`}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id}>
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{m.role === "user" ? "You" : "Answer"}</p>
            <p className={`mt-1 whitespace-pre-wrap ${m.role === "user" ? "font-display text-lg font-semibold" : ""}`}>{m.content}</p>
          </div>
        ))}
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Reading the document
          </p>
        )}
        {failed && (
          <div>
            <p className="font-medium">We could not get an answer.</p>
            <button
              onClick={() => send(failed, messages.slice(0, -1))}
              className={`mt-1 text-sm font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 ${EASE}`}
            >
              Try again
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className={`mt-4 flex items-end gap-3 border-b-2 border-border focus-within:border-gold ${EASE}`}>
        <label htmlFor="chat-input" className="sr-only">Your question</label>
        <textarea
          id="chat-input"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(e); }}
          placeholder="Ask a question"
          disabled={loading}
          className="max-h-32 min-w-0 flex-1 resize-none bg-transparent py-3 font-display text-lg placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`inline-flex items-center gap-2 bg-gold px-4 py-2.5 font-semibold text-gold-foreground hover:gap-3 hover:bg-gold/90 disabled:opacity-40 ${EASE}`}
        >
          Ask <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
};

export default DocumentChat;
