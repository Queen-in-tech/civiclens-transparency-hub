import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import DocumentChat from "@/components/shared/DocumentChat";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocument, useDocuments } from "@/hooks/useDocuments";

type Doc = { [key: string]: string };
const EASE = "transition-all duration-200 ease-out";
const link = `font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 ${EASE}`;

const formatDate = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const DocumentDetail = () => {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useDocument(id || "");
  const { data: all = [] } = useDocuments();
  const doc = (Array.isArray(data) ? data[0] : data) as Doc | undefined;

  // The AI summary arrives as HTML, so it is cleaned before it is shown.
  const summary = useMemo(() => {
    const raw = (doc?.["AI summary"] ?? "").replace(/```[a-z]*\n?/g, "").replace(/```/g, "");
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  }, [doc]);

  const related = useMemo(
    () =>
      (all as Doc[])
        .filter((d) => doc && d.Type === doc.Type && d.id !== doc.id)
        .sort((a, b) => new Date(b["Date Published"]).getTime() - new Date(a["Date Published"]).getTime())
        .slice(0, 4),
    [all, doc],
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container-custom py-12">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-6 h-16 w-3/4 rounded-none" />
          <Skeleton className="mt-4 h-4 w-1/2" />
          <Skeleton className="mt-10 h-64 rounded-none" />
        </div>
      </Layout>
    );
  }

  if (isError || !doc) {
    return (
      <Layout>
        <div className="container-custom py-20">
          <h1 className="display-condensed font-display text-5xl font-extrabold leading-none tracking-tight">
            {isError ? "We could not load this document." : "We could not find this document."}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isError ? "Check your connection and try again." : "It may have been moved or removed."}
          </p>
          <div className="mt-6 flex items-center gap-6">
            {isError && <Button onClick={() => refetch()}>Try again</Button>}
            <Link to="/documents" className={link}>Back to documents</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const url = doc["Document URL"];
  const meta = [doc.Source, doc.Type, formatDate(doc["Date Published"]), doc.fileSize].filter(Boolean).join(", ");

  return (
    <Layout>
      <div className="container-custom py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/documents" className="underline underline-offset-4 hover:text-primary">Documents</Link>
          {doc.Type && (
            <>
              <span aria-hidden="true"> / </span>
              <Link to={`/documents?category=${encodeURIComponent(doc.Type)}`} className="underline underline-offset-4 hover:text-primary">{doc.Type}</Link>
            </>
          )}
        </nav>

        <header className="mt-6 max-w-4xl">
          <h1 className="display-condensed font-display text-4xl font-extrabold leading-[0.98] tracking-tight md:text-6xl">{doc.Title}</h1>
          <p className="mt-4 font-mono text-sm text-muted-foreground">{meta}</p>
          {url && (
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Button variant="gold" size="lg" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer" download>Download</a>
              </Button>
              <a href={url} target="_blank" rel="noopener noreferrer" className={link}>Open the original</a>
            </div>
          )}
        </header>

        <div className="mt-12 grid gap-x-12 gap-y-12 md:grid-cols-12">
          <section aria-labelledby="summary-heading" className="md:col-span-7 md:row-start-1">
            <h2 id="summary-heading" className="display-condensed font-display text-3xl font-extrabold leading-none tracking-tight">Summary</h2>
            <div className="summary-html mt-4 max-w-prose" dangerouslySetInnerHTML={{ __html: summary || "<p>No summary is available for this document yet.</p>" }} />
            <p className="mt-4 text-sm text-muted-foreground">
              This summary was written by AI for quick reference. For anything official, check the original document.
            </p>
          </section>

          <div className="md:sticky md:top-24 md:col-span-5 md:col-start-8 md:row-span-2 md:row-start-1 md:h-[calc(100vh-8rem)] md:self-start">
            <DocumentChat documentUrl={url || ""} documentTitle={doc.Title} documentType={doc.Type || ""} id={doc.id || ""} />
          </div>

          <section aria-labelledby="preview-heading" className="md:col-span-7 md:row-start-2">
            <h2 id="preview-heading" className="display-condensed font-display text-3xl font-extrabold leading-none tracking-tight">The document</h2>
            {url ? (
              <>
                <iframe src={url} title={doc.Title} className="mt-4 h-[75vh] w-full border border-border bg-card" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Blank preview? Some sites do not allow it. <a href={url} target="_blank" rel="noopener noreferrer" className={link}>Open the document</a> instead.
                </p>
              </>
            ) : (
              <p className="mt-4 border-y border-border py-10 text-muted-foreground">No file is linked to this document.</p>
            )}
          </section>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-20 grid gap-8 md:grid-cols-12">
            <h2 id="related-heading" className="display-condensed font-display text-3xl font-extrabold leading-none tracking-tight md:col-span-4">More in {doc.Type}</h2>
            <ul className="divide-y divide-border border-y border-border md:col-span-8">
              {related.map((d) => (
                <li key={d.id}>
                  <Link to={`/documents/${d.id}`} className={`grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-x-6 py-5 hover:pl-3 ${EASE}`}>
                    <span className="font-mono text-lg tabular-nums text-primary">{new Date(d["Date Published"]).getFullYear() || ""}</span>
                    <span className="line-clamp-2 font-display text-lg font-semibold">{d.Title}</span>
                    <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default DocumentDetail;
