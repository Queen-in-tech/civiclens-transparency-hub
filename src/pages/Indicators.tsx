import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowDownAZ, BarChart3, Check, ChevronRight, ExternalLink, RefreshCw, Search, X } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Layout from "@/components/layout/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiService, type IndicatorObservation } from "@/data/apiService";

type IndicatorSeries = {
  key: string;
  code: string;
  name: string;
  unit: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  observations: (IndicatorObservation & { chartValue: number })[];
  scale: number;
};

type GroupMode = "source" | "topic" | "none";
type SortMode = "name" | "latest" | "year" | "observations";

const knownSources: Record<string, string> = {
  "137": "World Bank",
  "138": "IMF DataMapper",
  "140": "UNICEF Data Warehouse (SDMX)",
};

const scaleFor = (unit: string, largestValue: number) => {
  if (/usd|currency|current prices/i.test(unit)) return 1_000_000_000;
  if (/person|population/i.test(unit)) return 1_000_000;
  if (/percent|%/i.test(unit)) return 1;
  if (largestValue >= 1_000_000_000) return 1_000_000_000;
  if (largestValue >= 1_000_000) return 1_000_000;
  if (largestValue >= 1_000) return 1_000;
  return 1;
};

const formatValue = (value: number, unit: string, scale: number) => {
  const scaled = value / scale;
  const formatted = scaled.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (/usd|currency|current prices/i.test(unit)) return `$${formatted}B`;
  if (/person|population/i.test(unit)) return `${formatted}M`;
  if (/percent|%/i.test(unit)) return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  const suffix = scale >= 1_000_000_000 ? "B" : scale >= 1_000_000 ? "M" : scale >= 1_000 ? "K" : "";
  return `${formatted}${suffix} ${unit}`.trim();
};

const formatDate = (value?: string) => {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const latestObservation = (series: IndicatorSeries) => series.observations[series.observations.length - 1];

const isPredicted = (observation?: IndicatorObservation) => /pred|projection|forecast/i.test(observation?.obs_status || "");
const isProjection = (observation?: IndicatorObservation) => isPredicted(observation) && (observation?.period ?? 0) > new Date().getFullYear();

const observationLabel = (observation?: IndicatorObservation) => {
  if (!observation) return "No observation";
  if (isProjection(observation)) return `Projection · ${observation.period}`;
  if (isPredicted(observation)) return `Predicted value · ${observation.period}`;
  if (/estimate/i.test(observation.obs_status || "")) return `Historical estimate · ${observation.period}`;
  return `Year ${observation.period}`;
};

const topicFor = (name: string, code: string) => {
  const text = `${name} ${code}`.toLowerCase();
  if (/population|demograph|fertility|life expectancy|migration/.test(text)) return "People & population";
  if (/inflation|consumer price|price index|cpi/.test(text)) return "Prices & inflation";
  if (/gdp|gross domestic|growth|investment|trade|export|import|account|debt|fiscal|revenue|expenditure|unemployment|employment/.test(text)) return "Economy & public finance";
  if (/health|education|poverty|school|literacy|mortality|nutrition/.test(text)) return "People & services";
  return "Other indicators";
};

const Indicators = () => {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [groupMode, setGroupMode] = useState<GroupMode>("source");
  const [selectedSeriesKey, setSelectedSeriesKey] = useState("");
  const [compareCodes, setCompareCodes] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const { data = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["indicator-observations"],
    queryFn: apiService.getIndicatorObservations,
    staleTime: 5 * 60 * 1000,
  });

  const countries = useMemo(() => {
    const countryMap = new Map<string, string>();
    data.forEach((item) => countryMap.set(item.country_code, item.country_name));
    return Array.from(countryMap, ([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const activeCountry = countries.some((country) => country.code === selectedCountry)
    ? selectedCountry
    : countries[0]?.code ?? "";

  const countrySeries = useMemo(() => {
    const bySeries = new Map<string, IndicatorObservation[]>();
    data
      .filter((item) => item.country_code === activeCountry && item.value !== null && Number.isFinite(item.value))
      .forEach((item) => {
        const key = `${item.source_id ?? "unknown"}:${item.indicator_code}`;
        const rows = bySeries.get(key) ?? [];
        rows.push(item);
        bySeries.set(key, rows);
      });

    return Array.from(bySeries.entries()).map(([key, rows]): IndicatorSeries => {
      const sorted = [...rows].sort((a, b) => a.period - b.period);
      const unit = sorted[0]?.unit ?? "";
      const largestValue = Math.max(...sorted.map((row) => Math.abs(row.value ?? 0)));
      const sourceId = sorted[0]?.source_id || "unknown";
      const sourceName = knownSources[sourceId] || (sourceId === "unknown" ? "Unknown source" : `Source ${sourceId}`);
      const sourceUrl = sorted[sorted.length - 1]?.source_url ?? "";
      const name = sorted[0]?.indicator_name || sorted[0]?.indicator_code || key;
      const projectionStart = sorted.findIndex((row) => isPredicted(row));
      const observations = sorted.map((row, index) => {
        const chartValue = (row.value ?? 0) / scaleFor(unit, largestValue);
        const projected = isPredicted(row);
        const isProjectionBoundary = projectionStart > 0 && index === projectionStart - 1;
        return {
          ...row,
          chartValue,
          observedValue: projected ? null : chartValue,
          projectionValue: projected || isProjectionBoundary ? chartValue : null,
        };
      });
      return {
        key,
        code: sorted[0]?.indicator_code || key,
        name,
        unit,
        sourceId,
        sourceName,
        sourceUrl,
        topic: topicFor(name, sorted[0]?.indicator_code || key),
        scale: scaleFor(unit, largestValue),
        observations,
      };
    });
  }, [activeCountry, data]);

  const sources = useMemo(() => {
    const unique = new Map<string, string>();
    countrySeries.forEach((item) => unique.set(item.sourceId, item.sourceName));
    return Array.from(unique, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [countrySeries]);

  const series = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return countrySeries
      .filter((item) => selectedSource === "all" || item.sourceId === selectedSource)
      .filter((item) => !search || `${item.name} ${item.code} ${item.unit} ${item.sourceName}`.toLowerCase().includes(search))
      .sort((a, b) => {
        if (sortMode === "latest") return (latestObservation(b)?.value ?? -Infinity) - (latestObservation(a)?.value ?? -Infinity);
        if (sortMode === "year") return (latestObservation(b)?.period ?? 0) - (latestObservation(a)?.period ?? 0);
        if (sortMode === "observations") return b.observations.length - a.observations.length;
        return a.name.localeCompare(b.name);
      });
  }, [countrySeries, searchTerm, selectedSource, sortMode]);

  useEffect(() => { setPage(1); }, [activeCountry, searchTerm, selectedSource, sortMode, groupMode]);
  const pageCount = Math.max(1, Math.ceil(series.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageSeries = series.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const groups = useMemo(() => {
    if (groupMode === "none") return [{ key: "all", title: "All indicators", items: pageSeries }];
    const byGroup = new Map<string, IndicatorSeries[]>();
    pageSeries.forEach((item) => {
      const title = groupMode === "source" ? item.sourceName : item.topic;
      const rows = byGroup.get(title) ?? [];
      rows.push(item);
      byGroup.set(title, rows);
    });
    return Array.from(byGroup, ([title, items]) => ({ key: title, title, items }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [groupMode, pageSeries]);

  const visibleObservationCount = series.reduce((total, item) => total + item.observations.length, 0);
  const sourceLastUpdated = series.reduce<string | undefined>((newest, item) => {
    item.observations.forEach((row) => {
      if (row.source_last_updated && (!newest || row.source_last_updated > newest)) newest = row.source_last_updated;
    });
    return newest;
  }, undefined);
  const selectedSeries = countrySeries.find((item) => item.key === selectedSeriesKey);
  const selectedLatest = selectedSeries?.observations[selectedSeries.observations.length - 1];
  const comparedSeries = compareCodes.map((key) => countrySeries.find((item) => item.key === key)).filter((item): item is IndicatorSeries => Boolean(item));

  const toggleCompare = (code: string) => {
    setCompareCodes((current) => current.includes(code)
      ? current.filter((item) => item !== code)
      : current.length < 4 ? [...current, code] : current);
  };

  const closeSheet = (open: boolean) => {
    if (!open) {
      setSelectedSeriesKey("");
      setComparisonOpen(false);
    }
  };

  return (
    <Layout>
      <section className="bg-gradient-to-br from-primary via-primary/95 to-accent/80 py-14 md:py-20">
        <div className="container-custom">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-primary-foreground/65">Civic data</p>
          <h1 className="mb-4 text-3xl font-bold text-primary-foreground md:text-5xl">Indicators dashboard</h1>
          <p className="max-w-2xl text-base leading-relaxed text-primary-foreground/80 md:text-lg">
            Explore public indicators by publisher, compare trends, and open each series to see its source and values.
          </p>
        </div>
      </section>

      <section className="container-custom py-10 md:py-14">
        <div className="mb-7 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Available indicator series</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeCountry ? `${countries.find((country) => country.code === activeCountry)?.name} · ` : ""}
                {isLoading ? "Loading series…" : `${series.length} series · ${visibleObservationCount.toLocaleString()} observations · ${sources.length} sources`}
                {sourceLastUpdated ? ` · source data updated ${formatDate(sourceLastUpdated)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {countries.length > 1 && (
                <Select value={activeCountry} onValueChange={(value) => { setSelectedCountry(value); setCompareCodes([]); }}>
                  <SelectTrigger className="w-full sm:w-[170px]" aria-label="Filter by country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <div className="relative w-full sm:w-[230px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Find an indicator"
                  aria-label="Search indicator name, code, unit or source"
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-full bg-background sm:w-[190px]" aria-label="Filter by data source">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {sources.map((source) => <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={groupMode} onValueChange={(value) => setGroupMode(value as GroupMode)}>
                <SelectTrigger className="w-full bg-background sm:w-[165px]" aria-label="Group indicators">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="source">Group by source</SelectItem>
                  <SelectItem value="topic">Group by topic</SelectItem>
                  <SelectItem value="none">No groups</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                <SelectTrigger className="w-full bg-background sm:w-[190px]" aria-label="Sort indicators">
                  <ArrowDownAZ className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name, A–Z</SelectItem>
                  <SelectItem value="latest">Latest value, high to low</SelectItem>
                  <SelectItem value="year">Most recent year</SelectItem>
                  <SelectItem value="observations">Most observations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs text-muted-foreground">Select up to 4 indicators</span>
              <Button onClick={() => { setSelectedSeriesKey(""); setComparisonOpen(true); }} disabled={compareCodes.length < 2}>
                <BarChart3 className="mr-2 h-4 w-4" />Compare{compareCodes.length ? ` (${compareCodes.length})` : ""}
              </Button>
            </div>
          </div>
        </div>

        {isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Indicator data is unavailable</AlertTitle>
            <AlertDescription>We couldn’t load the series. Try refreshing in a moment.</AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && series.length === 0 && (
          <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">
            {data.length === 0 ? "No indicator observations have been added yet." : "No indicators match these filters."}
          </CardContent></Card>
        )}

        <div className="space-y-9">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.title}>
              {groupMode !== "none" && (
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-foreground">{group.title}</h3>
                  <span className="text-xs text-muted-foreground">{group.items.length} series</span>
                </div>
              )}
              <div className="grid gap-3">
                {group.items.map((item) => {
                  const latest = item.observations[item.observations.length - 1];
                  const isCompared = compareCodes.includes(item.key);
                  return (
                    <Card key={`${activeCountry}-${item.sourceId}-${item.code}`} className={`transition-colors ${isCompared ? "border-accent ring-1 ring-accent/30" : "hover:border-accent/40"}`}>
                      <div className="flex items-stretch gap-2 p-3 sm:gap-4 sm:p-4">
                        <label className="flex shrink-0 cursor-pointer items-start gap-2 pt-2 text-xs text-muted-foreground" title="Add to comparison">
                          <input
                            type="checkbox"
                            checked={isCompared}
                            disabled={!isCompared && compareCodes.length >= 4}
                            onChange={() => toggleCompare(item.key)}
                            aria-label={`${isCompared ? "Remove" : "Add"} ${item.name} ${isCompared ? "from" : "to"} comparison`}
                            className="mt-0.5 h-4 w-4 accent-[hsl(var(--accent))]"
                          />
                          <span className="sr-only">Compare</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => { setComparisonOpen(false); setSelectedSeriesKey(item.key); }}
                          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`View chart and source for ${item.name}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block line-clamp-2 break-words font-semibold leading-snug text-foreground" title={item.name}>{item.name}</span>
                            <span className="mt-1 block break-words text-sm text-muted-foreground">{item.code} · {item.unit || "unit not specified"}</span>
                            <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 font-medium text-foreground/75"><ExternalLink className="h-3 w-3" />{item.sourceName}</span>
                              <span aria-hidden="true">·</span><span>{item.observations.length} observations</span>
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2 sm:gap-3">
                            <span className="text-right">
                              <span className="block whitespace-nowrap font-semibold text-foreground">{latest ? formatValue(latest.value ?? 0, item.unit, item.scale) : "—"}</span>
                              <span className={`mt-1 block text-xs ${isPredicted(latest) ? "font-medium text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>{observationLabel(latest)}</span>
                            </span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </span>
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {series.length > pageSize && <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-5 sm:flex-row">
          <p className="text-sm text-muted-foreground">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, series.length)} of {series.length} indicators</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>Previous</Button>
            <span className="min-w-20 text-center text-sm text-muted-foreground">Page {currentPage} of {pageCount}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>Next</Button>
          </div>
        </div>}

        <Sheet open={Boolean(selectedSeries) || comparisonOpen} onOpenChange={closeSheet}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-4xl">
            {comparisonOpen ? (
              <>
                <SheetHeader className="pr-8">
                  <SheetTitle>Compare indicator trends</SheetTitle>
                  <SheetDescription>Each series has its own scale, unit, and source so values remain readable.</SheetDescription>
                </SheetHeader>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {comparedSeries.map((item) => (
                    <Card key={`${item.sourceId}-${item.code}`}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="break-words text-base leading-snug">{item.name}</CardTitle>
                            <CardDescription className="mt-1 break-words">{item.sourceName} · {item.unit || "unit not specified"}</CardDescription>
                          </div>
                          <Button variant="ghost" size="icon" aria-label={`Remove ${item.name} from comparison`} onClick={() => toggleCompare(item.key)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="px-2 pb-3">
                        <div className="h-[210px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={item.observations} margin={{ top: 8, right: 12, left: 4, bottom: 2 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="period" tickLine={false} axisLine={false} minTickGap={20} />
                              <YAxis tickFormatter={(value: number) => formatValue(value * item.scale, item.unit, item.scale).split(" ")[0]} tickLine={false} axisLine={false} width={58} tick={{ fontSize: 11 }} />
                              <Tooltip
                                formatter={(value: number) => [formatValue(value * item.scale, item.unit, item.scale), item.name]}
                                labelFormatter={(label) => `Year ${label}`}
                                contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }}
                              />
                              <Line type="monotone" dataKey="observedValue" name="Historical" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                              <Line type="monotone" dataKey="projectionValue" name="Predicted / projected" stroke="hsl(var(--accent))" strokeWidth={2.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="px-2 text-xs text-muted-foreground">{item.observations.length} annual observations · {item.observations[0]?.period}–{latestObservation(item)?.period}{item.observations.some(isPredicted) ? " · solid = other values, dashed = source-predicted values" : ""}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : selectedSeries ? (
              <>
                <SheetHeader className="pr-8">
                  <SheetTitle>{selectedSeries.name}</SheetTitle>
                  <SheetDescription>{selectedSeries.code} · {selectedSeries.unit || "unit not specified"} · {selectedSeries.sourceName}</SheetDescription>
                </SheetHeader>

                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="p-4 pb-2"><CardDescription>Latest value</CardDescription><CardTitle className="text-xl">{selectedLatest ? formatValue(selectedLatest.value ?? 0, selectedSeries.unit, selectedSeries.scale) : "—"}</CardTitle></CardHeader>
                    <CardContent className={`px-4 pb-4 text-xs ${isPredicted(selectedLatest) ? "font-medium text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>{observationLabel(selectedLatest)}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2"><CardDescription>Observations</CardDescription><CardTitle className="text-xl">{selectedSeries.observations.length.toLocaleString()}</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 text-xs text-muted-foreground">Annual values available</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2"><CardDescription>Source updated</CardDescription><CardTitle className="text-xl">{formatDate(selectedLatest?.source_last_updated)}</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 text-xs text-muted-foreground">Retrieved {formatDate(selectedLatest?.fetched_at)}</CardContent>
                  </Card>
                </div>

                <Card className="mt-5">
                  <CardHeader><CardTitle className="text-base">Indicator trend</CardTitle><CardDescription>{selectedSeries.observations[0]?.period}–{selectedLatest?.period} · {selectedSeries.unit || "unit not specified"}{selectedSeries.observations.some(isPredicted) ? " · solid = other values, dashed = source-predicted values" : ""}</CardDescription></CardHeader>
                  <CardContent>
                    <div className="h-[340px] w-full" aria-label={`${selectedSeries.name} annual trend chart`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedSeries.observations} margin={{ top: 8, right: 18, left: 8, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="period" tickLine={false} axisLine={false} minTickGap={22} />
                          <YAxis tickFormatter={(value: number) => formatValue(value * selectedSeries.scale, selectedSeries.unit, selectedSeries.scale).split(" ")[0]} tickLine={false} axisLine={false} width={64} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value: number, name: string) => [formatValue(value * selectedSeries.scale, selectedSeries.unit, selectedSeries.scale), name]} labelFormatter={(label) => `Year ${label}`} contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }} />
                          <Line type="monotone" dataKey="observedValue" name="Historical" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "hsl(var(--accent))" }} connectNulls={false} />
                          <Line type="monotone" dataKey="projectionValue" name="Predicted / projected" stroke="hsl(var(--accent))" strokeWidth={2.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 5, fill: "hsl(var(--accent))" }} connectNulls={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-5 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Source: {selectedSeries.sourceName}</p>
                    {isPredicted(selectedLatest) && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">{isProjection(selectedLatest) ? "Latest value is a projection" : "Latest value is marked predicted by source"}</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Indicator code {selectedSeries.code} · source ID {selectedSeries.sourceId}</p>
                  {selectedLatest?.obs_status && <p className="mt-2 text-xs text-muted-foreground">Source observation status: {selectedLatest.obs_status}</p>}
                  {selectedSeries.sourceUrl && <a href={selectedSeries.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 font-medium text-accent hover:underline">Open source series <ExternalLink className="h-3.5 w-3.5" /></a>}
                </div>
              </>
            ) : null}
          </SheetContent>
        </Sheet>

        {compareCodes.length > 0 && !comparisonOpen && (
          <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg">
            <span className="inline-flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-accent" />{compareCodes.length} selected</span>
              <Button size="sm" onClick={() => { setSelectedSeriesKey(""); setComparisonOpen(true); }} disabled={compareCodes.length < 2}>Compare</Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCompareCodes([])} aria-label="Clear comparison selection"><X className="h-4 w-4" /></Button>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Indicators;
