import { useState } from "react";
import { Bell, Check, Mail } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/mockData";

const Subscriptions = () => {
  const [email, setEmail] = useState("");
  const [keywords, setKeywords] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <Layout>
        <div className="container-custom py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success mb-6">
              <Check className="h-10 w-10" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-4">
              Subscription Confirmed!
            </h1>
            <p className="text-muted-foreground mb-6">
              You'll receive email notifications when new documents matching your preferences are published.
            </p>
            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
              Update Preferences
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-12 md:py-16">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10 mb-6">
            <Bell className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            Stay Updated
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Subscribe to receive notifications when new documents are published in your areas of interest
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label
                  htmlFor="keywords"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Keywords (optional)
                </label>
                <input
                  type="text"
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., health, education, infrastructure"
                  className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Separate multiple keywords with commas
                </p>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Categories
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryToggle(category.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-soft"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {category.name}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {category.documentCount} documents
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={!email}
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Subscribe to Updates
                </Button>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  You can unsubscribe at any time. We respect your privacy.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 bg-muted/50">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              What You'll Receive
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                {
                  title: "New Documents",
                  description: "Instant alerts when documents matching your interests are published",
                },
                {
                  title: "Weekly Digest",
                  description: "A summary of all new documents from the past week",
                },
                {
                  title: "Important Updates",
                  description: "Notifications about significant policy changes and announcements",
                },
              ].map((item, index) => (
                <div key={index} className="p-5 rounded-xl bg-card border border-border">
                  <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Subscriptions;
