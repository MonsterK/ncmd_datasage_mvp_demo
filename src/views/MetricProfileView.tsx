import { useMemo } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Flame, LineChart as LineChartIcon, Star, Database, Truck, Info, Share2, History } from "lucide-react"

import { Metric, Dimension } from "@/types"
import { MetricLineageDag } from "./MetricLineageDag"

export interface MetricProfileViewProps {
  metric: Metric
  dimensions: Dimension[]
  onDeriveMetric?: (metric: Metric) => void
  isFavorite?: boolean
  onToggleFavorite?: (fieldName: string) => void
  onNavigateWorkspace?: () => void
  onUpdateMetricStatus?: (fieldName: string, status: "Active" | "Draft") => void
}

export function MetricProfileView({
  metric,
  dimensions,
  onDeriveMetric,
  isFavorite,
  onToggleFavorite,
  onNavigateWorkspace,
  onUpdateMetricStatus,
}: MetricProfileViewProps) {
  const boundDimensions = useMemo(
    () => dimensions.filter((d) => metric.boundDimensionFieldNames.includes(d.fieldName)),
    [dimensions, metric.boundDimensionFieldNames],
  )
  const latestDeploy = useMemo(() => {
    if (!metric.deployHistory || metric.deployHistory.length === 0) return null
    return metric.deployHistory[metric.deployHistory.length - 1]
  }, [metric.deployHistory])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between bg-white/80 border-b border-slate-200/70 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-bold text-slate-900">{metric.businessName}</CardTitle>
              <Select
                value={metric.status}
                onValueChange={(val) => onUpdateMetricStatus?.(metric.fieldName, val as "Active" | "Draft")}
                disabled={!onUpdateMetricStatus}
              >
                <SelectTrigger className={`h-6 text-[10px] w-[80px] border-0 px-2 rounded-full ${metric.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                {metric.fieldName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">Category: {metric.categoryPath.join(" › ")}</span>
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
                delivery
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Business Information */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-500" />
                Business Information
              </CardTitle>
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Information */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-slate-500" />
              Technical Information
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Technical definition and online query configurations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5 text-xs">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <span className="text-slate-500">Tech owner</span>
                  <p className="font-medium text-slate-900">{metric.owners.techOwner}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Field Name</span>
                  <p className="font-mono text-slate-900">{metric.fieldName}</p>
                </div>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-800">Technical definition (pseudo SQL)</p>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-50 font-mono shadow-inner">
                <code>{metric.technicalDefinition}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Source Info */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
             <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Source Info
              </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Map fields to source CDM tables.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 text-xs">
            <div className="space-y-3">
              {metric.queryDefinitions.map((q) => (
                 <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px]">
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
                 </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Scenario */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
           <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
             <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-500" />
                Delivery Scenario
              </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Configure target and run preflight validation before delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 text-xs">
             <div className="space-y-1.5">
                <p className="font-semibold text-slate-800">Deploy status</p>
                {latestDeploy ? (
                  <div className="text-xs text-slate-600 space-y-2">
                    <div>
                      {latestDeploy.targetType} · {latestDeploy.target}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {latestDeploy.status} · {new Date(latestDeploy.deployedAt).toLocaleString()}
                    </div>
                    {metric.deployHistory && metric.deployHistory.length > 1 && (
                      <div className="space-y-1 text-[11px] text-slate-500">
                        {metric.deployHistory.slice(-3).reverse().map((item, index) => (
                          <div key={`${item.target}-${item.deployedAt}-${index}`}>
                            {item.targetType} · {item.target} · {item.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No deploy history yet.</p>
                )}
              </div>
          </CardContent>
        </Card>

        {/* Lineage */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-blue-500" />
              Metric Lineage
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Metric lineage.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[200px]">
              <MetricLineageDag metric={metric} />
            </div>
          </CardContent>
        </Card>

        {/* Version History */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-purple-500" />
              Version History
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Change logs for this metric.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
