import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";

/**
 * AI Search is built and waiting for its backend.
 *
 * Switch it on by setting VITE_AI_SEARCH_URL to an n8n webhook (or any endpoint) that accepts
 *   POST { question: string, history: [{ role: "user" | "assistant", content: string }] }
 * and replies with
 *   { answer: string, sources: [{ id?, title, type?, source?, date?, url? }] }
 * Also understood: [{ output: "..." }], { text }, and "citations" in place of "sources".
 * Until the setting exists, the page shows a clear "not switched on yet" note and sends nothing.
 * No answer on this page is ever made up.
 */
const AI_URL: string | undefined = import.meta.env.VITE_AI_SEARCH_URL || undefined;
const LIVE = Boolean(AI_URL);
const EASE = "transition-all duration-200 ease-out";
const link = `font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 ${EASE}`;
const EXAMPLES = [
  "How much did the 2024 budget allocate to health?",
  "What changed in the latest MTEF?",
  "Which circulars were issued this year?",
  "Summarise the 2024 Appropriation Act",
];

interface Source { id?: string; title: string; type?: string; source?: string; date?: string; url?: string }
interface Turn { id: string; question: string; status: "loading" | "done" | "error"; answer?: string; sources?: Source[] }

/* eslint-disable @typescript-eslint/no-explicit-any */
const parse = (raw: string): { answer: string; sources: Source[] } => {
  let d: any = raw;
  try { d = JSON.parse(raw); } catch { /* plain text */ }
  if (Array.isArray(d)) d = d[0];
  if (typeof d === "string") return { answer: d, sources: [] };
  const list = d?.sources ?? d?.citations ?? [];
  return {
    answer: String(d?.answer ?? d?.output ?? d?.text ?? ""),
    sources: (Array.isArray(list) ? list : []).map((s: any) => ({
      id: s.id ?? s.documentId,
      title: s.title ?? s.Title ?? s.name ?? "Untitled document",
      type: s.type ?? s.Type,
      source: s.source ?? s.Source,
      date: s["Date Published"] ?? s.date,
      url: s.url ?? s["Document URL"],
    })),
  };
};

const year = (d?: string) => { const y = d ? new Date(d).getFullYear() : NaN; return Number.isNaN(y) ? "" : String(y); };

const AISearch = () => {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const busy = turns.some((t) => t.status === "loading");

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), [turns]);

  const ask = async (question: string, id: string = crypto.randomUUID(), prior: Turn[] = turns) => {
    if (!LIVE || !question.trim()) return;
    setTurns([...prior, { id, question, status: "loading" }]);
    setInput("");
    const history = prior.filter((t) => t.status === "done").slice(-4)
      .flatMap((t) => [{ role: "user", content: t.question }, { role: "assistant", content: t.answer ?? "" }]);
    try {
      const response = await fetch(AI_URL as string, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, history }) });
      if (!response.ok) throw new Error(String(response.status));
      const { answer, sources } = parse(await response.text());
      if (!answer.trim()) throw new Error("empty");
      setTurns([...prior, { id, question, status: "done", answer, sources }]);
    } catch {
      setTurns([...prior, { id, question, status: "error" }]);
    }
  };

  return (
    <Layout>
      <div className="container-custom grid gap-12 py-14 md:grid-cols-12">
        <div className="md:col-span-8">
          <header>
            <h1 className="display-condensed font-display text-6xl font-extrabold leading-none tracking-tight md:text-8xl">Ask CivicLens</h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Ask a question about Nigeria's public documents. Every answer shows the documents it came from.
            </p>
          </header>

          {!LIVE && (
            <div className="mt-8 max-w-xl border-l-4 border-gold pl-4">
              <p className="font-semibold">AI Search is not switched on yet.</p>
              <p className="mt-1 text-muted-foreground">
                For now, <Link to="/documents" className={link}>search the documents</Link>, or open any document and ask it questions.
              </p>
            </div>
          )}

          <form role="search" onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className={`mt-10 flex items-end gap-4 border-b-2 border-border focus-within:border-gold ${EASE} ${LIVE ? "" : "opacity-60"}`}>
            <label htmlFor="ask" className="sr-only">Your question</label>
            <input id="ask" value={input} onChange={(e) => setInput(e.target.value)} disabled={!LIVE || busy}
              placeholder="Ask a question" className="min-w-0 flex-1 bg-transparent py-3 font-display text-3xl placeholder:text-muted-foreground focus:outline-none" />
            <button type="submit" disabled={!LIVE || busy || !input.trim()}
              className={`inline-flex items-center gap-2 bg-gold px-5 py-3 font-semibold text-gold-foreground hover:gap-3 hover:bg-gold/90 disabled:opacity-40 ${EASE}`}>
              Ask <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          {turns.length === 0 && (
            <div className="mt-8">
              <p className="text-sm text-muted-foreground">Questions you could ask</p>
              <ul className="mt-3 space-y-2">
                {EXAMPLES.map((e) => (
                  <li key={e}>
                    <button onClick={() => (LIVE ? ask(e) : setInput(e))} className={`text-left font-display text-xl font-semibold ${link}`}>{e}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-12 space-y-14" role="log" aria-live="polite">
            {turns.map((t) => (
              <article key={t.id} aria-label={t.question}>
                <h2 className="font-display text-2xl font-bold leading-snug md:text-3xl">{t.question}</h2>
                {t.status === "loading" && (
                  <p className="mt-4 flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching the library
                  </p>
                )}
                {t.status === "error" && (
                  <div className="mt-4">
                    <p className="font-medium">We could not get an answer.</p>
                    <button className={`mt-1 text-sm ${link}`} onClick={() => ask(t.question, t.id, turns.slice(0, turns.indexOf(t)))}>Try again</button>
                  </div>
                )}
                {t.status === "done" && (
                  <>
                    <p className="mt-4 max-w-prose whitespace-pre-wrap leading-relaxed">{t.answer}</p>
                    {t.sources && t.sources.length > 0 ? (
                      <section aria-label="Sources" className="mt-6">
                        <h3 className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Sources</h3>
                        <ul className="mt-2 divide-y divide-border border-y border-border">
                          {t.sources.map((s, i) => {
                            const meta = [s.source, s.type].filter(Boolean).join(", ");
                            const inner = (
                              <>
                                <span className="font-mono text-lg tabular-nums text-primary">{year(s.date)}</span>
                                <span className="min-w-0">
                                  <span className="line-clamp-2 block font-display text-lg font-semibold">{s.title}</span>
                                  {meta && <span className="block text-sm text-muted-foreground">{meta}</span>}
                                </span>
                                <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
                              </>
                            );
                            const row = `grid grid-cols-[4rem_1fr_auto] items-baseline gap-x-4 py-4 hover:pl-3 ${EASE}`;
                            return (
                              <li key={`${s.title}-${i}`}>
                                {s.id ? <Link to={`/documents/${s.id}`} className={row}>{inner}</Link>
                                  : s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className={row}>{inner}</a>
                                  : <div className={row}>{inner}</div>}
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ) : (
                      <p className="mt-4 text-sm font-medium">This answer came without sources, so check it before you rely on it.</p>
                    )}
                  </>
                )}
              </article>
            ))}
            <div ref={endRef} />
          </div>
        </div>

        <aside className="md:col-span-4" aria-label="How answers work">
          <div className="md:sticky md:top-24">
            <h2 className="display-condensed font-display text-3xl font-extrabold leading-none tracking-tight">How answers work</h2>
            <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
              <li className="py-4">Answers are drawn only from the documents in this library.</li>
              <li className="py-4">Each answer lists the documents it used. Open one to read the original.</li>
              <li className="py-4 text-muted-foreground">AI can make mistakes. For anything official, check the source document.</li>
            </ul>
          </div>
        </aside>
      </div>
    </Layout>
  );
};

export default AISearch;
