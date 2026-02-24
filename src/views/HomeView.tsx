import type React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search as SearchIcon, PlusCircle, Layers, FolderKanban } from "lucide-react"

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
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between px-0">
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</CardTitle>
            <CardDescription className="text-lg text-slate-500 mt-2">
              Manage your metrics, dimensions, and datasets in one unified workspace.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatsBadge label="Metrics" count={metrics.length} color="bg-blue-50 text-blue-700 border-blue-100" />
            <StatsBadge label="Dimensions" count={dimensions.length} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
            <StatsBadge label="Metric Sets" count={metricSets.length} color="bg-purple-50 text-purple-700 border-purple-100" />
          </div>
        </CardHeader>
        <CardContent className="px-0 mt-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLinkCard
              icon={SearchIcon}
              title="Explore metrics"
              description="Browse the metrics catalog, view definitions and lineage."
              onClick={() => onNavigateTopNav("metrics")}
              color="blue"
            />
            <QuickLinkCard
              icon={PlusCircle}
              title="Register metric"
              description="Define new business metrics and map them to technical data."
              onClick={() => onNavigateTopNav("management")}
              color="emerald"
            />
            <QuickLinkCard
              icon={Layers}
              title="Manage dimensions"
              description="Curate standard dimensions and value dictionaries."
              onClick={() => onNavigateTopNav("dimensions")}
              color="purple"
            />
            <QuickLinkCard
              icon={FolderKanban}
              title="Metrics workspace"
              description="Switch between metric sets and the metrics library."
              onClick={() => onNavigateTopNav("metrics")}
              color="orange"
            />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricListCard
          title="Recently viewed"
          description="Your latest accessed metrics"
          metrics={recentMetrics}
          emptyLabel="No recently viewed metrics yet."
          onOpenMetric={onOpenMetric}
          onBrowse={() => onNavigateTopNav("metrics")}
        />
        <MetricListCard
          title="Favorites"
          description="Pinned metrics you care about"
          metrics={favoriteMetrics}
          emptyLabel="No favorited metrics yet."
          onOpenMetric={onOpenMetric}
          onBrowse={() => onNavigateTopNav("metrics")}
        />
      </div>
    </div>
  )
}

function StatsBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${color}`}>
      <span>{label}</span>
      <span className="font-bold opacity-80">{count}</span>
    </div>
  )
}

interface QuickLinkCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description: string
  onClick: () => void
  color: "blue" | "emerald" | "purple" | "orange"
}

function QuickLinkCard({ icon: Icon, title, description, onClick, color }: QuickLinkCardProps) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
    orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
    >
      <div className="flex flex-col gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300 ${colorStyles[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{title}</div>
          <div className="mt-2 text-sm text-slate-500 leading-relaxed">{description}</div>
        </div>
      </div>
    </button>
  )
}

interface MetricListCardProps {
  title: string
  description: string
  metrics: Metric[]
  emptyLabel: string
  onOpenMetric: (fieldName: string) => void
  onBrowse: () => void
}

function MetricListCard({ title, description, metrics, emptyLabel, onOpenMetric, onBrowse }: MetricListCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-3 border-b border-slate-50">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">{title}</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">{description}</CardDescription>
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
