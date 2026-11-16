import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import AdireCloth from "@/components/shared/AdireCloth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService, type IndicatorObservation } from "@/data/apiService";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentStats } from "@/hooks/useDocumentStats";

const POPULAR = ["2024 Budget", "MTEF", "CBN Circular", "Health Sector"];
const DAY = 86_400_000;
const EASE = "transition-all duration-200 ease-out";

/* ---------- The numbers: live Nigeria figures from the indicators API ---------- */

interface TileSpec {
  label: string;
  match: RegExp;
  format: (value: number) => string;
}

const percent = (v: number) => `${v.toFixed(1)}%`;
const TILES: TileSpec[] = [
  { label: "GDP growth", match: /gdp growth|\.KD\.ZG/i, format: percent },
  { label: "Inflation", match: /inflation|\.CPI\./i, format: percent },
  {
    label: "Population",
    match: /population,? total|\.POP\.TOTL/i,
    format: (v) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v),
  },
];

const isNigeria = (o: IndicatorObservation) =>
  ["NGA", "NG"].includes((o.country_code ?? "").toUpperCase()) || /nigeria/i.test(o.country_name ?? "");
const isProjected = (o: IndicatorObservation) => /pred|projection|forecast/i.test(o.obs_status ?? "");

const sparkPoints = (values: number[], w = 120, h = 36) => {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  return values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`)
    .join(" ");
};

const useNigeriaTiles = () => {
  const { data = [], isLoading } = useQuery({
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
      const rows = Array.from(series.values()).find((r) =>
        spec.match.test(`${r[0].indicator_name} ${r[0].indicator_code}`),
      );
      if (!rows) return [];
      const sorted = [...rows].sort((a, b) => a.period - b.period).slice(-11);
      const latest = sorted[sorted.length - 1];
      return [{ spec, period: latest.period, value: latest.value as number, values: sorted.map((r) => r.value as number) }];
    });
  }, [data]);

  return { tiles, isLoading };
};

/* ---------- Page ---------- */

type Doc = { [key: string]: string };

const formatDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const SectionHead = ({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) => (
  <div className="md:col-span-4">
    <h2 id={id} className="display-condensed font-display text-4xl font-extrabold leading-none tracking-tight md:text-5xl">
      {title}
    </h2>
    {children}
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { categoriesWithCounts, totalDocuments, documents } = useDocumentStats();
  const { isLoading: docsLoading, isError: docsError, refetch } = useDocuments();
  const { tiles, isLoading: tilesLoading } = useNigeriaTiles();

  const latest = useMemo(
    () =>
      (documents as Doc[])
        .filter((d) => !Number.isNaN(new Date(d["Date Published"]).getTime()))
        .sort((a, b) => new Date(b["Date Published"]).getTime() - new Date(a["Date Published"]).getTime())
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
      {/* Hero: flat indigo, adire cloth bleeding off the right edge */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-full opacity-25 md:w-[46%] md:opacity-100">
          <AdireCloth className="adire-cloth h-full w-full" />
        </div>
        <div className="container-custom relative pb-20 pt-16 md:pb-28 md:pt-24">
          <h1 className="display-condensed font-display text-[clamp(2.75rem,7vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.03em] md:max-w-[56%]">
            Nigeria's public documents and numbers, <span className="text-gold">in one place.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-primary-foreground/85">
            Search budgets, circulars and indicators. Every page links back to the official source it came from.
          </p>

          <form
            role="search"
            onSubmit={submit}
            className={`mt-10 flex max-w-xl items-end gap-4 border-b-2 border-primary-foreground/50 focus-within:border-gold ${EASE}`}
          >
            <label htmlFor="home-search" className="sr-only">
              Search documents
            </label>
            <input
              id="home-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search, for example 2024 budget"
              className="min-w-0 flex-1 bg-transparent py-3 font-display text-2xl text-primary-foreground placeholder:text-primary-foreground/55 focus:outline-none"
            />
            <button
              type="submit"
              className={`inline-flex items-center gap-2 py-3 font-semibold text-gold hover:gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${EASE}`}
            >
              Search <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-primary-foreground/85">
            <span>Popular</span>
            {POPULAR.map((term) => (
              <Link
                key={term}
                to={`/documents?q=${encodeURIComponent(term)}`}
                className={`py-1 font-medium underline decoration-gold decoration-2 underline-offset-4 hover:text-gold ${EASE}`}
              >
                {term}
              </Link>
            ))}
          </p>
          {totalDocuments > 0 && (
            <p className="mt-10 font-mono text-sm text-primary-foreground/75">
              {totalDocuments} documents, each linked to its official source
            </p>
          )}
        </div>
      </section>

      {/* The numbers */}
      <section aria-labelledby="numbers-heading" className="container-custom grid gap-10 py-20 md:grid-cols-12">
        <SectionHead id="numbers-heading" title="The numbers">
          <p className="mt-4 max-w-xs text-muted-foreground">Latest figures for Nigeria.</p>
          <Link
            to="/indicators"
            className={`mt-5 inline-flex items-center gap-2 font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 hover:gap-3 ${EASE}`}
          >
            Compare all indicators <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </SectionHead>
        <ul className="divide-y divide-border border-y border-border md:col-span-8">
          {tilesLoading && [0, 1, 2].map((i) => <li key={i}><Skeleton className="my-4 h-16 rounded-none" /></li>)}
          {!tilesLoading &&
            tiles.map(({ spec, period, value, values }) => (
              <li key={spec.label}>
                <Link
                  to="/indicators"
                  aria-label={`${spec.label}: ${spec.format(value)} in ${period}. Open indicators.`}
                  className={`grid grid-cols-[1fr_auto] items-center gap-6 py-6 hover:pl-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${EASE}`}
                >
                  <span>
                    <span className="block font-display text-xl font-semibold">{spec.label}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{period}</span>
                  </span>
                  <span className="flex items-center gap-6 md:gap-10">
                    <svg viewBox="0 0 120 36" width="120" height="36" aria-hidden="true" className="hidden sm:block">
                      <polyline points={sparkPoints(values)} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
                    </svg>
                    <span className="font-mono text-4xl font-medium tabular-nums md:text-6xl">{spec.format(value)}</span>
                  </span>
                </Link>
              </li>
            ))}
          {!tilesLoading && tiles.length === 0 && (
            <li className="py-6 text-muted-foreground">Figures are not available right now. Try Compare all indicators.</li>
          )}
        </ul>
      </section>

      {/* Latest documents */}
      <section aria-labelledby="latest-heading" className="container-custom grid gap-10 pb-20 md:grid-cols-12">
        <SectionHead id="latest-heading" title="Latest documents">
          <p className="mt-4 max-w-xs text-muted-foreground">Straight from the official sources.</p>
          <Link
            to="/documents"
            className={`mt-5 inline-flex items-center gap-2 font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 hover:gap-3 ${EASE}`}
          >
            Browse all documents <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </SectionHead>
        <div className="md:col-span-8">
          {docsLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="mb-px h-24 rounded-none" />)}
          {docsError && (
            <div className="border-y border-border py-6">
              <p className="font-medium">We could not load the documents.</p>
              <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
              <Button className="mt-4" size="sm" onClick={() => refetch()}>Try again</Button>
            </div>
          )}
          {!docsLoading && !docsError && latest.length === 0 && (
            <p className="border-y border-border py-6 text-muted-foreground">
              No documents yet. They appear here as soon as they are added to the library.
            </p>
          )}
          {latest.length > 0 && (
            <ul className="divide-y divide-border border-y border-border">
              {latest.map((doc) => {
                const published = new Date(doc["Date Published"]);
                const age = Date.now() - published.getTime();
                const isNew = age >= 0 && age <= 30 * DAY;
                const meta = [doc.Source, doc.Type, formatDate(doc["Date Published"])].filter(Boolean).join(", ");
                return (
                  <li
                    key={doc.id}
                    className={`grid grid-cols-[4.5rem_1fr] items-baseline gap-x-6 gap-y-2 py-6 hover:bg-secondary/60 hover:pl-3 md:grid-cols-[6rem_1fr_auto] ${EASE}`}
                  >
                    <span className="font-mono text-2xl font-medium tabular-nums text-primary">{published.getFullYear()}</span>
                    <div className="min-w-0">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="line-clamp-2 font-display text-xl font-semibold leading-snug underline-offset-4 hover:underline md:text-2xl"
                      >
                        {doc.Title}
                      </Link>
                      {isNew && (
                        <span
                          title="Published in the last 30 days"
                          className="ml-3 rounded-sm bg-gold px-1.5 py-0.5 align-middle font-mono text-[11px] font-medium uppercase text-gold-foreground"
                        >
                          New
                        </span>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
                    </div>
                    {doc["Document URL"] && (
                      <a
                        href={doc["Document URL"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-2 py-1 font-medium text-primary underline decoration-gold decoration-2 underline-offset-4 md:col-span-1"
                      >
                        Download<span className="sr-only">: {doc.Title}</span>
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Browse by type: a big type index, no boxes */}
      <section aria-labelledby="types-heading" className="bg-secondary">
        <div className="container-custom grid gap-10 py-20 md:grid-cols-12">
          <SectionHead id="types-heading" title="Browse by type" />
          <ul className="divide-y divide-border border-y border-border md:col-span-8">
            {categoriesWithCounts.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/documents?category=${encodeURIComponent(c.id)}`}
                  className={`flex items-baseline justify-between gap-4 py-5 font-display text-3xl font-bold tracking-tight hover:pl-3 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:text-5xl ${EASE}`}
                >
                  <span>{c.name}</span>
                  {totalDocuments > 0 && (
                    <span className="font-mono text-base font-normal tabular-nums text-muted-foreground">{c.documentCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing band */}
      <section className="bg-primary text-primary-foreground">
        <div className="container-custom grid gap-10 py-20 md:grid-cols-12 md:items-end">
          <h2 className="display-condensed font-display text-5xl font-extrabold leading-[0.95] tracking-tight md:col-span-7 md:text-7xl">
            Know when something new is published.
          </h2>
          <div className="space-y-6 md:col-span-5">
            <p className="text-lg text-primary-foreground/85">
              Get notified when new documents are added. Or open any document and ask it questions. Answers come only from that document.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <Button variant="gold" size="lg" asChild>
                <Link to="/subscriptions">Get alerts</Link>
              </Button>
              <Link
                to="/documents"
                className={`font-semibold underline decoration-gold decoration-2 underline-offset-4 hover:text-gold ${EASE}`}
              >
                Browse documents
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
