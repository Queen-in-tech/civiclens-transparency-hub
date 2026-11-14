import { useMemo } from "react";
import { useDocuments } from "./useDocuments";
import { categories } from "@/data/mockData";

export const useDocumentStats = () => {
  const { data: documents = [] } = useDocuments();

 // Debugging line to check the fetched documents

  const stats = useMemo(() => {
    //  const fields = documents.map(doc => doc.fields);
  // console.log("fields:", fields); 
    // Calculate actual document counts for each category
    const categoriesWithCounts = categories.map(category => ({
      ...category,
      documentCount: documents.filter(doc => doc.Type === category.id).length
    }));

    // Calculate total documents
    const totalDocuments = documents.length;

    // Calculate documents by year
    const documentsByYear = documents.reduce((acc, doc) => {
      const year = new Date(doc["Date Published"]).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Calculate recent documents (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDocuments = documents.filter(doc => {
      const publishDate = new Date(doc["Date Published"]);
      return publishDate >= thirtyDaysAgo;
    }).length;

   
    return {
      categoriesWithCounts,
      totalDocuments,
      documentsByYear,
      recentDocuments,
      documents
    };
  }, [documents]);

  return stats;
};