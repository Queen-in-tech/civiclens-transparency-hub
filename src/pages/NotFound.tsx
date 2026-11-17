import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <Layout>
      <div className="container-custom grid gap-10 py-20 md:grid-cols-12 md:py-28">
        <p className="font-mono text-7xl font-medium leading-none text-primary md:col-span-4 md:text-9xl" aria-hidden="true">404</p>
        <div className="md:col-span-8">
          <h1 className="display-condensed font-display text-5xl font-extrabold leading-none tracking-tight md:text-7xl">
            This page does not exist.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            We could not find <span className="break-all font-mono text-foreground">{pathname}</span>. It may have moved, or the link may have a typo.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Button variant="gold" size="lg" asChild>
              <Link to="/documents">Browse documents</Link>
            </Button>
            <Link to="/" className="font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4">
              Go to the home page
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
