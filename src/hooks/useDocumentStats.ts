import { useMemo } from "react";
import { useDocuments } from "./useDocuments";

export const useDocumentStats = () => {
  const { data: documents = [] } = useDocuments();

 // Debugging line to check the fetched documents

  const stats = useMemo(() => {
    //  const fields = documents.map(doc => doc.fields);
  // console.log("fields:", fields); 
    // Categories are built from the documents themselves: one per Type value,
    // so new types in the data appear here automatically.
    const typeCounts = new Map<string, number>();
    documents.forEach(doc => {
      const type = doc.Type as string | undefined;
      if (type && type.trim()) typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    });
    const categoriesWithCounts = Array.from(typeCounts, ([id, documentCount]) => ({
      id,
      name: id.trim(),
      documentCount,
    })).sort((a, b) => b.documentCount - a.documentCount || a.name.localeCompare(b.name));

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