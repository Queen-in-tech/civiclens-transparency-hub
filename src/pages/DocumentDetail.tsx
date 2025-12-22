import { useParams, Link } from "react-router-dom";
import {
  FileText,
  Download,
  ExternalLink,
  Calendar,
  HardDrive,
  Building2,
  Tag,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import DocumentCard from "@/components/shared/DocumentCard";
import { Button } from "@/components/ui/button";
import { documents } from "@/data/mockData";

const DocumentDetail = () => {
  const { id } = useParams();
  const document = documents.find((d) => d.id === id);

  if (!document) {
    return (
      <Layout>
        <div className="container-custom py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Document Not Found</h1>
          <Button asChild>
            <Link to="/documents">Back to Documents</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const relatedDocuments = documents
    .filter((d) => d.category === document.category && d.id !== document.id)
    .slice(0, 3);

  return (
    <Layout>
      {/* Breadcrumb */}
      <section className="bg-card border-b border-border py-4">
        <div className="container-custom">
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Link>
        </div>
      </section>

      {/* Document Header */}
      <section className="py-8 md:py-12">
        <div className="container-custom">
          <div className="max-w-4xl">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-4">
              <Tag className="h-3 w-3 mr-1" />
              {document.category}
            </span>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6">
              {document.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{document.publishedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span>{document.fileSize}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{document.source || "Government Source"}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="lg">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Source
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Summary */}
      <section className="py-8 bg-muted/50">
        <div className="container-custom">
          <div className="max-w-4xl">
            <div className="rounded-xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-accent" />
                <h2 className="font-display font-semibold text-foreground">AI-Generated Summary</h2>
              </div>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  This document outlines the fiscal framework and budget allocations for the Federal Republic of Nigeria. 
                  Key highlights include:
                </p>
                <ul className="mt-4 space-y-2">
                  <li>Total budget appropriation of ₦28.77 trillion for the fiscal year</li>
                  <li>Capital expenditure allocation of ₦8.7 trillion (30.2% of total budget)</li>
                  <li>Recurrent expenditure of ₦15.38 trillion covering personnel costs and overheads</li>
                  <li>Deficit financing plan including domestic and foreign borrowing</li>
                  <li>Priority sectors: Health, Education, Infrastructure, and Security</li>
                </ul>
                <p className="mt-4 text-xs text-muted-foreground italic">
                  Note: This summary is AI-generated for quick reference. Please refer to the original document for official information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Document Preview */}
      <section className="py-8 md:py-12">
        <div className="container-custom">
          <div className="max-w-4xl">
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">
              Document Preview
            </h2>
            <div className="aspect-[4/5] rounded-xl border border-border bg-card flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Document preview will be displayed here</p>
                <p className="text-sm">Click download to access the full document</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Documents */}
      {relatedDocuments.length > 0 && (
        <section className="py-12 bg-muted/50">
          <div className="container-custom">
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">
              Related Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedDocuments.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default DocumentDetail;
