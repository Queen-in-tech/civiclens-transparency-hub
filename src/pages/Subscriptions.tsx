import { useState } from "react";
import { Bell, Check, Mail, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SUBSCRIPTION_ENDPOINT = "https://sheba-n8n.duckdns.org/webhook/57497a49-e246-40bf-994c-d0c5317c949b";

const Subscriptions = () => {
  const [email, setEmail] = useState("");
  const [keywords, setKeywords] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const { toast } = useToast();

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const submitSubscription = async (update: boolean = false) => {
    setIsLoading(true);
    
    // Parse keywords into array
    const keywordsArray = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    
    // Get category names from selected IDs
    const categoryNames = selectedCategories
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter((name): name is string => !!name);

    const payload = {
      email,
      categories: categoryNames,
      keywords: keywordsArray,
      update,
    };

    try {
      const response = await fetch(SUBSCRIPTION_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      
      // Check if subscription already exists
      if (responseText.includes("An active subscription exist")) {
        setShowUpdateDialog(true);
        setIsLoading(false);
        return;
      }

      // Check for success
      if (responseText.includes("Subscription created") || response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Success!",
          description: update 
            ? "Your subscription has been updated successfully." 
            : "Your subscription has been created. Check your email for confirmation.",
        });
      } else {
        throw new Error(responseText || "Failed to create subscription");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSubscription(false);
  };

  const handleUpdateConfirm = () => {
    setShowUpdateDialog(false);
    submitSubscription(true);
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
                  disabled={!email || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <Bell className="h-5 w-5 mr-2" />
                      Subscribe to Updates
                    </>
                  )}
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

      {/* Update Confirmation Dialog */}
      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Active Subscription Found</AlertDialogTitle>
            <AlertDialogDescription>
              An active subscription already exists for this email address. Would you like to update your subscription preferences?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateConfirm}>
              Update Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Subscriptions;
