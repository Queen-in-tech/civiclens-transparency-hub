import { Link } from "react-router-dom";
import { LucideIcon, ChevronRight } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  documentCount: number;
  color: string;
}

interface CategoryCardProps {
  category: Category;
  variant?: "default" | "compact";
}

const CategoryCard = ({ category, variant = "default" }: CategoryCardProps) => {
  const Icon = category.icon;

  if (variant === "compact") {
    return (
      <Link
        to={`/documents?category=${category.id}`}
        className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-soft"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${category.color}15`, color: category.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground text-sm truncate">
            {category.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {category.documentCount} documents
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>
    );
  }

  return (
    <Link
      to={`/documents?category=${category.id}`}
      className="group block rounded-xl border border-border bg-card p-6 card-hover"
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${category.color}15`, color: category.color }}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {category.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {category.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-accent">
          {category.documentCount} documents
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
};

export default CategoryCard;
