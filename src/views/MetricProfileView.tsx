import { useMemo } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flame, LineChart as LineChartIcon } from "lucide-react"
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
}

export function MetricProfileView({ metric, dimensions, onDeriveMetric }: MetricProfileViewProps) {
  const boundDimensions = useMemo(
    () => dimensions.filter((d) => metric.boundDimensionSlugs.includes(d.slug)),
    [dimensions, metric.boundDimensionSlugs],
  )

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-bold text-slate-900">{metric.businessName}</CardTitle>
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full border-slate-200 ${metric.status === 'Live' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                {metric.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{metric.slug}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{metric.categoryPath.join(" › ")}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">Domain: {metric.domain}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-lg text-orange-700 border border-orange-100">
              <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-600" />
              <span className="font-bold">{metric.heat ?? 0}</span>
            </div>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <div className="flex flex-col">
               <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Business Owner</span>
               <span className="text-slate-700 font-medium">{metric.owners.businessOwner}</span>
            </div>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <div className="flex flex-col">
               <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Tech Owner</span>
               <span className="text-slate-700 font-medium">{metric.owners.techOwner}</span>
            </div>
            {onDeriveMetric && (
              <>
                <div className="h-4 w-px bg-slate-200 mx-1"></div>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                  onClick={() => onDeriveMetric(metric)}
                >
                  Derive metric
                </button>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="border-slate-200 shadow-sm rounded-2xl h-fit">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-sm font-bold text-slate-900">Definition</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Business and technical definitions, plus online query configurations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5 text-xs">
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-800">Business definition</p>
              <p className="text-slate-600 leading-relaxed">{metric.businessDefinition}</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-800">Technical definition (pseudo SQL)</p>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-50 font-mono shadow-inner">
                <code>{metric.technicalDefinition}</code>
              </pre>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-slate-800">Online queries</p>
              <div className="space-y-3">
                {metric.queryDefinitions.map((q) => (
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
                    <div className="grid grid-cols-2 gap-2 text-slate-600 mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Origin Field</span>
                        <span className="font-mono font-medium text-slate-700">{q.originField}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Aggregate</span>
                        <span className="font-mono font-medium text-slate-700">{q.aggregate}</span>
                      </div>
                    </div>
                    {q.filters.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Filters</span>
                        <code className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{q.filters.join(" AND ")}</code>
                      </div>
                    )}
                    {q.link && (
                      <div className="mt-3 pt-2 border-t border-slate-200/50">
                        <a
                          href={q.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          Open in Query Tool →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <p className="font-semibold text-slate-800">Available dimensions</p>
              {boundDimensions.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {boundDimensions.map((d) => (
                    <Badge key={d.id} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 px-2 py-1">
                      {d.name} <span className="ml-1 opacity-50 font-normal">({d.slug})</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No bound dimensions in the mock data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
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
                    <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                    />
                    <YAxis 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                        tickLine={false} 
                        axisLine={false} 
                    />
                    <RechartsTooltip 
                        contentStyle={{ fontSize: 11, borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: '#dbeafe', strokeWidth: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-sm font-bold text-slate-900">Top dimensions</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-52">
                {metric.topDimensions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metric.topDimensions} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="label" 
                        type="category" 
                        tick={{ fontSize: 10, fill: '#64748b' }} 
                        tickLine={false} 
                        axisLine={false}
                        width={80}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ fontSize: 11, borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
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

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-0 border-b border-slate-100 bg-slate-50/30">
               <Tabs defaultValue="lineage" className="w-full">
                <div className="flex items-center justify-between px-4 py-2">
                    <CardTitle className="text-sm font-bold text-slate-900">Context</CardTitle>
                    <TabsList className="h-7 bg-slate-200/50 p-0.5 rounded-lg">
                    <TabsTrigger value="lineage" className="h-6 text-[10px] rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Lineage</TabsTrigger>
                    <TabsTrigger value="knowledge" className="h-6 text-[10px] rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Knowledge</TabsTrigger>
                    </TabsList>
                </div>
                <CardContent className="p-4">
                    <TabsContent value="lineage" className="mt-0">
                        <MetricLineageDag metric={metric} />
                    </TabsContent>
                    <TabsContent value="knowledge" className="mt-0 text-xs text-slate-600">
                        <ul className="space-y-2 list-disc pl-4 marker:text-slate-400">
                            <li>Product requirement documents that define the SGI / QBR program logic.</li>
                            <li>Runbooks explaining how to debug data issues for this metric.</li>
                            <li>Business guidelines on how to interpret trends and thresholds.</li>
                        </ul>
                    </TabsContent>
                </CardContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
