import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentStats } from "@/hooks/useDocumentStats";

const EASE = "transition-all duration-200 ease-out";

const Categories = () => {
  const { categoriesWithCounts, totalDocuments, recentDocuments, documentsByYear } = useDocumentStats();
  const { isLoading, isError, refetch } = useDocuments();
  const years = Object.keys(documentsByYear).filter((y) => y !== "NaN").length;

  const facts = [
    { label: "Documents", value: totalDocuments },
    { label: "Categories", value: categoriesWithCounts.length },
    { label: "Years covered", value: years },
    { label: "Added in the last 30 days", value: recentDocuments },
  ];

  return (
    <Layout>
      <div className="container-custom grid gap-12 py-14 md:grid-cols-12">
        <header className="md:col-span-4">
          <h1 className="display-condensed font-display text-6xl font-extrabold leading-none tracking-tight md:text-7xl">
            Categories
          </h1>
          <p className="mt-4 max-w-xs text-muted-foreground">
            Every type of document in the library. This list builds itself from the documents, so new types appear here on their own.
          </p>
          <dl className="mt-10 divide-y divide-border border-y border-border">
            {facts.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between py-3">
                <dt className="text-sm text-muted-foreground">{f.label}</dt>
                <dd className="font-mono text-2xl font-medium tabular-nums">{isLoading ? "…" : f.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <section className="md:col-span-8" aria-label="All categories">
          {isLoading && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="mb-px h-24 rounded-none" />)}
          {isError && (
            <div className="border-y border-border py-6">
              <p className="font-medium">We could not load the categories.</p>
              <button onClick={() => refetch()} className="mt-2 font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4">
                Try again
              </button>
            </div>
          )}
          {!isLoading && !isError && categoriesWithCounts.length === 0 && (
            <p className="border-y border-border py-6 text-muted-foreground">No categories yet. They appear as soon as documents are added.</p>
          )}
          {categoriesWithCounts.length > 0 && (
            <ul className="divide-y divide-border border-y border-border">
              {categoriesWithCounts.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/documents?category=${encodeURIComponent(c.id)}`}
                    className={`group flex items-baseline justify-between gap-4 py-6 hover:pl-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${EASE}`}
                  >
                    <span className="font-display text-3xl font-bold tracking-tight group-hover:text-primary md:text-5xl">{c.name}</span>
                    <span className="flex items-center gap-4 font-mono text-base tabular-nums text-muted-foreground">
                      {c.documentCount}
                      <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Categories;
