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
    <div className="space-y-6 max-w-2xl mx-auto py-8 px-4">
      {/* Metric Detail Card */}
      <div className="bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6 border border-slate-100">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-slate-900 leading-none">{metric.businessName}</h1>
            <div className="bg-slate-100 text-slate-600 text-[12px] font-medium px-3 py-1.5 rounded-full font-mono">
              {metric.fieldName}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-[12px] font-medium text-white ${metric.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
              {metric.status}
            </div>
            {onToggleFavorite && (
              <button 
                onClick={() => onToggleFavorite(metric.fieldName)}
                className="text-slate-400 hover:text-yellow-400 transition-colors"
              >
                <Star className={`h-5 w-5 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-[16px] text-slate-500 leading-normal mb-4">
          {metric.businessDefinition}
        </p>

        {/* Info Section */}
        <div className="space-y-3 mb-4">
          {/* Owners */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
               <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {metric.owners.businessOwner.charAt(0).toUpperCase()}
               </div>
               <span className="text-[14px] text-slate-700 font-medium">{metric.owners.businessOwner}</span>
            </div>
             <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
               <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {metric.owners.techOwner.charAt(0).toUpperCase()}
               </div>
               <span className="text-[14px] text-slate-700 font-medium">{metric.owners.techOwner}</span>
            </div>
          </div>

          {/* Deploy Status */}
           <div className="flex items-center gap-2">
              <span className="text-[14px] text-sky-600 font-medium bg-sky-50 px-3 py-1.5 rounded-full border border-sky-100">
                Deploy: {latestDeploy ? `${latestDeploy.targetType} · ${latestDeploy.status}` : "Not deployed"}
              </span>
           </div>
        </div>
        
         {/* Heat Indicator */}
        <div className="mb-6">
           <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100">
              <Flame className="h-4 w-4" />
              <span className="text-[14px] font-medium">{metric.heat || 0} Heat</span>
           </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <span className="text-[14px] text-slate-500 font-medium">delivery</span>
          <span className="text-[14px] text-slate-500 font-medium">
             {metric.updatedAt ? new Date(metric.updatedAt).toLocaleDateString() : "-"}
          </span>
        </div>
      </div>

      <div className="grid gap-6">
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
            <div className="space-y-4">
              {metric.queryDefinitions.map((q) => (
                 <div key={q.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 last:pb-0 border-b last:border-0 border-slate-100">
                    <div className="space-y-1">
                      <span className="text-slate-500">Source Table</span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate">
                          {q.source}
                        </p>
                        <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-700 font-mono">
                          {q.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500">Source Field</span>
                      <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 break-all">
                        {q.fields && q.fields.length > 0 ? q.fields.join(", ") : (q.expression || "Not configured")}
                      </p>
                    </div>
                 </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deploy Scenario */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
           <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
             <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-500" />
                Deploy Scenario
              </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Configure target and run preflight validation before deploy.
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
