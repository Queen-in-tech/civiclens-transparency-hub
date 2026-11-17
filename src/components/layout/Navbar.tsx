import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// The bar keeps to three links. Everything else lives in quick search and the phone menu.
const mainLinks = [
  { name: "Documents", path: "/documents" },
  { name: "Categories", path: "/categories" },
  { name: "Data", path: "/indicators" },
];
const allPages = [
  { name: "Home", path: "/" },
  ...mainLinks,
  { name: "AI Search", path: "/ai-search" },
  { name: "Get alerts", path: "/subscriptions" },
];
const EASE = "transition-all duration-200 ease-out";

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);

  // Hide on scroll down, come back on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cmd/Ctrl+K opens quick search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the phone menu on navigation, and lock page scroll while it is open
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const go = (to: string) => {
    setSearchOpen(false);
    setQuery("");
    navigate(to);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b border-border bg-background transition-transform duration-300 ease-out ${
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <nav className="container-custom flex h-[72px] items-center justify-between" aria-label="Main">
          <Link to="/" className="display-condensed font-display text-3xl font-extrabold leading-none tracking-tight">
            Civic<span className="text-primary">Lens</span>
          </Link>

          <ul className="hidden items-center gap-9 md:flex">
            {mainLinks.map((l) => {
              const active = pathname === l.path || pathname.startsWith(`${l.path}/`);
              return (
                <li key={l.path}>
                  <Link
                    to={l.path}
                    aria-current={active ? "page" : undefined}
                    className="group relative py-2 font-medium text-foreground/80 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  >
                    {l.name}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-gold ${EASE} ${
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className={`hidden items-center gap-3 border-b-2 border-border py-1.5 text-sm text-muted-foreground hover:border-gold hover:text-foreground md:inline-flex ${EASE}`}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
              <kbd className="font-mono text-xs">Ctrl K</kbd>
            </button>
            <Button variant="gold" className="hidden md:inline-flex" asChild>
              <Link to="/subscriptions">Get alerts</Link>
            </Button>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-2 md:hidden"
            >
              <Search className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="p-2 md:hidden"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      {/* Quick search: jump to a page or search documents */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search documents or jump to a page" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>Nothing matches. Press Enter to search documents.</CommandEmpty>
          {query.trim() && (
            <CommandGroup heading="Documents">
              <CommandItem
                forceMount
                value={`search documents ${query}`}
                onSelect={() => go(`/documents?q=${encodeURIComponent(query.trim())}`)}
              >
                Search documents for "{query.trim()}"
              </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup heading="Pages">
            {allPages.map((p) => (
              <CommandItem key={p.path} value={p.name} onSelect={() => go(p.path)}>
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Phone menu: full screen, big type */}
      {menuOpen && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[60] flex flex-col bg-primary text-primary-foreground md:hidden">
          <div className="container-custom flex h-[72px] items-center justify-between">
            <span className="display-condensed font-display text-3xl font-extrabold leading-none tracking-tight">
              Civic<span className="text-gold">Lens</span>
            </span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-2">
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <ul className="container-custom mt-8 flex-1 divide-y divide-primary-foreground/20 border-y border-primary-foreground/20">
            {allPages.filter((p) => p.path !== "/subscriptions").map((p) => (
              <li key={p.path}>
                <Link
                  to={p.path}
                  aria-current={pathname === p.path ? "page" : undefined}
                  className={`flex items-center justify-between py-5 display-condensed font-display text-5xl font-extrabold leading-none tracking-tight hover:pl-2 ${EASE} ${
                    pathname === p.path ? "text-gold" : ""
                  }`}
                >
                  {p.name}
                  <ArrowRight className="h-6 w-6" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="container-custom py-8">
            <Button variant="gold" size="lg" className="w-full" asChild>
              <Link to="/subscriptions">Get alerts</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
