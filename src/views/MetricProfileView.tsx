import { useMemo } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flame, LineChart as LineChartIcon, Star } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

import { Metric, Dimension } from "@/types"
import { MetricLineageDag } from "./MetricLineageDag"

export interface MetricProfileViewProps {
  metric: Metric
  dimensions: Dimension[]
  onDeriveMetric?: (metric: Metric) => void
  isFavorite?: boolean
  onToggleFavorite?: (fieldName: string) => void
  onNavigateWorkspace?: () => void
}

export function MetricProfileView({
  metric,
  dimensions,
  onDeriveMetric,
  isFavorite,
  onToggleFavorite,
  onNavigateWorkspace,
}: MetricProfileViewProps) {
  const boundDimensions = useMemo(
    () => dimensions.filter((d) => metric.boundDimensionFieldNames.includes(d.fieldName)),
    [dimensions, metric.boundDimensionFieldNames],
  )
  const latestDispatch = useMemo(() => {
    if (!metric.dispatchHistory || metric.dispatchHistory.length === 0) return null
    return metric.dispatchHistory[metric.dispatchHistory.length - 1]
  }, [metric.dispatchHistory])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between bg-white/80 border-b border-slate-200/70 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-bold text-slate-900">{metric.businessName}</CardTitle>
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full border-slate-200 ${metric.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                {metric.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                {metric.fieldName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">Category: {metric.categoryPath.join(" › ")}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">Tenant: {metric.tenant}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 capitalize">{metric.dataType || "decimal"}</span>
              {metric.unit && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">Unit: {metric.unit}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(metric.fieldName)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:border-yellow-300 hover:text-yellow-600"
              >
                <Star className={`h-3.5 w-3.5 ${isFavorite ? "text-yellow-500 fill-yellow-400" : "text-slate-300"}`} />
                {isFavorite ? "Favorited" : "Favorite"}
              </button>
            )}
            {onDeriveMetric && (
              <button
                type="button"
                className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                onClick={() => onDeriveMetric(metric)}
              >
                Derive metric
              </button>
            )}
            {onNavigateWorkspace && (
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700"
                onClick={onNavigateWorkspace}
              >
                deploy
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-sm font-bold text-slate-900">Overview</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Business definition and ownership details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-800">Business definition</p>
                <p className="text-slate-600 leading-relaxed">{metric.businessDefinition}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500">Business owner</span>
                  <p className="font-medium text-slate-900">{metric.owners.businessOwner}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Tech owner</span>
                  <p className="font-medium text-slate-900">{metric.owners.techOwner}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Data type</span>
                  <p className="text-slate-700 capitalize">{metric.dataType || "decimal"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Unit</span>
                  <p className="text-slate-700">{metric.unit || "-"}</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <p className="font-semibold text-slate-800">Dispatch status</p>
                {latestDispatch ? (
                  <div className="text-xs text-slate-600 space-y-2">
                    <div>
                      {latestDispatch.targetType} · {latestDispatch.target}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {latestDispatch.status} · {new Date(latestDispatch.dispatchedAt).toLocaleString()}
                    </div>
                    {metric.dispatchHistory && metric.dispatchHistory.length > 1 && (
                      <div className="space-y-1 text-[11px] text-slate-500">
                        {metric.dispatchHistory.slice(-3).reverse().map((item, index) => (
                          <div key={`${item.target}-${item.dispatchedAt}-${index}`}>
                            {item.targetType} · {item.target} · {item.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No dispatch history yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Usage
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Heat and bound dimensions summary.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                  <div className="text-xl font-bold text-orange-600">{metric.heat ?? 0}</div>
                  <div className="text-[10px] font-medium text-orange-700/70 uppercase tracking-wide mt-1">
                    Usage Heat
                  </div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="text-xl font-bold text-blue-600">{boundDimensions.length}</div>
                  <div className="text-[10px] font-medium text-blue-700/70 uppercase tracking-wide mt-1">
                    Bound Dimensions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-bold text-slate-900">Definition & Query</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Technical definition and online query configurations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5 text-xs">
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-800">Technical definition (pseudo SQL)</p>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-50 font-mono shadow-inner">
                <code>{metric.technicalDefinition}</code>
              </pre>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-slate-800">Online queries</p>
              <div className="space-y-3">
                {metric.queryDefinitions.map((q) => {
                  const relatedDatasets = Array.from(
                    new Set([q.source, ...(q.relatedDatasets ?? []), ...(q.createInDownstream ?? [])]),
                  )

                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px] transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm"
                    >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-700 font-mono">
                        {q.type}
                      </Badge>
                      <span className="font-mono text-[11px] text-slate-500">{q.source}</span>
                    </div>
                    {q.expression && (
                      <div className="mb-3">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Expression</span>
                        <code className="block text-slate-700 bg-slate-100 px-2 py-1.5 rounded border border-slate-200 font-mono text-[10px] whitespace-pre-wrap">
                          {q.expression}
                        </code>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-200/50">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Related Datasets</span>
                      <div className="flex flex-wrap gap-3">
                        {relatedDatasets.map((dataset) => {
                          const isSource = dataset === q.source
                          return (
                            <a
                              key={dataset}
                              href={`https://aeolus-sg.tiktok-row.net/dataset/${dataset.replace(/\s+/g, "_")}`}
                              target="_blank"
                              rel="noreferrer"
                              className={isSource ? "text-blue-600 hover:underline text-[10px] flex items-center gap-1 font-medium" : "text-purple-600 hover:underline text-[10px] flex items-center gap-1 font-medium"}
                            >
                              {isSource ? "Source" : "Related"}: {dataset}
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <p className="font-semibold text-slate-800">Available dimensions</p>
              {boundDimensions.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {boundDimensions.map((d) => (
                    <Badge key={d.id} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 px-2 py-1">
                      {d.name} <span className="ml-1 opacity-50 font-normal">({d.fieldName})</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No bound dimensions in the mock data.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <LineChartIcon className="h-4 w-4 text-blue-500" />
                30 day trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metric.trend30d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 11, borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: "#dbeafe", strokeWidth: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-sm font-bold text-slate-900">Top dimensions</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-52">
                {metric.topDimensions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metric.topDimensions} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} width={80} />
                      <RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ fontSize: 11, borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-xs text-slate-400">No dimension data available.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-0 border-b border-slate-100 bg-slate-50/30">
            <Tabs defaultValue="lineage" className="w-full">
              <div className="flex items-center justify-between px-4 py-2">
                <CardTitle className="text-sm font-bold text-slate-900">Context</CardTitle>
                <TabsList className="h-7 bg-slate-200/50 p-0.5 rounded-lg">
                  <TabsTrigger value="lineage" className="h-6 text-[10px] rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Lineage</TabsTrigger>
                  <TabsTrigger value="knowledge" className="h-6 text-[10px] rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Knowledge</TabsTrigger>
                  <TabsTrigger value="history" className="h-6 text-[10px] rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Version History</TabsTrigger>
                </TabsList>
              </div>
              <CardContent className="p-4">
                <TabsContent value="lineage" className="mt-0">
                  <div className="h-[200px]">
                    <MetricLineageDag metric={metric} />
                  </div>
                </TabsContent>
                <TabsContent value="knowledge" className="mt-0 text-xs text-slate-600">
                  <ul className="space-y-2 list-disc pl-4 marker:text-slate-400">
                    <li>Product requirement documents that define the SGI / QBR program logic.</li>
                    <li>Runbooks explaining how to debug data issues for this metric.</li>
                    <li>Business guidelines on how to interpret trends and thresholds.</li>
                  </ul>
                </TabsContent>
                <TabsContent value="history" className="mt-0">
                  <div className="space-y-3">
                    {metric.history?.map((log, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <div className="min-w-[40px] pt-0.5 flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                          {i !== (metric.history?.length ?? 0) - 1 && <div className="w-px h-full bg-slate-200 my-1"></div>}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900">{log.version}</span>
                            <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[9px] bg-white px-1.5 py-0 h-4">
                                {log.action}
                              </Badge>
                              <span className="font-medium text-slate-700">{log.editor}</span>
                            </div>
                            {log.comment && <p className="text-slate-600 italic">"{log.comment}"</p>}
                          </div>
                        </div>
                      </div>
                    )) ?? <p className="text-slate-400 italic">No history available.</p>}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
