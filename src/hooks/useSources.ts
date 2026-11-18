import { useQuery } from "@tanstack/react-query";

/**
 * The Sources page reads a public list of sources from an n8n webhook (VITE_SOURCES_URL).
 * Return ONLY these fields, built from the Sources table joined to the latest source-health row.
 * Do not forward whole NocoDB rows: they can hold internal notes and keys.
 *
 *   [{ id, name, url, kind: "documents" | "data" | "documents and data",
 *      status: "OK" | "DOWN" | "BLOCKED" | "NOT_FOUND" | "SERVER_ERROR" | "REDIRECT",
 *      lastChecked: ISO date, lastSuccess?: ISO date,
 *      inUse: true when CivicLens already holds documents or figures from this source }]
 *
 * A NocoDB-style wrapper { id, fields: {...} } is also accepted.
 */
export type SourceStatus = "OK" | "DOWN" | "BLOCKED" | "NOT_FOUND" | "SERVER_ERROR" | "REDIRECT" | "UNKNOWN";

export interface PublicSource {
  id: string;
  name: string;
  url: string;
  kind: string;
  status: SourceStatus;
  lastChecked: string | null;
  inUse: boolean;
}

export const SOURCES_URL: string | undefined = import.meta.env.VITE_SOURCES_URL || undefined;

const STATUSES = ["OK", "DOWN", "BLOCKED", "NOT_FOUND", "SERVER_ERROR", "REDIRECT"];

/* eslint-disable @typescript-eslint/no-explicit-any */
const normalise = (row: any): PublicSource => {
  const f = row?.fields ?? row;
  const status = String(f.status ?? "").toUpperCase();
  return {
    id: String(row?.id ?? f.id ?? f.name),
    name: String(f.name ?? f.Name ?? "Unnamed source"),
    url: String(f.url ?? f.URL ?? ""),
    kind: String(f.kind ?? ""),
    status: (STATUSES.includes(status) ? status : "UNKNOWN") as SourceStatus,
    lastChecked: f.lastChecked ?? null,
    inUse: f.inUse === true || f.inUse === "yes",
  };
};

export const useSources = () =>
  useQuery({
    queryKey: ["public-sources"],
    enabled: Boolean(SOURCES_URL),
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<PublicSource[]> => {
      const response = await fetch(SOURCES_URL as string);
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      return (Array.isArray(data) ? data : []).map(normalise);
    },
  });
