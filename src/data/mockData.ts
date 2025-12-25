import { FileText, BookOpen, BarChart3, Building2, ScrollText } from "lucide-react";
import { Category } from "@/components/shared/CategoryCard";

export const categories: Category[] = [
  {
    id: "Budget document",
    name: "Budget Documents",
    description: "Annual appropriation acts, budget proposals, and implementation reports from federal and state governments.",
    icon: FileText,
    documentCount: 156,
    color: "#1e40af",
  },
  {
    id: "MTEF policy document",
    name: "MTEF",
    description: "Medium-Term Expenditure Framework documents outlining multi-year fiscal planning and resource allocation.",
    icon: BarChart3,
    documentCount: 48,
    color: "#0d9488",
  },
  {
    id: "MTSS policy document",
    name: "MTSS",
    description: "Medium-Term Sector Strategies providing sector-specific development plans and budget frameworks.",
    icon: BookOpen,
    documentCount: 72,
    color: "#7c3aed",
  },
  {
    id: "Publication",
    name: "CBN Publications",
    description: "Central Bank of Nigeria research papers, economic reports, and financial stability assessments.",
    icon: Building2,
    documentCount: 234,
    color: "#dc2626",
  },
  {
    id: "Circular",
    name: "CBN Circulars",
    description: "Official circulars and directives from the Central Bank of Nigeria on monetary policy and banking regulations.",
    icon: ScrollText,
    documentCount: 189,
    color: "#ea580c",
  },
];
