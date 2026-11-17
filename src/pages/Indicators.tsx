import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Link2, Plus, RefreshCw, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService, type IndicatorObservation } from "@/data/apiService";

const COLORS = ["#006B3F", "#B07A00", "#1C2B6B", "#C2410C", "#3B82C4", "#6B5B4B"];
const INK = "#0A0A0C", GRID = "#DAD8D0", MUTED = "#5B5A54";
const MAX_SERIES = 6;
const EASE = "transition-all duration-200 ease-out";
const SOURCES: [RegExp, string][] = [[/wb|world/i, "World Bank"], [/imf/i, "IMF"], [/unicef/i, "UNICEF"]];
const PRIORITY = [/gdp growth|\.KD\.ZG/i, /inflation|\.CPI\./i, /population,? total|\.POP\.TOTL/i, /gdp.*current|\.MKTP\.CD/i, /unemploy/i, /exchange rate/i];

type Mode = "indexed" | "actual";
interface Row { period: number; value: number; projected: boolean }
interface Series { key: string; name: string; unit: string; source: string; updated: string | null; rows: Row[] }

const isPredicted = (o: IndicatorObservation) => /pred|projection|forecast/i.test(o.obs_status ?? "");
const sourceName = (id?: string) => SOURCES.find(([re]) => re.test(id ?? ""))?.[1] ?? (id || "Unknown");
const isPct = (unit: string) => /%|percent/i.test(unit);
const fmt = (v: number, unit: string) =>
  isPct(unit) ? `${v.toFixed(1)}%` : Math.abs(v) >= 1000
    ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(v)
    : v.toFixed(Math.abs(v) < 10 ? 2 : 1);
const observed = (s: Series) => s.rows.filter((r) => !r.projected);
const change = (s: Series) => {
  const o = observed(s);
  if (o.length < 2) return null;
  const [p, l] = [o[o.length - 2].value, o[o.length - 1].value];
  const d = isPct(s.unit) ? l - p : p ? (l / p - 1) * 100 : 0;
  return { text: `${d >= 0 ? "+" : ""}${d.toFixed(1)}${isPct(s.unit) ? " pp" : "%"}`, up: d >= 0 };
};
const ago = (ms: number) => {
  const m = Math.floor(ms / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ago`;
};

const Indicators = () => {
  const [params, setParams] = useSearchParams();
  const [now, setNow] = useState(Date.now());
  const [find, setFind] = useState("");
  const [copied, setCopied] = useState(false);
  const { data = [], isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["indicator-observations"],
    queryFn: apiService.getIndicatorObservations,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);

  const countries = useMemo(() => {
    const m = new Map<string, string>();
    data.forEach((o) => m.set(o.country_code, o.country_name));
    return Array.from(m, ([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);
  const country = params.get("c") ?? (countries.find((c) => /nigeria/i.test(c.name))?.code ?? countries[0]?.code ?? "");
  const range = params.get("r") ?? "10";
  const mode = (params.get("m") as Mode) ?? "indexed";
  const showProj = params.get("p") !== "0";
  const set = (k: string, v: string | null) => { const n = new URLSearchParams(params); v === null ? n.delete(k) : n.set(k, v); setParams(n, { replace: true }); };

  const series = useMemo(() => {
    const by = new Map<string, IndicatorObservation[]>();
    data.filter((o) => o.country_code === country && o.value !== null && Number.isFinite(o.value))
      .forEach((o) => { const k = `${o.source_id ?? ""}:${o.indicator_code}`; by.set(k, [...(by.get(k) ?? []), o]); });
    return Array.from(by, ([key, rows]): Series => {
      const s = [...rows].sort((a, b) => a.period - b.period);
      const updated = s.map((r) => r.source_last_updated).filter(Boolean).sort().pop() ?? null;
      return { key, name: s[0].indicator_name || s[0].indicator_code, unit: s[0].unit ?? "", source: sourceName(s[0].source_id), updated,
        rows: s.map((r) => ({ period: r.period, value: r.value as number, projected: isPredicted(r) })) };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [data, country]);

  const ticker = useMemo(() => {
    const picked = PRIORITY.flatMap((re) => series.filter((s) => re.test(`${s.name} ${s.key}`)).slice(0, 1));
    return (picked.length ? picked : series).slice(0, 6);
  }, [series]);

  const keys = (params.get("s")?.split(",").filter(Boolean) ?? ticker.slice(0, 2).map((s) => s.key))
    .filter((k) => series.some((s) => s.key === k)).slice(0, MAX_SERIES);
  const selected = keys.map((k) => series.find((s) => s.key === k) as Series);
  const toggle = (k: string) => set("s", (keys.includes(k) ? keys.filter((x) => x !== k) : keys.length < MAX_SERIES ? [...keys, k] : keys).join(",") || null);

  const { rows, axisOf } = useMemo(() => {
    const years = new Set<number>();
    selected.forEach((s) => s.rows.forEach((r) => (showProj || !r.projected) && years.add(r.period)));
    const maxY = Math.max(...years), minY = range === "all" ? -Infinity : maxY - Number(range) + 1;
    const vis = selected.map((s) => s.rows.filter((r) => r.period >= minY && r.period <= maxY && (showProj || !r.projected)));
    const lo = vis.map((v) => Math.min(...v.map((r) => r.value))), hi = vis.map((v) => Math.max(...v.map((r) => r.value)));
    const plot = (i: number, v: number) => mode === "actual" ? v : hi[i] === lo[i] ? 50 : ((v - lo[i]) / (hi[i] - lo[i])) * 100;
    const map = new Map<number, Record<string, number>>();
    vis.forEach((v, i) => {
      v.forEach((r) => {
        const o = map.get(r.period) ?? { period: r.period }; o[`v${i}`] = r.value; o[(r.projected ? "p" : "s") + i] = plot(i, r.value); map.set(r.period, o);
      });
      const last = [...v].reverse().find((r) => !r.projected);
      if (last && v.some((r) => r.projected)) (map.get(last.period) as Record<string, number>)[`p${i}`] = plot(i, last.value);
    });
    return { rows: Array.from(map.values()).sort((a, b) => a.period - b.period), axisOf: (i: number) => (selected[i].unit === selected[0].unit ? "L" : "R") };
  }, [selected, range, mode, showProj]);

  const csv = () => {
    const head = ["period", ...selected.map((s) => `"${s.name} (${s.unit})"`)].join(",");
    const body = rows.map((r) => [r.period, ...selected.map((_, i) => r[`v${i}`] ?? "")].join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[head, ...body].join("\n")], { type: "text/csv" }));
    a.download = "civiclens-indicators.csv"; a.click();
  };
  const share = async () => { await navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const list = series.filter((s) => `${s.name} ${s.source}`.toLowerCase().includes(find.toLowerCase()));
  const hasR = selected.some((_, i) => axisOf(i) === "R");
  const btn = (on: boolean) => `px-1 py-1 text-sm font-medium border-b-2 ${EASE} ${on ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`;

  return (
    <Layout>
      <div className="container-custom py-12">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="display-condensed font-display text-6xl font-extrabold leading-none tracking-tight md:text-7xl">Indicators</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">Pick series from the list and compare them on one chart. Every figure comes from the World Bank, IMF or UNICEF.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="sr-only" htmlFor="country">Country</label>
            <select id="country" value={country} onChange={(e) => set("c", e.target.value)} className="border-b-2 border-border bg-transparent py-1 font-medium focus:border-gold focus:outline-none">
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <span className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground" aria-live="polite">
              <span className={`h-2 w-2 rounded-full ${isError ? "bg-destructive" : "bg-gold"}`} aria-hidden="true" />
              {isError ? "Feed unavailable" : dataUpdatedAt ? `Updated ${ago(now - dataUpdatedAt)}` : "Loading"}
            </span>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />Refresh
            </Button>
          </div>
        </header>

        {isLoading && <Skeleton className="mt-10 h-[520px] rounded-none" />}
        {isError && !isLoading && (
          <p className="mt-10 border-y border-border py-6">We could not load the indicators. Check your connection and press Refresh.</p>
        )}

        {!isLoading && series.length > 0 && (
          <>
            <ul className="mt-10 flex overflow-x-auto border-y border-border" aria-label="Key figures">
              {ticker.map((s) => {
                const o = observed(s), l = o[o.length - 1], c = change(s);
                return (
                  <li key={s.key} className="shrink-0 border-r border-border last:border-r-0">
                    <button onClick={() => !keys.includes(s.key) && toggle(s.key)} className={`block min-w-[11rem] px-5 py-4 text-left hover:bg-secondary/60 ${EASE}`}>
                      <span className="block truncate text-xs text-muted-foreground">{s.name}</span>
                      <span className="block font-mono text-2xl font-medium tabular-nums">{l ? fmt(l.value, s.unit) : "n/a"}</span>
                      {c && <span className="font-mono text-xs tabular-nums">{c.up ? "▲" : "▼"} {c.text}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 grid gap-10 md:grid-cols-12">
              <aside className="md:col-span-4 lg:col-span-3" aria-label="Series list">
                <label htmlFor="find" className="sr-only">Search series</label>
                <input id="find" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search series"
                  className="w-full border-b-2 border-border bg-transparent py-2 focus:border-gold focus:outline-none" />
                <p className="mt-2 font-mono text-xs text-muted-foreground">{keys.length} of {MAX_SERIES} on chart</p>
                <ul className="mt-2 max-h-[560px] divide-y divide-border overflow-y-auto border-y border-border">
                  {list.slice(0, 80).map((s) => {
                    const i = keys.indexOf(s.key), o = observed(s), l = o[o.length - 1];
                    return (
                      <li key={s.key}>
                        <button onClick={() => toggle(s.key)} aria-pressed={i >= 0} disabled={i < 0 && keys.length >= MAX_SERIES}
                          className={`flex w-full items-start gap-3 py-3 text-left hover:bg-secondary/60 disabled:opacity-40 ${EASE}`}>
                          <span className="mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full" style={{ background: i >= 0 ? COLORS[i] : "transparent" }}>
                            {i < 0 && <Plus className="h-3 w-3 text-muted-foreground" aria-hidden="true" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 text-sm font-medium">{s.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">{s.source}{l ? `, ${l.period}` : ""}</span>
                          </span>
                          {l && <span className="font-mono text-sm tabular-nums">{fmt(l.value, s.unit)}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {list.length > 80 && <p className="mt-2 text-xs text-muted-foreground">Showing 80 of {list.length}. Search to narrow the list.</p>}
              </aside>

              <section className="md:col-span-8 lg:col-span-9" aria-label="Comparison chart">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-5" role="group" aria-label="Range">
                    {["5", "10", "all"].map((r) => <button key={r} aria-pressed={range === r} onClick={() => set("r", r)} className={btn(range === r)}>{r === "all" ? "All" : `${r}Y`}</button>)}
                  </div>
                  <div className="flex flex-wrap gap-5" role="group" aria-label="Chart options">
                    <button aria-pressed={mode === "indexed"} onClick={() => set("m", "indexed")} className={btn(mode === "indexed")}>Compare shapes</button>
                    <button aria-pressed={mode === "actual"} onClick={() => set("m", "actual")} className={btn(mode === "actual")}>Actual values</button>
                    <button aria-pressed={showProj} onClick={() => set("p", showProj ? "0" : null)} className={btn(showProj)}>Projections</button>
                  </div>
                </div>

                {selected.length === 0 ? (
                  <p className="mt-6 border-y border-border py-24 text-center text-muted-foreground">Pick a series from the list to start.</p>
                ) : (
                  <>
                    <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                      {selected.map((s, i) => (
                        <li key={s.key} className="flex items-center gap-2 text-sm">
                          <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i] }} aria-hidden="true" />{s.name}
                          <button onClick={() => toggle(s.key)} aria-label={`Remove ${s.name}`} className={`text-muted-foreground hover:text-foreground ${EASE}`}><X className="h-4 w-4" /></button>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 h-[440px]" role="img" aria-label={`Chart comparing ${selected.map((s) => s.name).join(", ")}. The table below has the same figures.`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                          <CartesianGrid stroke={GRID} vertical={false} />
                          <XAxis dataKey="period" tick={{ fill: MUTED, fontSize: 12, fontFamily: "JetBrains Mono" }} stroke={GRID} />
                          <YAxis yAxisId="L" domain={mode === "indexed" ? [0, 100] : ["auto", "auto"]} tick={{ fill: MUTED, fontSize: 12, fontFamily: "JetBrains Mono" }} stroke={GRID} width={48}
                            tickFormatter={(v) => mode === "indexed" ? String(v) : fmt(v, selected[0]?.unit ?? "")} />
                          {mode === "actual" && hasR && <YAxis yAxisId="R" orientation="right" tick={{ fill: MUTED, fontSize: 12, fontFamily: "JetBrains Mono" }} stroke={GRID} width={48} />}
                          <Tooltip cursor={{ stroke: INK, strokeWidth: 1 }} content={({ active, payload }) => {
                            const r = active ? (payload?.[0]?.payload as Record<string, number> | undefined) : undefined;
                            if (!r) return null;
                            return (
                              <div className="border border-border bg-card px-4 py-3 text-sm shadow-soft">
                                <p className="mb-1 font-mono font-medium">{r.period}</p>
                                {selected.map((s, i) => r[`v${i}`] !== undefined && (
                                  <p key={s.key} className="flex items-center justify-between gap-6">
                                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />{s.name}</span>
                                    <span className="font-mono tabular-nums">{fmt(r[`v${i}`], s.unit)}</span>
                                  </p>
                                ))}
                              </div>
                            );
                          }} />
                          {selected.map((s, i) => (
                            <Line key={`s${s.key}`} yAxisId={mode === "actual" ? axisOf(i) : "L"} dataKey={`s${i}`} stroke={COLORS[i]} strokeWidth={2.5} dot={false} connectNulls isAnimationActive={false} />
                          ))}
                          {showProj && selected.map((s, i) => (
                            <Line key={`p${s.key}`} yAxisId={mode === "actual" ? axisOf(i) : "L"} dataKey={`p${i}`} stroke={COLORS[i]} strokeWidth={2.5} strokeDasharray="6 5" dot={false} connectNulls isAnimationActive={false} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {mode === "indexed" ? "Each line is scaled from 0 (its lowest in this range) to 100 (its highest), so different units can share one chart. Hover for real values." : hasR ? "Series in a different unit from the first use the right axis." : "All series share one axis."} Dashed lines are projections.
                    </p>

                    <div className="mt-8 overflow-x-auto">
                      <table className="w-full min-w-[640px] border-y border-border text-sm">
                        <caption className="sr-only">Selected series</caption>
                        <thead><tr className="text-left text-xs text-muted-foreground">
                          {["Series", "Source", "Latest", "Change", "High", "Low", "Source updated"].map((h) => <th key={h} className="py-3 pr-4 font-medium">{h}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-border">
                          {selected.map((s, i) => {
                            const o = observed(s), l = o[o.length - 1], c = change(s), v = o.map((r) => r.value);
                            return (
                              <tr key={s.key}>
                                <td className="py-3 pr-4"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} aria-hidden="true" /><span className="font-medium">{s.name}</span><span className="ml-2 text-xs text-muted-foreground">{s.unit}</span></td>
                                <td className="py-3 pr-4">{s.source}</td>
                                <td className="py-3 pr-4 font-mono tabular-nums">{l ? `${fmt(l.value, s.unit)} (${l.period})` : "n/a"}</td>
                                <td className="py-3 pr-4 font-mono tabular-nums">{c ? c.text : "n/a"}</td>
                                <td className="py-3 pr-4 font-mono tabular-nums">{v.length ? fmt(Math.max(...v), s.unit) : "n/a"}</td>
                                <td className="py-3 pr-4 font-mono tabular-nums">{v.length ? fmt(Math.min(...v), s.unit) : "n/a"}</td>
                                <td className="py-3 pr-4 font-mono text-xs">{s.updated ? new Date(s.updated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "n/a"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-6 text-sm font-semibold text-primary">
                      <button onClick={csv} className={`inline-flex items-center gap-2 underline decoration-gold decoration-2 underline-offset-4 hover:gap-3 ${EASE}`}><Download className="h-4 w-4" aria-hidden="true" />Download CSV</button>
                      <button onClick={share} className={`inline-flex items-center gap-2 underline decoration-gold decoration-2 underline-offset-4 hover:gap-3 ${EASE}`}><Link2 className="h-4 w-4" aria-hidden="true" />{copied ? "Link copied" : "Copy link to this view"}</button>
                    </div>
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Indicators;
