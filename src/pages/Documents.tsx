import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentStats } from "@/hooks/useDocumentStats";

type Doc = { [key: string]: string };
type Sort = "newest" | "oldest" | "title";

const PER_PAGE = 12;
const DAY = 86_400_000;
const EASE = "transition-all duration-200 ease-out";
const link = `font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 ${EASE}`;

const yearOf = (d: Doc) => new Date(d["Date Published"]).getFullYear();
const formatDate = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const pageList = (page: number, total: number) => {
  const out: (number | "gap")[] = [1];
  const start = Math.max(2, page - 2), end = Math.min(total - 1, page + 2);
  if (start > 2) out.push("gap");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("gap");
  if (total > 1) out.push(total);
  return out;
};

const Documents = () => {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [allYears, setAllYears] = useState(false);
  const { data = [], isLoading, isError, refetch } = useDocuments();
  const { categoriesWithCounts } = useDocumentStats();
  const documents = data as Doc[];

  const q = params.get("q") ?? "";
  const category = params.get("category");
  const year = params.get("year") ? Number(params.get("year")) : null;
  const source = params.get("source");
  const sort = (params.get("sort") as Sort) ?? "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);

  // Changing any filter goes back to page 1; everything lives in the URL so views can be shared.
  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in changes)) next.delete("page");
    setParams(next, { replace: true });
  };

  // Years and sources come from the documents, nothing is hard-coded
  const years = useMemo(() => {
    const m = new Map<number, number>();
    documents.forEach((d) => { const y = yearOf(d); if (!Number.isNaN(y)) m.set(y, (m.get(y) ?? 0) + 1); });
    return Array.from(m, ([y, n]) => ({ y, n })).sort((a, b) => b.y - a.y);
  }, [documents]);
  const sources = useMemo(() => {
    const m = new Map<string, number>();
    documents.forEach((d) => d.Source && m.set(d.Source, (m.get(d.Source) ?? 0) + 1));
    return Array.from(m, ([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }, [documents]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = documents.filter((d) => {
      if (term && ![d.Title, d.Type, d.Source].some((f) => f?.toLowerCase().includes(term))) return false;
      if (category && d.Type !== category) return false;
      if (source && d.Source !== source) return false;
      if (year && yearOf(d) !== year) return false;
      return true;
    });
    const time = (d: Doc) => new Date(d["Date Published"]).getTime() || 0;
    return list.sort((a, b) => sort === "title" ? (a.Title ?? "").localeCompare(b.Title ?? "") : sort === "oldest" ? time(a) - time(b) : time(b) - time(a));
  }, [documents, q, category, source, year, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const shown = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const active = [q && `“${q}”`, category, source, year && String(year)].filter(Boolean) as string[];
  const go = (p: number) => { set({ page: p === 1 ? null : String(p) }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const opt = (on: boolean) => `flex w-full items-baseline justify-between gap-3 border-l-2 py-1.5 pl-3 text-left text-sm hover:text-primary ${EASE} ${on ? "border-gold font-semibold text-foreground" : "border-transparent text-muted-foreground"}`;
  const group = (title: string, children: React.ReactNode) => (
    <section className="mb-8">
      <h2 className="mb-2 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );

  const filters = (
    <div>
      {group("Category", (
        <ul>
          <li><button className={opt(!category)} aria-pressed={!category} onClick={() => set({ category: null })}>All categories</button></li>
          {categoriesWithCounts.map((c) => (
            <li key={c.id}>
              <button className={opt(category === c.id)} aria-pressed={category === c.id} onClick={() => set({ category: category === c.id ? null : c.id })}>
                <span>{c.name}</span><span className="font-mono text-xs tabular-nums">{c.documentCount}</span>
              </button>
            </li>
          ))}
        </ul>
      ))}
      {group("Year", (
        <ul>
          {(allYears ? years : years.slice(0, 6)).map(({ y, n }) => (
            <li key={y}>
              <button className={opt(year === y)} aria-pressed={year === y} onClick={() => set({ year: year === y ? null : String(y) })}>
                <span className="font-mono tabular-nums">{y}</span><span className="font-mono text-xs tabular-nums">{n}</span>
              </button>
            </li>
          ))}
          {years.length > 6 && (
            <li><button onClick={() => setAllYears((v) => !v)} className={`mt-2 pl-3 text-sm ${link}`}>{allYears ? "Show fewer years" : `Show all ${years.length} years`}</button></li>
          )}
        </ul>
      ))}
      {sources.length > 1 && group("Source", (
        <ul>
          {sources.slice(0, 10).map(({ name, n }) => (
            <li key={name}>
              <button className={opt(source === name)} aria-pressed={source === name} onClick={() => set({ source: source === name ? null : name })}>
                <span>{name}</span><span className="font-mono text-xs tabular-nums">{n}</span>
              </button>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="container-custom py-12">
        <header className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <h1 className="display-condensed font-display text-6xl font-extrabold leading-none tracking-tight md:text-7xl">Documents</h1>
            <p className="mt-3 text-muted-foreground">Budgets, circulars and publications. Each one links to its official source.</p>
          </div>
          <form role="search" onSubmit={(e) => e.preventDefault()} className={`md:col-span-7 flex items-end border-b-2 border-border focus-within:border-gold ${EASE}`}>
            <label htmlFor="doc-search" className="sr-only">Search documents</label>
            <input id="doc-search" type="search" defaultValue={q} key={q} placeholder="Search by title, type or source"
              onChange={(e) => set({ q: e.target.value.trim() ? e.target.value : null })}
              className="min-w-0 flex-1 bg-transparent py-3 font-display text-2xl placeholder:text-muted-foreground focus:outline-none" />
          </form>
        </header>

        <div className="mt-10 grid gap-10 md:grid-cols-12">
          <aside className="md:col-span-3" aria-label="Filters">
            <button className={`md:hidden ${link}`} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
              {filtersOpen ? "Hide filters" : "Show filters"}
            </button>
            <div className={`${filtersOpen ? "mt-6 block" : "hidden"} md:block`}>{filters}</div>
          </aside>

          <section className="md:col-span-9" aria-label="Results">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <p className="font-mono text-sm text-muted-foreground" aria-live="polite">
                {isLoading ? "Loading" : `${results.length} of ${documents.length} documents`}
              </p>
              <div className="flex items-center gap-4">
                {active.length > 0 && (
                  <button onClick={() => setParams({}, { replace: true })} className={`inline-flex items-center gap-1 text-sm ${link}`}>
                    <X className="h-4 w-4" aria-hidden="true" />Clear {active.join(", ")}
                  </button>
                )}
                <label htmlFor="sort" className="sr-only">Sort by</label>
                <select id="sort" value={sort} onChange={(e) => set({ sort: e.target.value === "newest" ? null : e.target.value })}
                  className="border-b-2 border-border bg-transparent py-1 text-sm font-medium focus:border-gold focus:outline-none">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A to Z</option>
                </select>
              </div>
            </div>

            {isLoading && [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="mb-px h-24 rounded-none" />)}
            {isError && (
              <div className="py-8">
                <p className="font-medium">We could not load the documents.</p>
                <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
                <Button className="mt-4" size="sm" onClick={() => refetch()}>Try again</Button>
              </div>
            )}
            {!isLoading && !isError && results.length === 0 && (
              <div className="py-12">
                <p className="font-display text-2xl font-bold">No documents match.</p>
                <p className="mt-2 text-muted-foreground">Try fewer filters or a different word.</p>
                <button className={`mt-4 ${link}`} onClick={() => setParams({}, { replace: true })}>Clear all filters</button>
              </div>
            )}

            <ul className="divide-y divide-border">
              {shown.map((d) => {
                const age = Date.now() - new Date(d["Date Published"]).getTime();
                const meta = [d.Source, d.Type, formatDate(d["Date Published"]), d.fileSize].filter(Boolean).join(", ");
                return (
                  <li key={d.id} className={`grid grid-cols-[4.5rem_1fr] items-baseline gap-x-6 gap-y-2 py-6 hover:bg-secondary/60 hover:pl-3 md:grid-cols-[6rem_1fr_auto] ${EASE}`}>
                    <span className="font-mono text-2xl font-medium tabular-nums text-primary">{yearOf(d) || "n/a"}</span>
                    <div className="min-w-0">
                      <Link to={`/documents/${d.id}`} className="line-clamp-2 font-display text-xl font-semibold leading-snug underline-offset-4 hover:underline md:text-2xl">{d.Title}</Link>
                      {age >= 0 && age <= 30 * DAY && (
                        <span title="Published in the last 30 days" className="ml-3 rounded-sm bg-gold px-1.5 py-0.5 align-middle font-mono text-[11px] font-medium uppercase text-gold-foreground">New</span>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
                    </div>
                    <div className="col-span-2 flex items-center gap-6 md:col-span-1">
                      <Link to={`/documents/${d.id}`} className={`inline-flex items-center gap-2 hover:gap-3 ${link}`}>Open <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                      {d["Document URL"] && (
                        <a href={d["Document URL"]} target="_blank" rel="noopener noreferrer" className="font-medium text-muted-foreground underline underline-offset-4 hover:text-primary">
                          Download<span className="sr-only">: {d.Title}</span>
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 && (
              <nav className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6" aria-label="Pages">
                <button disabled={current === 1} onClick={() => go(current - 1)} className={`${link} disabled:opacity-40 disabled:no-underline`}>Previous</button>
                <ul className="flex items-center gap-1 font-mono text-sm">
                  {pageList(current, totalPages).map((p, i) => p === "gap"
                    ? <li key={`g${i}`} className="px-2 text-muted-foreground" aria-hidden="true">…</li>
                    : <li key={p}><button onClick={() => go(p)} aria-current={p === current ? "page" : undefined}
                        className={`min-w-9 border-b-2 px-2 py-1 tabular-nums ${EASE} ${p === current ? "border-gold font-bold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{p}</button></li>)}
                </ul>
                <button disabled={current === totalPages} onClick={() => go(current + 1)} className={`${link} disabled:opacity-40 disabled:no-underline`}>Next</button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Documents;
