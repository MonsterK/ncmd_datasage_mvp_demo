import { useMemo, useState, useEffect } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Flame, LineChart as LineChartIcon, Star, Database, Truck, Info, Share2, History, Link, Check, X } from "lucide-react"

import { Metric, Dimension, DeployHistory } from "@/types"
import { MetricLineageDag } from "./MetricLineageDag"

export interface MetricProfileViewProps {
  metric: Metric
  dimensions: Dimension[]
  onDeriveMetric?: (metric: Metric) => void
  onNavigateWorkspace?: () => void
  onUpdateMetricStatus?: (fieldName: string, status: "Active" | "Draft") => void
}

export function MetricProfileView({
  metric,
  dimensions,
  onDeriveMetric,
  onNavigateWorkspace,
  onUpdateMetricStatus,
}: MetricProfileViewProps) {
  const boundDimensions = useMemo(
    () => dimensions.filter((d) => metric.boundDimensionFieldNames.includes(d.fieldName)),
    [dimensions, metric.boundDimensionFieldNames],
  )
  
  // Local state for deploy history to support adding bindings
  const [deployHistory, setDeployHistory] = useState<DeployHistory[]>([])
  const [isAddingBinding, setIsAddingBinding] = useState(false)
  const [newBindingTarget, setNewBindingTarget] = useState("")
  const [newBindingOwner, setNewBindingOwner] = useState(metric.owner)

  useEffect(() => {
    if (metric.deployHistory) {
      setDeployHistory(metric.deployHistory)
    } else {
      setDeployHistory([])
    }
  }, [metric.deployHistory])

  const handleAddBinding = () => {
    setIsAddingBinding(true)
    setNewBindingTarget("")
    setNewBindingOwner(metric.owner)
  }

  const handleSaveBinding = () => {
    if (!newBindingTarget.trim()) return

    const newEntry: DeployHistory = {
      targetType: "Hive Table", // Default or could be a selection
      target: newBindingTarget,
      status: "success",
      deployedAt: new Date().toISOString(),
      fieldCount: 1,
      type: "binding"
    }

    setDeployHistory([...deployHistory, newEntry])
    setIsAddingBinding(false)
  }

  const handleCancelBinding = () => {
    setIsAddingBinding(false)
    setNewBindingTarget("")
  }

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
               <div className="h-6 w-6 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[9px] font-bold text-indigo-600 shadow-sm" title={metric.owner}>
                  {metric.owner.charAt(0).toUpperCase()}
               </div>
            </div>
            <div className="text-[11px] text-slate-400">Owner</div>
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
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-800">Tech definition (SQL)</p>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-50 font-mono shadow-inner">
                <code>{metric.technicalDefinition}</code>
              </pre>
            </div>
          </CardContent>
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
          <CardContent className="p-5 text-xs">
            <div className="space-y-4 mb-6">
              <p className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-3">Physical Info</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500">Hive Table</span>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate">
                      {metric.sourceHiveTable || "Not configured"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Hive Field</span>
                  <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    {metric.sourceHiveField || "Not configured"}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-3">Lineage Info</p>
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

            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-3">Dependency Graph</p>
              <MetricLineageDag metric={metric} />
            </div>
          </CardContent>
        </Card>

        {/* Deploy Scenario */}
        <Card className="border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] rounded-xl overflow-hidden">
           <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
             <div className="flex items-center justify-between">
               <div>
                 <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-500" />
                    Deploy Scenario
                  </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Deployment status and history.
                </CardDescription>
               </div>
               <div className="flex items-center gap-2">
                  <button 
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-full transition-colors shadow-sm flex items-center gap-1.5"
                    onClick={handleAddBinding}
                  >
                    <Link className="h-3 w-3" />
                    Binding
                  </button>
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full transition-colors shadow-sm"
                    onClick={onNavigateWorkspace}
                  >
                    Deploy
                  </button>
               </div>
             </div>
          </CardHeader>
          <div className="p-0">
             {deployHistory.length > 0 || isAddingBinding ? (
               <div className="w-full">
                 <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-2 bg-slate-50/50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                   <div>Target</div>
                   <div>Type</div>
                   <div>Owner</div>
                   <div>Status</div>
                   <div className="text-right">Last Deployed</div>
                 </div>
                 {deployHistory.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3 text-xs items-center border-b border-slate-50 last:border-0">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5 min-w-0">
                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.type === 'binding' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                        <span className="truncate" title={item.target}>{item.target}</span>
                      </div>
                      <div className="text-slate-600">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-200 bg-slate-50 text-slate-600">
                           {item.type || "deployment"}
                        </Badge>
                      </div>
                      <div className="text-slate-600 truncate">{metric.owner}</div>
                      <div>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-slate-200 ${
                          item.status === 'success' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-right text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(item.deployedAt).toLocaleDateString()}
                      </div>
                    </div>
                 ))}
                 
                 {isAddingBinding && (
                   <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3 text-xs items-center bg-blue-50/30">
                     <div>
                       <Input 
                         value={newBindingTarget}
                         onChange={(e) => setNewBindingTarget(e.target.value)}
                         placeholder="Enter target..."
                         className="h-7 text-xs bg-white"
                         autoFocus
                       />
                     </div>
                     <div>
                       <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-purple-200 bg-purple-50 text-purple-700">
                         binding
                       </Badge>
                     </div>
                     <div className="text-slate-600 truncate">{newBindingOwner}</div>
                     <div>
                       <span className="text-[10px] text-slate-400 italic">Pending...</span>
                     </div>
                     <div className="flex justify-end gap-2">
                       <button 
                         onClick={handleSaveBinding}
                         className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                         title="Save binding"
                       >
                         <Check className="h-3 w-3" />
                       </button>
                       <button 
                         onClick={handleCancelBinding}
                         className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
                         title="Cancel"
                       >
                         <X className="h-3 w-3" />
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <div className="p-8 text-center text-xs text-slate-400 italic">
                 No deployment history available.
               </div>
             )}
          </div>
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
