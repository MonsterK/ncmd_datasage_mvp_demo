import type React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Star } from "lucide-react"

import { Metric, Dimension, Album } from "@/types"

export type TopNav = "home" | "metrics" | "dimensions" | "management"

export interface HomeViewProps {
  metrics: Metric[]
  dimensions: Dimension[]
  metricSets: Album[]
  favoriteMetrics: Metric[]
  recentMetrics: Metric[]
  onNavigateTopNav: (nav: TopNav) => void
  onOpenMetric: (fieldName: string) => void
}

export function HomeView({
  metrics,
  dimensions,
  metricSets,
  favoriteMetrics,
  recentMetrics,
  onNavigateTopNav,
  onOpenMetric,
}: HomeViewProps) {
  const recentDisplayMetrics = recentMetrics.length ? recentMetrics : metrics.slice(0, 4)
  const favoriteDisplayMetrics = favoriteMetrics.length ? favoriteMetrics : metrics.slice(4, 8)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between px-0">
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</CardTitle>
          </div>
        </CardHeader>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricListCard
          title="Recently viewed"
          description="Your latest accessed metrics"
          metrics={recentDisplayMetrics}
          emptyLabel="No recently viewed metrics yet."
          onOpenMetric={onOpenMetric}
          onBrowse={() => onNavigateTopNav("metrics")}
          icon={Clock}
        />
        <MetricListCard
          title="Favorites"
          description="Pinned metrics you care about"
          metrics={favoriteDisplayMetrics}
          emptyLabel="No favorited metrics yet."
          onOpenMetric={onOpenMetric}
          onBrowse={() => onNavigateTopNav("metrics")}
          icon={Star}
        />
      </div>
    </div>
  )
}

interface MetricListCardProps {
  title: string
  description: string
  metrics: Metric[]
  emptyLabel: string
  onOpenMetric: (fieldName: string) => void
  onBrowse: () => void
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

function MetricListCard({ title, description, metrics, emptyLabel, onOpenMetric, onBrowse, icon: Icon }: MetricListCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-3 border-b border-slate-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">{title}</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">{description}</CardDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onBrowse}
            className="text-[11px] font-medium text-blue-600 hover:text-blue-800"
          >
            Browse
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {metrics.length === 0 ? (
          <div className="text-xs text-slate-400 italic text-center py-6">{emptyLabel}</div>
        ) : (
          <div className="space-y-3">
            {metrics.slice(0, 6).map((metric) => (
              <button
                key={metric.id}
                type="button"
                onClick={() => onOpenMetric(metric.fieldName)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm transition"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{metric.businessName}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{metric.fieldName}</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-slate-200">
                  {metric.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
