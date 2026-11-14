import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid, List, Filter, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/shared/SearchBar";
import DocumentCard from "@/components/shared/DocumentCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categories } from "@/data/mockData";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentStats } from "@/hooks/useDocumentStats";

const Documents = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Use React Query for global document state
  const { data: documents = [], isLoading } = useDocuments();
  const { categoriesWithCounts } = useDocumentStats();

  const years = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];
  const [showAllYears, setShowAllYears] = useState(false);
  const displayedYears = showAllYears ? years : years.slice(0, 5);

  console.log("documents:", documents); // Debugging line to check the fetched documents

  const filteredDocuments = documents.filter((doc) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = doc.Title?.toLowerCase().includes(query);
      const typeMatch = doc.Type?.toLowerCase().includes(query);
      const sourceMatch = doc.Source?.toLowerCase().includes(query);
      if (!titleMatch && !typeMatch && !sourceMatch) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory?.toLowerCase().replace(" ", "-") && doc?.Type?.toLowerCase().replace(" ", "-") !== selectedCategory) {
      const categoryMatch = categoriesWithCounts.find(c => c.id === selectedCategory);
      if (categoryMatch && doc.Type !== categoryMatch.id) {
        return false;
      }
    }

    // Year filter
    if (selectedYear && new Date(doc["Date Published"]).getFullYear() !== selectedYear) return false;

    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedYear(null);
    setSearchQuery("");
    setCurrentPage(1); 
  };

  const hasActiveFilters = selectedCategory || selectedYear || searchQuery;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate truncated page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2; // Number of pages to show around current page

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push('...');
    }

    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedYear, searchQuery]);


  return (
    <Layout>
      {/* Header */}
      <section className="bg-card border-b border-border py-8">
        <div className="container-custom">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Document Library
          </h1>
          <p className="text-muted-foreground mb-6">
            Browse and download public documents
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search by title, keyword, or year..."
                onSearch={setSearchQuery}
                value={searchQuery}
                onChange={setSearchQuery}
              />
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
                  {categoriesWithCounts.map((category) => (
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
                  {displayedYears.map((year) => (
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
                  {years.length > 5 && (
                    <button
                      onClick={() => setShowAllYears(!showAllYears)}
                      className="text-sm text-primary hover:underline mt-2 ml-6"
                    >
                      {showAllYears ? 'Show less' : `Show ${years.length - 5} more years`}
                    </button>
                  )}
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
                  {isLoading
                    ? "Loading documents..."
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredDocuments.length)} of ${filteredDocuments.length} documents`
                  }
                </p>
              </div>

              {isLoading ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 lg:grid-cols-2 gap-5"
                      : "space-y-4"
                  }
                >
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-lg border border-border bg-card p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
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
                  {paginatedDocuments.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && filteredDocuments.length > itemsPerPage && (
                <div className="mt-10 flex justify-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex gap-1">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="w-10 h-10 flex items-center justify-center text-muted-foreground"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page as number)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              page === currentPage
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Documents;
