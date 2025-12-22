import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid, List, Filter, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/shared/SearchBar";
import DocumentCard from "@/components/shared/DocumentCard";
import { Button } from "@/components/ui/button";
import { documents, categories } from "@/data/mockData";

const Documents = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const years = [2024, 2023, 2022, 2021, 2020];

  const filteredDocuments = documents.filter((doc) => {
    if (selectedCategory && doc.category.toLowerCase().replace(" ", "-") !== selectedCategory) {
      // Check if category name matches
      const categoryMatch = categories.find(c => c.id === selectedCategory);
      if (categoryMatch && doc.category !== categoryMatch.name) {
        return false;
      }
    }
    if (selectedYear && doc.year !== selectedYear) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedYear(null);
  };

  const hasActiveFilters = selectedCategory || selectedYear;

  return (
    <Layout>
      {/* Header */}
      <section className="bg-card border-b border-border py-8">
        <div className="container-custom">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Document Library
          </h1>
          <p className="text-muted-foreground mb-6">
            Browse and download public finance documents
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar placeholder="Search by title, keyword, or year..." />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container-custom">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside
              className={`${
                showFilters ? "fixed inset-0 z-50 bg-background p-6" : "hidden"
              } md:block md:static md:w-64 shrink-0`}
            >
              <div className="flex items-center justify-between mb-6 md:mb-4">
                <h2 className="font-display font-semibold text-foreground">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="md:hidden p-2 hover:bg-secondary rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline mb-6"
                >
                  Clear all filters
                </button>
              )}

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.id}
                        onChange={() =>
                          setSelectedCategory(
                            selectedCategory === category.id ? null : category.id
                          )
                        }
                        className="w-4 h-4 text-primary border-border focus:ring-primary"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {category.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({category.documentCount})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Year Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Year</h3>
                <div className="space-y-2">
                  {years.map((year) => (
                    <label
                      key={year}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="year"
                        checked={selectedYear === year}
                        onChange={() =>
                          setSelectedYear(selectedYear === year ? null : year)
                        }
                        className="w-4 h-4 text-primary border-border focus:ring-primary"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {year}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                variant="accent"
                className="w-full md:hidden"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </Button>
            </aside>

            {/* Documents Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredDocuments.length} documents
                </p>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No documents found matching your filters.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 lg:grid-cols-2 gap-5"
                      : "space-y-4"
                  }
                >
                  {filteredDocuments.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="mt-10 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((page) => (
                      <button
                        key={page}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          page === 1
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Documents;
