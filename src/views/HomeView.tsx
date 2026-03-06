import type React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Star } from "lucide-react"

import { Metric, Dimension, Album, TopNav } from "@/types"

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="text-slate-500">Here's what's happening with your metrics today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-blue-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onBrowse}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-all"
          >
            View all
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {metrics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center mb-2">
              <Icon className="h-5 w-5 opacity-20" />
            </div>
            <p className="text-xs font-medium">{emptyLabel}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {metrics.slice(0, 6).map((metric) => (
              <button
                key={metric.id}
                type="button"
                onClick={() => onOpenMetric(metric.fieldName)}
                className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {metric.businessName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 h-4 border-slate-200 ${
                        metric.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : metric.status === "Draft"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {metric.status}
                    </Badge>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate flex items-center gap-1.5">
                     <span>{metric.fieldName}</span>
                     <span className="text-slate-300">•</span>
                     <span>{metric.categoryPath?.join(" › ")}</span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
