import Layout from "@/components/layout/Layout";
import CategoryCard from "@/components/shared/CategoryCard";
import { useDocumentStats } from "@/hooks/useDocumentStats";

const Categories = () => {
  const { categoriesWithCounts, totalDocuments, recentDocuments, documentsByYear } = useDocumentStats();

  // Calculate additional stats
  const yearsCovered = Object.keys(documentsByYear).length;
  const uniqueSources = new Set(categoriesWithCounts.map(cat => cat.name)).size;

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-12 md:py-16">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            Document Categories
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Explore Nigeria's public documents organized by type and source
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesWithCounts.map((category, index) => (
              <div
                key={category.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/50">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Document Statistics
            </h2>
            <p className="text-muted-foreground">
              Our growing collection of public documents
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Documents", value: totalDocuments.toString() },
              { label: "Categories", value: categoriesWithCounts.length.toString() },
              { label: "Years Covered", value: yearsCovered.toString() },
              { label: "Recent (30 days)", value: recentDocuments.toString() },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-card border border-border"
              >
                <div className="font-display text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};export default Categories;
