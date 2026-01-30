import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText, ExternalLink } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  sources?: { title: string; id: string }[];
}

const examplePrompts = [
  "What was Nigeria's budget for health in 2024?",
  "Summarize the 2024 Appropriation Act",
  "What are the key highlights of the latest MTEF?",
  "How much was allocated to education in 2023?",
];

const AISearch = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Based on my analysis of the available public documents, here's what I found regarding "${message}":\n\nThe 2024 Federal Budget allocates significant resources across various sectors. The health sector received approximately ₦1.33 trillion, representing about 4.6% of the total budget. This includes allocations for primary healthcare, hospital infrastructure, and disease control programs.\n\nKey budget items include:\n• Primary Healthcare Development: ₦420 billion\n• Hospital Infrastructure: ₦280 billion\n• Disease Prevention Programs: ₦180 billion\n• Medical Equipment & Supplies: ₦150 billion\n\nThis represents a 12% increase from the 2023 allocation.`,
        sources: [
          { title: "2024 Federal Republic of Nigeria Appropriation Act", id: "1" },
          { title: "Health Sector MTSS 2024-2026", id: "3" },
        ],
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <section className="bg-card border-b border-border py-6 shrink-0">
          <div className="container-custom">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-6 w-6 text-accent" />
              <h1 className="font-display text-2xl font-bold text-foreground">
                AI-Powered Search
              </h1>
            </div>
            <p className="text-muted-foreground">
              Ask natural language questions about Nigeria's public documents
            </p>
          </div>
        </section>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container-custom py-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero mb-6">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                  What would you like to know?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Ask questions about budgets, fiscal policies, CBN circulars, and more.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(prompt)}
                      className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-soft transition-all duration-200 text-sm text-muted-foreground hover:text-foreground"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border"
                      }`}
                    >
                      <p
                        className={`text-sm whitespace-pre-wrap ${
                          message.type === "assistant" ? "text-foreground" : ""
                        }`}
                      >
                        {message.content}
                      </p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">
                            Sources:
                          </p>
                          <div className="space-y-2">
                            {message.sources.map((source) => (
                              <Link
                                key={source.id}
                                to={`/documents/${source.id}`}
                                className="flex items-center gap-2 text-xs text-accent hover:underline"
                              >
                                <FileText className="h-3 w-3" />
                                {source.title}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Searching documents...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-border bg-card py-4">
          <div className="container-custom">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about public documents..."
                  className="flex-1 h-12 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                AI responses are generated from available documents. Always verify with original sources.
              </p>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AISearch;
