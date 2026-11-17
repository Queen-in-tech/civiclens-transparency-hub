import { Link } from "react-router-dom";
import { useDocumentStats } from "@/hooks/useDocumentStats";

const EASE = "transition-all duration-200 ease-out";
const item = `inline-block py-1 text-foreground/80 underline-offset-4 hover:text-primary hover:underline ${EASE}`;

const Footer = () => {
  const { categoriesWithCounts } = useDocumentStats();

  return (
    <footer className="border-t border-border bg-secondary">
      <div className="container-custom py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link to="/" className="display-condensed font-display text-6xl font-extrabold leading-none tracking-tight md:text-7xl">
              Civic<span className="text-primary">Lens</span>
            </Link>
            <p className="mt-5 max-w-sm text-muted-foreground">
              Nigeria's public documents and numbers, in one place. Every page links back to the official source.
            </p>
          </div>

          <nav aria-label="Explore" className="md:col-span-3 md:col-start-7">
            <h2 className="mb-3 font-display text-lg font-bold">Explore</h2>
            <ul>
              {[
                ["Documents", "/documents"],
                ["Categories", "/categories"],
                ["Data", "/indicators"],
                ["Get alerts", "/subscriptions"],
              ].map(([name, path]) => (
                <li key={path}><Link to={path} className={item}>{name}</Link></li>
              ))}
            </ul>
          </nav>

          {categoriesWithCounts.length > 0 && (
            <nav aria-label="Categories" className="md:col-span-3">
              <h2 className="mb-3 font-display text-lg font-bold">Categories</h2>
              <ul>
                {categoriesWithCounts.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link to={`/documents?category=${encodeURIComponent(c.id)}`} className={item}>{c.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row">
          <p className="max-w-xl">
            An independent civic tech project. Documents come from public government websites and remain the property of their institutions.
          </p>
          <p className="font-mono">© {new Date().getFullYear()} CivicLens</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
