import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  size?: "default" | "large";
}

const SearchBar = ({ 
  placeholder = "Search documents...", 
  onSearch,
  size = "default"
}: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative ${size === "large" ? "max-w-2xl" : "max-w-md"}`}>
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${
          size === "large" ? "h-5 w-5" : "h-4 w-4"
        }`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-input bg-card pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
            size === "large" 
              ? "h-14 text-base shadow-soft" 
              : "h-10 text-sm"
          }`}
        />
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg gradient-hero px-4 font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95 ${
            size === "large" ? "h-10 text-sm" : "h-7 text-xs"
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
