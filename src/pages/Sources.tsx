import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SOURCES_URL, useSources, type SourceStatus } from "@/hooks/useSources";

const EASE = "transition-all duration-200 ease-out";
const link = `font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 ${EASE}`;
const PAGE = 25;

const STATUS: Record<SourceStatus, { label: string; dot: string }> = {
  OK: { label: "Reachable", dot: "bg-primary" },
  REDIRECT: { label: "Redirects elsewhere", dot: "bg-gold" },
  BLOCKED: { label: "Blocks automated access", dot: "bg-gold" },
  SERVER_ERROR: { label: "Server error", dot: "bg-destructive" },
  NOT_FOUND: { label: "Page not found", dot: "bg-destructive" },
  DOWN: { label: "Not reachable", dot: "bg-destructive" },
  UNKNOWN: { label: "Not checked yet", dot: "bg-muted-foreground" },
};

const PRINCIPLES = [
  "Every document links back to the official page it came from.",
  "We read a source's terms of use before collecting from it.",
  "A source only joins our regular updates after we have tested it from start to finish.",
  "AI summaries and answers are labelled, and point to the documents they came from.",
];

const formatDate = (v: string | null) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "n/a";
};
const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

const Sources = () => {
  const { data = [], isLoading, isError, refetch } = useSources();
  const [tab, setTab] = useState<"use" | "watch">("use");
  const [find, setFind] = useState("");
  const [shown, setShown] = useState(PAGE);

  const inUse = data.filter((s) => s.inUse);
  const watching = data.filter((s) => !s.inUse);
  const reachable = data.filter((s) => s.status === "OK").length;
  const last = useMemo(
    () => data.map((s) => s.lastChecked).filter(Boolean).sort().pop() ?? null,
    [data],
  );
  const list = (tab === "use" ? inUse : watching).filter((s) => `${s.name} ${s.url}`.toLowerCase().includes(find.toLowerCase()));
  const facts = [
    ["Sources registered", data.length],
    ["Used in CivicLens now", inUse.length],
    ["Reachable at last check", reachable],
    ["Last checked", formatDate(last)],
  ];
  const tabBtn = (on: boolean) => `border-b-2 px-1 py-1 text-sm font-medium ${EASE} ${on ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`;

  return (
    <Layout>
      <div className="container-custom grid gap-12 py-14 md:grid-cols-12">
        <header className="md:col-span-4">
          <h1 className="display-condensed font-display text-6xl font-extrabold leading-none tracking-tight md:text-7xl">Sources</h1>
          <p className="mt-4 max-w-xs text-muted-foreground">Where every document and number in CivicLens comes from, and whether we can still reach it.</p>
          {data.length > 0 && (
            <dl className="mt-10 divide-y divide-border border-y border-border">
              {facts.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between py-3">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="font-mono text-xl font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        <div className="md:col-span-8">
          <section aria-labelledby="how-heading">
            <h2 id="how-heading" className="font-display text-2xl font-bold">How we source</h2>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {PRINCIPLES.map((p) => <li key={p} className="py-3">{p}</li>)}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              "Reachable" means the website answered when we last checked. It does not mean we have collected from it, or that what it holds is correct. Found a problem? <Link to="/privacy" className={link}>Contact us</Link>.
            </p>
          </section>

          <section aria-labelledby="list-heading" className="mt-14">
            <h2 id="list-heading" className="font-display text-2xl font-bold">The sources</h2>

            {!SOURCES_URL && (
              <div className="mt-4 border-l-4 border-gold pl-4">
                <p className="font-semibold">The source list is not switched on yet.</p>
                <p className="mt-1 text-muted-foreground">It will appear here once it is connected.</p>
              </div>
            )}
            {isLoading && SOURCES_URL && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="mt-px h-20 rounded-none" />)}
            {isError && (
              <div className="mt-4">
                <p className="font-medium">We could not load the sources.</p>
                <Button className="mt-3" size="sm" onClick={() => refetch()}>Try again</Button>
              </div>
            )}

            {data.length > 0 && (
              <>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div className="flex gap-6" role="group" aria-label="Which sources">
                    <button aria-pressed={tab === "use"} onClick={() => { setTab("use"); setShown(PAGE); }} className={tabBtn(tab === "use")}>In use ({inUse.length})</button>
                    <button aria-pressed={tab === "watch"} onClick={() => { setTab("watch"); setShown(PAGE); }} className={tabBtn(tab === "watch")}>Being qualified ({watching.length})</button>
                  </div>
                  <label className="sr-only" htmlFor="find-source">Search sources</label>
                  <input id="find-source" value={find} onChange={(e) => { setFind(e.target.value); setShown(PAGE); }} placeholder="Search sources"
                    className={`border-b-2 border-border bg-transparent py-1 focus:border-gold focus:outline-none ${EASE}`} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {tab === "use" ? "We hold documents or figures from these sources." : "On our list, but we have not started collecting from them. Each one is tested first."}
                </p>

                <ul className="mt-4 divide-y divide-border border-y border-border">
                  {list.slice(0, shown).map((s) => (
                    <li key={s.id} className="grid gap-x-6 gap-y-1 py-5 md:grid-cols-[1fr_auto] md:items-baseline">
                      <div className="min-w-0">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-display text-xl font-semibold underline-offset-4 hover:underline">{s.name}</a>
                        <p className="font-mono text-xs text-muted-foreground">{host(s.url)}{s.kind ? `, ${s.kind}` : ""}</p>
                      </div>
                      <p className="flex items-center gap-2 text-sm">
                        <span className={`h-2.5 w-2.5 rounded-full ${STATUS[s.status].dot}`} aria-hidden="true" />
                        {STATUS[s.status].label}
                        <span className="font-mono text-xs text-muted-foreground">{formatDate(s.lastChecked)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
                {list.length === 0 && <p className="mt-4 text-muted-foreground">No sources match.</p>}
                {list.length > shown && (
                  <button onClick={() => setShown((n) => n + PAGE)} className={`mt-5 ${link}`}>Show more ({list.length - shown} left)</button>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Sources;
