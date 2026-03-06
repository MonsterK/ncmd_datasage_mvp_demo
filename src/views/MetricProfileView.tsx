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
    <div className="space-y-4 max-w-2xl mx-auto py-6 px-4">
      {/* Metric Detail Card */}
      <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-5 border border-slate-100">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-bold text-slate-900 leading-tight">{metric.businessName}</h1>
            <div className="bg-slate-50 text-slate-500 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-100">
              {metric.fieldName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white ${metric.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
              {metric.status}
            </div>
            {onToggleFavorite && (
              <button 
                onClick={() => onToggleFavorite(metric.fieldName)}
                className="text-slate-300 hover:text-yellow-400 transition-colors"
              >
                <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-slate-500 leading-relaxed mb-4 line-clamp-2">
          {metric.businessDefinition}
        </p>

        {/* Info Grid */}
        <div className="flex items-center gap-6 mb-4 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
               <div className="h-6 w-6 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[9px] font-bold text-indigo-600 shadow-sm" title={metric.owners.businessOwner}>
                  {metric.owners.businessOwner.charAt(0).toUpperCase()}
               </div>
               <div className="h-6 w-6 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[9px] font-bold text-blue-600 shadow-sm" title={metric.owners.techOwner}>
                  {metric.owners.techOwner.charAt(0).toUpperCase()}
               </div>
            </div>
            <div className="text-[11px] text-slate-400">Owners</div>
          </div>
          
           <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-[11px] font-medium text-slate-600">{metric.heat || 0} Heat</span>
           </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>delivery</span>
          <span>
             Updated {metric.updatedAt ? new Date(metric.updatedAt).toLocaleDateString() : "-"}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Technical Information */}
        <Card className="border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] rounded-xl overflow-hidden">
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

        {/* Deploy Scenario */}
        <Card className="border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] rounded-xl overflow-hidden">
           <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
             <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-500" />
                Deploy Scenario
              </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Deployment status and history.
            </CardDescription>
          </CardHeader>
          <div className="p-0">
             {latestDeploy ? (
               <div className="w-full">
                 <div className="grid grid-cols-4 gap-4 px-5 py-2 bg-slate-50/50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                   <div>Target</div>
                   <div>Owner</div>
                   <div>Status</div>
                   <div className="text-right">Last Deployed</div>
                 </div>
                 <div className="grid grid-cols-4 gap-4 px-5 py-3 text-xs items-center">
                   <div className="font-medium text-slate-900 flex items-center gap-1.5">
                     <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                     {latestDeploy.target}
                   </div>
                   <div className="text-slate-600">{metric.owners.techOwner}</div>
                   <div>
                     <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-slate-200 ${
                       latestDeploy.status === 'success' 
                         ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                         : 'bg-red-50 text-red-700 border-red-200'
                     }`}>
                       {latestDeploy.status}
                     </Badge>
                   </div>
                   <div className="text-right text-slate-500 font-mono text-[11px]">
                     {new Date(latestDeploy.deployedAt).toLocaleString()}
                   </div>
                 </div>
               </div>
             ) : (
               <div className="p-8 text-center text-xs text-slate-400 italic">
                 No deployment history available.
               </div>
             )}
          </div>
        </Card>

        {/* Source Info */}
        <Card className="border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
             <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Source Info
              </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Map fields to source CDM tables.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {metric.queryDefinitions.map((q) => (
                 <div key={q.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 hover:bg-slate-50/30 transition-colors">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Source Table</span>
                      <div className="flex items-center gap-2">
                        <a 
                          href="#" 
                          className="font-mono text-xs text-blue-600 hover:underline hover:text-blue-700 truncate"
                          onClick={(e) => e.preventDefault()}
                        >
                          {q.source}
                        </a>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Source Field</span>
                      <p className="font-mono text-xs text-slate-700 break-all">
                        {q.fields && q.fields.length > 0 ? q.fields.join(", ") : (q.expression || "Not configured")}
                      </p>
                    </div>
                 </div>
              ))}
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
