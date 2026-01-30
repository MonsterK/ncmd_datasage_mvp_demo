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
import { getMetricTimestamp } from "@/lib/utils"
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              {metric.businessName}
              <Badge variant="outline" className="text-[10px]">
                {metric.status}
              </Badge>
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-[11px] text-zinc-600">{metric.slug}</span>
              <span className="text-zinc-400">•</span>
              <span>{metric.categoryPath.join(" › ")}</span>
              <span className="text-zinc-400">•</span>
              <span>Domain: {metric.domain}</span>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="font-medium text-zinc-700">{metric.heat ?? 0}</span>
            </span>
            <span className="text-zinc-400">•</span>
            <span>Business owner: {metric.owners.businessOwner}</span>
            <span className="text-zinc-400">•</span>
            <span>Tech owner: {metric.owners.techOwner}</span>
            {onDeriveMetric && (
              <>
                <span className="text-zinc-400">•</span>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md"
                  onClick={() => onDeriveMetric(metric)}
                >
                  Derive metric
                </button>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Definition</CardTitle>
            <CardDescription className="text-xs">
              Business and technical definitions, plus online query configurations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-zinc-800">Business definition</p>
              <p className="text-zinc-700">{metric.businessDefinition}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-zinc-800">Technical definition (pseudo SQL)</p>
              <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-50">
                <code>{metric.technicalDefinition}</code>
              </pre>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-zinc-800">Online queries</p>
              <div className="space-y-2">
                {metric.queryDefinitions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-[11px]"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {q.type}
                      </Badge>
                      <span className="font-mono text-[11px] text-zinc-600">{q.source}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-zinc-600">
                      <span>
                        Origin field: <span className="font-mono">{q.originField}</span>
                      </span>
                      <span>
                        Aggregate: <span className="font-mono">{q.aggregate}</span>
                      </span>
                      <span>
                        Business date: <span className="font-mono">{q.businessDate}</span>
                      </span>
                    </div>
                    {q.filters.length > 0 && (
                      <div className="mt-1 text-zinc-600">
                        Filters: <span className="font-mono">{q.filters.join(" AND ")}</span>
                      </div>
                    )}
                    {q.analysisDimensions.length > 0 && (
                      <div className="mt-1 text-zinc-600">
                        Analysis dimensions: {q.analysisDimensions.join(", ")}
                      </div>
                    )}
                    {q.link && (
                      <div className="mt-1 text-zinc-600">
                        Query link:{" "}
                        <a
                          href={q.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 underline"
                        >
                          {q.link}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-zinc-800">LarkSheet link</p>
              {metric.larkSheetLink ? (
                <a
                  href={metric.larkSheetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-[11px] text-indigo-600 underline"
                >
                  {metric.larkSheetLink}
                </a>
              ) : (
                <p className="text-[11px] text-zinc-500">No LarkSheet link attached in this demo.</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-zinc-800">Available dimensions</p>
              {boundDimensions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {boundDimensions.map((d) => (
                    <Badge key={d.id} variant="outline" className="text-[10px]">
                      {d.name} ({d.slug})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500">
                  No bound dimensions in the mock data. In production, this list is driven by Dimension Management.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <LineChartIcon className="h-4 w-4" />
                30 day trend (mock data)
              </CardTitle>
              <CardDescription className="text-xs">
                Trend based on sample daily points to illustrate the metric behaviour.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metric.trend30d} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#111827"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top dimensions distribution (mock)</CardTitle>
              <CardDescription className="text-xs">
                The distribution is expressed using curated dimension values from Dimension Management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {metric.topDimensions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metric.topDimensions} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                      <Bar dataKey="value" fill="#111827" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-zinc-500">
                    No mock distribution attached to this metric. In a real deployment this would show Top N dimension
                    values.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Lineage & knowledge</CardTitle>
          <CardDescription className="text-xs">
            Static tabs that illustrate how lineage and knowledge would be surfaced for this metric.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lineage">
            <TabsList className="mb-2">
              <TabsTrigger value="lineage">Lineage</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            </TabsList>
            <TabsContent value="lineage" className="text-xs text-zinc-700">
              <MetricLineageDag metric={metric} />
            </TabsContent>
            <TabsContent value="knowledge" className="text-xs text-zinc-700">
              <p className="mb-1 font-semibold">Linked knowledge</p>
              <ul className="mb-3 list-disc pl-4">
                <li>Product requirement documents that define the SGI / QBR program logic.</li>
                <li>Runbooks explaining how to debug data issues for this metric.</li>
                <li>Business guidelines on how to interpret trends and thresholds.</li>
              </ul>
              <p className="text-[11px] text-zinc-500">
                For this demo the items are static. In a real deployment links would be resolved from the knowledge
                repository and attached at metric level.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
