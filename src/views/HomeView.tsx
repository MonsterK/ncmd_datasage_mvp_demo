import type React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search as SearchIcon, PlusCircle, Layers, FolderKanban } from "lucide-react"

import type { Metric, Dimension, Album } from "@/App"

export type TopNav = "home" | "metrics" | "management"

export interface HomeViewProps {
  metrics: Metric[]
  dimensions: Dimension[]
  metricSets: Album[]
  onNavigateTopNav: (nav: TopNav) => void
}

export function HomeView({ metrics, dimensions, metricSets, onNavigateTopNav }: HomeViewProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">DataSage preview workspace</CardTitle>
            <CardDescription>
              Hero and quick links for core flows: discover metrics, register, manage dimensions and metric sets.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <Badge variant="outline">Metrics {metrics.length}</Badge>
            <Badge variant="outline">Dimensions {dimensions.length}</Badge>
            <Badge variant="outline">Metric sets {metricSets.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLinkCard
              icon={SearchIcon}
              title="Explore metrics"
              description="Open the Metrics workspace with domains, metric sets and metric cards."
              onClick={() => onNavigateTopNav("metrics")}
            />
            <QuickLinkCard
              icon={PlusCircle}
              title="Register metric"
              description="Go to Management to register a new metric and manage definitions."
              onClick={() => onNavigateTopNav("management")}
            />
            <QuickLinkCard
              icon={Layers}
              title="Manage dimensions"
              description="Curate dimension terms, values dictionary and bindings."
              onClick={() => onNavigateTopNav("metrics")}
            />
            <QuickLinkCard
              icon={FolderKanban}
              title="Manage metric sets"
              description="Organize metrics into scenario-based metric sets for SGI, QBR and Creator."
              onClick={() => onNavigateTopNav("management")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface QuickLinkCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description: string
  onClick: () => void
}

function QuickLinkCard({ icon: Icon, title, description, onClick }: QuickLinkCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white group-hover:bg-zinc-800">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-zinc-500">{description}</div>
        </div>
      </div>
    </button>
  )
}
