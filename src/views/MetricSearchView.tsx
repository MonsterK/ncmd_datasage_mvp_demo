import { useEffect, useMemo, useState } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search as SearchIcon, Flame, Filter, ArrowUpDown, User, BarChart2, LayoutGrid, List, Star } from "lucide-react"
import { ResponsiveContainer, LineChart, Line } from "recharts"

import { Metric } from "@/types"
import { getMetricTimestamp } from "@/lib/utils"

export interface MetricSearchViewProps {
  metrics: Metric[]
  onOpenMetric: (fieldName: string) => void
  initialViewMode?: MetricViewMode
  onAddToMetricSetFromSelection?: (metricFieldNames: string[]) => void
  favoriteMetricFieldNames?: string[]
  onToggleFavoriteMetric?: (fieldName: string) => void
  onNavigateWorkspace?: () => void
}

export type MetricViewMode = "card" | "list"

export type MetricSortField = "createdAt" | "updatedAt"
export type MetricSortDirection = "asc" | "desc"
export type HasQueryFilter = "all" | "yes" | "no"

export function MetricSearchView({
  metrics,
  onOpenMetric,
  initialViewMode,
  onAddToMetricSetFromSelection,
  favoriteMetricFieldNames,
  onToggleFavoriteMetric,
  onNavigateWorkspace,
}: MetricSearchViewProps) {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<MetricViewMode>(initialViewMode ?? "card")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [businessOwnerFilter, setBusinessOwnerFilter] = useState<string>("all")
  const [techOwnerFilter, setTechOwnerFilter] = useState<string>("all")
  const [hasQueryFilter, setHasQueryFilter] = useState<HasQueryFilter>("all")
  const [sortField, setSortField] = useState<MetricSortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<MetricSortDirection>("desc")

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    metrics.forEach((m) => {
      const pathStr = m.categoryPath.join(" › ")
      if (pathStr) set.add(pathStr)
    })
    return Array.from(set).sort()
  }, [metrics])

  const businessOwnerOptions = useMemo(() => {
    const set = new Set<string>()
    metrics.forEach((m) => {
      if (m.owners?.businessOwner) {
        set.add(m.owners.businessOwner)
      }
    })
    return Array.from(set).sort()
  }, [metrics])

  const techOwnerOptions = useMemo(() => {
    const set = new Set<string>()
    metrics.forEach((m) => {
      if (m.owners?.techOwner) {
        set.add(m.owners.techOwner)
      }
    })
    return Array.from(set).sort()
  }, [metrics])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    let result = metrics

    if (q) {
      result = result.filter((m) => {
        return (
          m.businessName.toLowerCase().includes(q) ||
          m.fieldName.toLowerCase().includes(q) ||
          m.businessDefinition.toLowerCase().includes(q)
        )
      })
    }

    if (categoryFilter !== "all") {
      result = result.filter((m) => m.categoryPath.join(" › ") === categoryFilter)
    }

    if (businessOwnerFilter !== "all") {
      result = result.filter((m) => m.owners.businessOwner === businessOwnerFilter)
    }

    if (techOwnerFilter !== "all") {
      result = result.filter((m) => m.owners.techOwner === techOwnerFilter)
    }

    if (hasQueryFilter !== "all") {
      result = result.filter((m) => {
        const hasQuery = m.queryDefinitions && m.queryDefinitions.length > 0
        return hasQueryFilter === "yes" ? hasQuery : !hasQuery
      })
    }

    const sorted = [...result].sort((a, b) => {
      const aTime = getMetricTimestamp(a, sortField)
      const bTime = getMetricTimestamp(b, sortField)
      return sortDirection === "asc" ? aTime - bTime : bTime - aTime
    })

    return sorted
  }, [
    metrics,
    search,
    categoryFilter,
    businessOwnerFilter,
    techOwnerFilter,
    hasQueryFilter,
    sortField,
    sortDirection,
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search metrics by name, description, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors text-xs rounded-lg"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-xs w-[160px] bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={businessOwnerFilter} onValueChange={setBusinessOwnerFilter}>
              <SelectTrigger className="h-9 text-xs w-[150px] bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="All business owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Owners</SelectItem>
                {businessOwnerOptions.map((owner) => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={techOwnerFilter} onValueChange={setTechOwnerFilter}>
              <SelectTrigger className="h-9 text-xs w-[150px] bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="All tech owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tech Owners</SelectItem>
                {techOwnerOptions.map((owner) => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortField} onValueChange={(value: MetricSortField) => setSortField(value)}>
              <SelectTrigger className="h-9 text-xs w-[130px] bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="updatedAt">Updated Date</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 rounded-md ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="max-w-7xl mx-auto space-y-6">
          
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No metrics found</h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
                We couldn't find any metrics matching your criteria. Try adjusting your search terms or filters.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setCategoryFilter("all")
                  setBusinessOwnerFilter("all")
                  setTechOwnerFilter("all")
                  setHasQueryFilter("all")
                  setSearch("")
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(metric => (
                <Card 
                  key={metric.id} 
                  className="group hover:shadow-lg transition-all duration-200 border-slate-200 cursor-pointer overflow-hidden flex flex-col hover:border-blue-200"
                  onClick={() => onOpenMetric(metric.fieldName)}
                >
                  <CardHeader className="space-y-3 pb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold leading-tight group-hover:text-blue-600 transition-colors truncate">
                          {metric.businessName}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{metric.fieldName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onToggleFavoriteMetric && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleFavoriteMetric(metric.fieldName)
                            }}
                            className="h-7 w-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-yellow-300 hover:text-yellow-600"
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                favoriteMetricFieldNames?.includes(metric.fieldName)
                                  ? "text-yellow-500 fill-yellow-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        )}
                        <div onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant={metric.status === "Active" ? "default" : "secondary"}
                            className={`shrink-0 ${metric.status === "Active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                          >
                            {metric.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2 text-sm leading-relaxed h-10">
                      {metric.businessDefinition}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-4 flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{metric.owners.businessOwner}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{metric.owners.techOwner}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Deploy:{" "}
                        {metric.deployHistory && metric.deployHistory.length > 0
                          ? `${metric.deployHistory[metric.deployHistory.length - 1].targetType} · ${metric.deployHistory[metric.deployHistory.length - 1].status}`
                          : "-"}
                      </div>
                      
                      <div className="flex items-end justify-between gap-2 pt-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span>{metric.heat ?? 0} Heat</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 pb-3 text-[11px] text-slate-400 flex justify-between items-center border-t border-slate-50 bg-slate-50/50 mt-auto">
                    <span className="truncate max-w-[150px]">{metric.categoryPath.join(" › ")}</span>
                    <div className="flex items-center gap-2">
                      <span>{metric.updatedAt ? new Date(metric.updatedAt).toLocaleDateString() : "-"}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden border-slate-200 shadow-sm rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    {onToggleFavoriteMetric && <TableHead className="w-10"></TableHead>}
                    <TableHead>Metric Name</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Business Owner</TableHead>
                    <TableHead>Tech Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deploy</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                  <TableRow 
                      key={m.id} 
                      className="cursor-pointer hover:bg-slate-50/80"
                      onClick={() => onOpenMetric(m.fieldName)}
                    >
                    {onToggleFavoriteMetric && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleFavoriteMetric(m.fieldName)
                          }}
                          className="h-6 w-6 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-yellow-300 hover:text-yellow-600"
                        >
                          <Star
                            className={`h-3 w-3 ${
                              favoriteMetricFieldNames?.includes(m.fieldName)
                                ? "text-yellow-500 fill-yellow-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-slate-900">{m.businessName}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{m.fieldName}</TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[200px] truncate" title={m.categoryPath.join(" > ")}>
                        {m.categoryPath.join(" › ")}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{m.owners.businessOwner}</TableCell>
                      <TableCell className="text-xs text-slate-600">{m.owners.techOwner}</TableCell>
                      <TableCell>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant={m.status === "Active" ? "default" : "secondary"}
                            className={`shrink-0 ${m.status === "Active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                          >
                            {m.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {m.deployHistory && m.deployHistory.length > 0
                          ? `${m.deployHistory[m.deployHistory.length - 1].targetType} · ${m.deployHistory[m.deployHistory.length - 1].status}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 text-right">{m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
