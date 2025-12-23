import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/data/apiService";

export const useDocuments = () => {
  return useQuery({
    queryKey: ["documents"],
    queryFn: apiService.getDocuments,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => apiService.getDocumentById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};