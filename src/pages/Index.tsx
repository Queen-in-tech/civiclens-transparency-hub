import { Link } from "react-router-dom";
import { ArrowRight, FileSearch, Bell, Shield, TrendingUp } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/shared/SearchBar";
import DocumentCard from "@/components/shared/DocumentCard";
import CategoryCard from "@/components/shared/CategoryCard";
import { Button } from "@/components/ui/button";
import { useDocumentStats } from "@/hooks/useDocumentStats";

const Index = () => {
  const { categoriesWithCounts, totalDocuments, documents } = useDocumentStats();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-accent/80 py-20 md:py-28">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 animate-fade-in">
              Nigeria's Public Documents in One Place
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Access budgets, fiscal frameworks, and CBN publications. Search, understand, and stay informed about how public resources are managed.
            </p>
            <div className="flex justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <SearchBar
                placeholder="Search documents or ask a question..."
                size="large"
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <span className="text-sm text-primary-foreground/60">Popular:</span>
              {["2024 Budget", "MTEF", "CBN Circular", "Health Sector"].map((term) => (
                <Link
                  key={term}
                  to={`/documents?q=${term}`}
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground underline underline-offset-4 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="border-b border-border bg-card py-6">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: FileSearch, text: `${totalDocuments}+ Documents` },
              { icon: Shield, text: "Official Sources" },
              { icon: Bell, text: "Real-time Updates" },
              { icon: TrendingUp, text: "AI-Powered Search" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <item.icon className="h-4 w-4 text-accent" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Browse by Category
              </h2>
              <p className="text-muted-foreground">
                Explore documents organized by type and source
              </p>
            </div>
            <Link
              to="/categories"
              className="mt-4 md:mt-0 text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoriesWithCounts.slice(0, 3).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoriesWithCounts.slice(3).map((category) => (
              <CategoryCard key={category.id} category={category} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Documents */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Latest Documents
              </h2>
              <p className="text-muted-foreground">
                Recently published government documents
              </p>
            </div>
            <Link
              to="/documents"
              className="mt-4 md:mt-0 text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all documents
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.slice(0, 6).map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/documents">
                Browse All Documents
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AI Search CTA */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent/80 p-8 md:p-12">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-foreground rounded-full blur-3xl" />
            </div>
            <div className="relative max-w-2xl">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
                Ask Questions About Public Document
              </h2>
              <p className="text-accent-foreground/80 mb-6 leading-relaxed">
                Use our AI-powered search to ask natural language questions about budgets, policies, and financial data. Get instant answers with source references.
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/ai-search">
                  Try AI Search
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <Bell className="h-12 w-12 mx-auto text-primary mb-6" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Stay Updated
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Subscribe to receive notifications when new documents are published in your areas of interest.
          </p>
          <Button variant="default" size="lg" asChild>
            <Link to="/subscriptions">
              Set Up Alerts
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
