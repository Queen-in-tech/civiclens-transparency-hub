import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import AdireCloth from "@/components/shared/AdireCloth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService, type IndicatorObservation } from "@/data/apiService";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentStats } from "@/hooks/useDocumentStats";

const POPULAR = ["2024 Budget", "MTEF", "CBN Circular", "Health Sector"];
const DAY = 86_400_000;

/* ---------- The numbers: live Nigeria figures from the indicators API ---------- */

interface TileSpec {
  label: string;
  match: RegExp;
  format: (value: number) => string;
  stroke: string;
}

const percent = (v: number) => `${v.toFixed(1)}%`;
const TILES: TileSpec[] = [
  { label: "GDP growth", match: /gdp growth|\.KD\.ZG/i, format: percent, stroke: "stroke-primary" },
  { label: "Inflation", match: /inflation|\.CPI\./i, format: percent, stroke: "stroke-accent" },
  {
    label: "Population",
    match: /population,? total|\.POP\.TOTL/i,
    format: (v) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v),
    stroke: "stroke-muted-foreground",
  },
];

const isNigeria = (o: IndicatorObservation) =>
  ["NGA", "NG"].includes((o.country_code ?? "").toUpperCase()) || /nigeria/i.test(o.country_name ?? "");
const isProjected = (o: IndicatorObservation) => /pred|projection|forecast/i.test(o.obs_status ?? "");

const sparkPoints = (values: number[], w = 96, h = 32) => {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  return values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`)
    .join(" ");
};

const useNigeriaTiles = () => {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["indicator-observations"],
    queryFn: apiService.getIndicatorObservations,
    staleTime: 5 * 60 * 1000,
  });

  const tiles = useMemo(() => {
    const series = new Map<string, IndicatorObservation[]>();
    data.forEach((o) => {
      if (!isNigeria(o) || o.value === null || !Number.isFinite(o.value) || isProjected(o)) return;
      const key = `${o.source_id ?? ""}:${o.indicator_code}`;
      series.set(key, [...(series.get(key) ?? []), o]);
    });
    return TILES.flatMap((spec) => {
      const rows = Array.from(series.values()).find((r) => spec.match.test(`${r[0].indicator_name} ${r[0].indicator_code}`));
      if (!rows) return [];
      const sorted = [...rows].sort((a, b) => a.period - b.period).slice(-11);
      const latest = sorted[sorted.length - 1];
      return [{ spec, period: latest.period, value: latest.value as number, values: sorted.map((r) => r.value as number) }];
    });
  }, [data]);

  return { tiles, isLoading, isError };
};

/* ---------- Page ---------- */

const formatDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { categoriesWithCounts, totalDocuments, documents } = useDocumentStats();
  const { isLoading: docsLoading, isError: docsError, refetch } = useDocuments();
  const { tiles, isLoading: tilesLoading } = useNigeriaTiles();

  const latest = useMemo(
    () =>
      documents
        .filter((d: { [key: string]: string }) => !Number.isNaN(new Date(d["Date Published"]).getTime()))
        .sort(
          (a: { [key: string]: string }, b: { [key: string]: string }) =>
            new Date(b["Date Published"]).getTime() - new Date(a["Date Published"]).getTime(),
        )
        .slice(0, 5),
    [documents],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/documents?q=${encodeURIComponent(q)}` : "/documents");
  };

  return (
    <Layout>
      {/* Hero: indigo field with adire cloth on the right */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-full opacity-30 md:w-[52%] md:opacity-100">
          <AdireCloth className="adire-cloth h-full w-full" />
        </div>
        <div className="container-custom relative pb-16 pt-14 md:pb-24 md:pt-20">
          <h1 className="max-w-[11em] font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
            Nigeria's public documents and numbers, in one place.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
            Search budgets, circulars and indicators. Every page links back to the official source it came from.
          </p>

          <form
            role="search"
            onSubmit={submit}
            className="mt-8 flex max-w-2xl overflow-hidden rounded-md bg-card shadow-medium focus-within:ring-2 focus-within:ring-gold"
          >
            <label htmlFor="home-search" className="sr-only">
              Search documents
            </label>
            <input
              id="home-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, for example 2024 budget"
              className="h-14 min-w-0 flex-1 bg-transparent px-5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="m-1.5 inline-flex items-center gap-2 rounded bg-gold px-5 font-semibold text-gold-foreground transition-colors hover:bg-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </button>
          </form>

          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/85">
            <span>Popular:</span>
            {POPULAR.map((term) => (
              <Link
                key={term}
                to={`/documents?q=${encodeURIComponent(term)}`}
                className="py-1 font-medium text-gold underline underline-offset-4 hover:text-primary-foreground"
              >
                {term}
              </Link>
            ))}
          </p>
          {totalDocuments > 0 && (
            <p className="mt-6 text-sm text-primary-foreground/75">
              {totalDocuments} documents, each linked to its official source.
            </p>
          )}
        </div>
      </section>

      <div className="container-custom">
        {/* Browse by type */}
        <section aria-labelledby="types-heading" className="pt-12">
          <h2 id="types-heading" className="font-display text-2xl font-bold md:text-3xl">
            Browse by type
          </h2>
          <ul className="mt-5 flex flex-wrap gap-3">
            {categoriesWithCounts.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/documents?category=${encodeURIComponent(c.id)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-medium text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {c.name}
                  {totalDocuments > 0 && <span className="text-sm text-muted-foreground">{c.documentCount}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* The numbers */}
        <section aria-labelledby="numbers-heading" className="pt-12">
          <h2 id="numbers-heading" className="font-display text-2xl font-bold md:text-3xl">
            The numbers
          </h2>
          <p className="mt-1 text-muted-foreground">Latest figures for Nigeria. Open Indicators to compare more series.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {tilesLoading &&
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] rounded" />)}
            {!tilesLoading &&
              tiles.map(({ spec, period, value, values }) => (
                <Link
                  key={spec.label}
                  to="/indicators"
                  aria-label={`${spec.label}: ${spec.format(value)} in ${period}. Open indicators.`}
                  className="flex items-center justify-between gap-4 rounded border border-border bg-card px-5 py-4 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span>
                    <span className="block text-sm text-muted-foreground">{spec.label}</span>
                    <span className="block font-display text-3xl font-bold text-foreground">{spec.format(value)}</span>
                    <span className="block text-sm text-muted-foreground">Year {period}</span>
                  </span>
                  <svg viewBox="0 0 96 32" width="96" height="32" aria-hidden="true">
                    <polyline
                      points={sparkPoints(values)}
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={spec.stroke}
                    />
                  </svg>
                </Link>
              ))}
            {!tilesLoading && tiles.length === 0 && (
              <Link to="/indicators" className="rounded border border-border bg-card px-5 py-4 font-medium text-primary underline underline-offset-4 md:col-span-3">
                See all indicators
              </Link>
            )}
          </div>
        </section>

        {/* Latest documents */}
        <section aria-labelledby="latest-heading" className="py-12">
          <h2 id="latest-heading" className="font-display text-2xl font-bold md:text-3xl">
            Latest documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">A gold edge means published in the last 30 days.</p>

          {docsLoading && (
            <div className="mt-5 space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px] rounded-none" />)}
            </div>
          )}
          {docsError && (
            <div className="mt-5 rounded border border-border bg-card p-5">
              <p className="font-medium">We could not load the documents.</p>
              <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
              <Button className="mt-3" size="sm" onClick={() => refetch()}>Try again</Button>
            </div>
          )}
          {!docsLoading && !docsError && latest.length === 0 && (
            <p className="mt-5 rounded border border-border bg-card p-5 text-muted-foreground">
              No documents yet. They appear here as soon as they are added to the library.
            </p>
          )}
          <ul className="mt-5 space-y-2">
            {latest.map((doc: { [key: string]: string }) => {
              const published = new Date(doc["Date Published"]);
              const age = Date.now() - published.getTime();
              const isNew = age >= 0 && age <= 30 * DAY;
              const meta = [doc.Source, doc.Type, formatDate(doc["Date Published"])].filter(Boolean).join(", ");
              return (
                <li
                  key={doc.id}
                  className={`grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2 border-l-[6px] bg-card px-5 py-4 md:grid-cols-[6.5rem_1fr_auto] ${
                    isNew ? "border-gold" : "border-primary"
                  }`}
                >
                  <span className="font-display text-3xl font-extrabold leading-none text-primary md:text-4xl">
                    {published.getFullYear()}
                  </span>
                  <div className="min-w-0">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="line-clamp-2 font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {doc.Title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{meta}</p>
                  </div>
                  {doc["Document URL"] && (
                    <a
                      href={doc["Document URL"]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="col-span-2 py-1 font-medium text-primary underline underline-offset-4 md:col-span-1"
                    >
                      Download<span className="sr-only">: {doc.Title}</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-4">
            <Link to="/documents" className="font-medium text-primary underline underline-offset-4">
              Browse all documents
            </Link>
          </p>
        </section>
      </div>

      {/* Alerts and document chat */}
      <section className="bg-secondary py-12">
        <div className="container-custom grid gap-6 md:grid-cols-2">
          <div className="rounded border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Get alerts</h2>
            <p className="mt-2 text-muted-foreground">Get notified when new documents are added.</p>
            <Button className="mt-4" asChild>
              <Link to="/subscriptions">Get alerts</Link>
            </Button>
          </div>
          <div className="rounded border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Ask a document</h2>
            <p className="mt-2 text-muted-foreground">
              Open any document and ask it questions. Answers come only from that document.
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <Link to="/documents">Browse documents</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
