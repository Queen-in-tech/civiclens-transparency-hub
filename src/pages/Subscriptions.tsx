import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
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
import { useDocumentStats } from "@/hooks/useDocumentStats";

// Set VITE_SUBSCRIBE_WEBHOOK_URL to use a different n8n flow without changing code.
const ENDPOINT =
  import.meta.env.VITE_SUBSCRIBE_WEBHOOK_URL ?? "https://n8n.arokolabs.com/webhook/57497a49-e246-40bf-994c-d0c5317c949b";
const EASE = "transition-all duration-200 ease-out";
const field = `w-full border-b-2 border-border bg-transparent py-3 font-display text-2xl placeholder:text-muted-foreground focus:border-gold focus:outline-none ${EASE}`;

// Reads the reply from n8n. It accepts plain text or JSON like {"status":"created"}.
const classify = (ok: boolean, text: string): "exists" | "success" | "error" => {
  let status = text;
  try {
    const data = JSON.parse(text);
    status = typeof data === "string" ? data : `${data?.status ?? ""} ${data?.message ?? ""}`;
  } catch { /* plain text */ }
  if (/active subscription exist|already/i.test(status)) return "exists";
  return ok && /creat|updat|success/i.test(status) ? "success" : "error";
};

const Subscriptions = () => {
  const { categoriesWithCounts } = useDocumentStats();
  const [email, setEmail] = useState("");
  const [keywords, setKeywords] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [askUpdate, setAskUpdate] = useState(false);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async (update = false) => {
    setState("loading");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          categories: picked,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          update,
        }),
      });
      const result = classify(response.ok, await response.text());
      if (result === "exists") { setAskUpdate(true); setState("idle"); }
      else setState(result === "success" ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <Layout>
        <div className="container-custom grid gap-10 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-8 md:col-start-5">
            <h1 className="display-condensed font-display text-6xl font-extrabold leading-none tracking-tight md:text-8xl">You are on the list.</h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground" role="status">
              We will email <span className="font-mono text-foreground">{email.trim()}</span> when new documents match your choices. Check your inbox for a confirmation.
            </p>
            <button onClick={() => setState("idle")} className={`mt-8 font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 ${EASE}`}>
              Change my choices
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom grid gap-12 py-14 md:grid-cols-12">
        <header className="md:col-span-4">
          <h1 className="display-condensed font-display text-6xl font-extrabold leading-none tracking-tight md:text-7xl">Get alerts</h1>
          <p className="mt-4 max-w-xs text-muted-foreground">
            Tell us what you care about. We email you when new documents match.
          </p>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Already subscribed? Enter the same email again to change your choices.
          </p>
        </header>

        <form onSubmit={(e) => { e.preventDefault(); submit(false); }} className="space-y-12 md:col-span-8">
          <div>
            <label htmlFor="email" className="font-display text-lg font-bold">Email address</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`mt-2 ${field}`} />
          </div>

          <div>
            <label htmlFor="keywords" className="font-display text-lg font-bold">Keywords <span className="font-sans text-sm font-normal text-muted-foreground">(optional)</span></label>
            <input id="keywords" type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="health, education, roads" className={`mt-2 ${field}`} />
            <p className="mt-2 text-sm text-muted-foreground">Separate keywords with commas.</p>
          </div>

          {categoriesWithCounts.length > 0 && (
            <fieldset>
              <legend className="font-display text-lg font-bold">Types of document</legend>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {categoriesWithCounts.map((c) => (
                  <li key={c.id}>
                    <label className={`flex cursor-pointer items-center gap-4 py-4 hover:pl-3 ${EASE}`}>
                      <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} className="h-5 w-5 accent-[hsl(var(--primary))]" />
                      <span className="flex-1 font-display text-xl font-semibold">{c.name}</span>
                      <span className="font-mono text-sm tabular-nums text-muted-foreground">{c.documentCount}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          <div>
            <p className="mb-4 max-w-md text-sm text-muted-foreground">
              We use your email only to send these alerts. See how we handle it in our <Link to="/privacy" className="font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4">privacy notice</Link>.
            </p>
            <Button type="submit" variant="gold" size="lg" disabled={!email.trim() || state === "loading"}>
              {state === "loading" ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />Subscribing</>) : "Get alerts"}
            </Button>
            {state === "error" && (
              <p role="alert" className="mt-4 font-medium text-destructive">
                We could not save your alerts. Check your email address and try again.
              </p>
            )}
          </div>
        </form>
      </div>

      <AlertDialog open={askUpdate} onOpenChange={setAskUpdate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You already have alerts</AlertDialogTitle>
            <AlertDialogDescription>This email is already subscribed. Replace its choices with the ones you just picked?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setAskUpdate(false); submit(true); }}>Update my alerts</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Subscriptions;
