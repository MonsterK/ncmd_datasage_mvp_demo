import { useEffect, useMemo, useState } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ResponsiveContainer, LineChart, Line } from "recharts"
import { Flame, Search, Filter, ArrowUpDown } from "lucide-react"

import type {
  Metric,
  Album,
  Domain,
  DimensionTreeNode,
  Dimension,
  CategoryNode,
  Tag,
  NewMetricPayload,
} from "@/types"
import { getMetricTimestamp } from "@/lib/utils"
import {
  MetricSearchView,
  type MetricSortField,
  type MetricSortDirection,
  type HasQueryFilter,
} from "@/views/MetricSearchView"
import { DimensionsWorkspaceView } from "@/views/DimensionsWorkspaceView"
import { NewMetricSheet, NewMetricSetSheet, NewDimensionSheet } from "@/views/ManagementWorkspaceView"

export interface MetricsWorkspaceViewProps {
  metrics: Metric[]
  metricSets: Album[]
  domains: Domain[]
  dimensionTree: DimensionTreeNode[]
  dimensions: Dimension[]
  categories: CategoryNode[]
  activeGlobalDomainId: string | null
  onOpenMetric: (slug: string) => void
  onRegisterMetric: (payload: NewMetricPayload) => void
  onMetricSetsChange: (sets: Album[]) => void
  onCreateDimension: (payload: {
    id: string
    name: string
    description: string
    category: string
    sourceLink: string
  }) => void
  tags: Tag[]
}

function getMetricSetTimestamp(metricSet: Album, key: "createdAt" | "updatedAt"): number {
  const value = metricSet[key]
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function MetricsWorkspaceView({
  metrics,
  metricSets,
  domains,
  dimensionTree,
  dimensions,
  categories,
  activeGlobalDomainId,
  onOpenMetric,
  onRegisterMetric,
  onMetricSetsChange,
  onCreateDimension,
  tags,
}: MetricsWorkspaceViewProps) {

  const selectedDomainId = activeGlobalDomainId

  const [selectedMetricSetId, setSelectedMetricSetId] = useState<string | null>(null)
  const [workspaceMode, setWorkspaceMode] = useState<"metricSets" | "metrics" | "dimensions">("metricSets")
  const [metricSetSearch, setMetricSetSearch] = useState("")
  const [metricSetSortField, setMetricSetSortField] = useState<MetricSortField>("updatedAt")
  const [metricSetSortDirection, setMetricSetSortDirection] = useState<MetricSortDirection>("desc")
  const [isNewMetricSheetOpen, setIsNewMetricSheetOpen] = useState(false)
  const [isNewMetricSetSheetOpen, setIsNewMetricSetSheetOpen] = useState(false)
  const [isNewDimensionSheetOpen, setIsNewDimensionSheetOpen] = useState(false)
  const [selectedSlugsForQuery, setSelectedSlugsForQuery] = useState<string[]>([])
  const [isCombinedQuerySheetOpen, setIsCombinedQuerySheetOpen] = useState(false)
  const [isAddToMetricSetSheetOpen, setIsAddToMetricSetSheetOpen] = useState(false)
  const [selectedSlugsForAddToMetricSet, setSelectedSlugsForAddToMetricSet] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const metricSetsForDomain = useMemo(() => {
    if (!selectedDomainId) return metricSets
    return metricSets.filter((set) => set.domain === selectedDomainId)
  }, [metricSets, selectedDomainId])

  const filteredSets = useMemo(() => {
    let result = metricSetsForDomain

    const q = metricSetSearch.toLowerCase().trim()
    if (q) {
      result = result.filter((set) => set.name.toLowerCase().includes(q))
    }

    if (selectedTagIds.length) {
      result = result.filter((set) => {
        if (!set.tags || set.tags.length === 0) return false
        return set.tags.some((tagId) => selectedTagIds.includes(tagId))
      })
    }

    const sorted = [...result].sort((a, b) => {
      const aTime = getMetricSetTimestamp(a, metricSetSortField)
      const bTime = getMetricSetTimestamp(b, metricSetSortField)
      return metricSetSortDirection === "asc" ? aTime - bTime : bTime - aTime
    })

    return sorted
  }, [metricSetsForDomain, metricSetSearch, metricSetSortField, metricSetSortDirection, selectedTagIds])

  const selectedMetricSet = useMemo(() => {
    if (!selectedMetricSetId) return null
    return metricSets.find((s) => s.id === selectedMetricSetId) ?? null
  }, [metricSets, selectedMetricSetId])

  const metricsForSelectedSet = useMemo(() => {
    if (!selectedMetricSet) return []
    return metrics.filter((m) => (selectedMetricSet.metricSlugs ?? []).includes(m.slug))
  }, [metrics, selectedMetricSet])

  const metricsForDomain = useMemo(() => {
    if (!selectedDomainId) return metrics
    return metrics.filter((m) => m.domain === selectedDomainId)
  }, [metrics, selectedDomainId])

  const metricSlugsForSelectedTags = useMemo(() => {
    if (!selectedTagIds.length) return null
    const setsInDomain = selectedDomainId ? metricSets.filter((set) => set.domain === selectedDomainId) : metricSets
    const slugs = new Set<string>()
    setsInDomain.forEach((set) => {
      if (!set.tags || set.tags.length === 0) return
      if (set.tags.some((tagId) => selectedTagIds.includes(tagId))) {
        (set.metricSlugs ?? []).forEach((slug) => slugs.add(slug))
      }
    })
    return slugs
  }, [metricSets, selectedDomainId, selectedTagIds])

  const metricsForDomainWithTagFilter = useMemo(() => {
    if (!metricSlugsForSelectedTags) return metricsForDomain
    return metricsForDomain.filter((m) => metricSlugsForSelectedTags.has(m.slug))
  }, [metricsForDomain, metricSlugsForSelectedTags])

  const dimensionsForDomain = useMemo(() => {
    if (!selectedDomainId) return dimensions
    return dimensions.filter(
      (d) => d.domain === selectedDomainId || (d.scope && d.scope.includes(selectedDomainId)),
    )
  }, [dimensions, selectedDomainId])

  const dimensionSlugsForDomain = useMemo(
    () => new Set(dimensionsForDomain.map((d) => d.slug)),
    [dimensionsForDomain],
  )

  const filteredDimensionTree = useMemo(() => {
    if (!selectedDomainId) return dimensionTree

    const filterNode = (node: DimensionTreeNode): DimensionTreeNode | null => {
      const children =
        node.children
          ?.map(filterNode)
          .filter((child): child is DimensionTreeNode => child !== null) ?? []

      const ownSlugs = node.dimensionSlugs?.filter((slug) => dimensionSlugsForDomain.has(slug)) ?? []
      const childrenCount = children.reduce((sum, child) => sum + child.count, 0)
      const totalCount = ownSlugs.length + childrenCount

      if (totalCount === 0) {
        return null
      }

      return {
        ...node,
        children: children.length ? children : undefined,
        dimensionSlugs: ownSlugs.length ? ownSlugs : undefined,
        count: totalCount,
      }
    }

    const roots = dimensionTree
      .map(filterNode)
      .filter((node): node is DimensionTreeNode => node !== null)

    return roots
  }, [dimensionTree, dimensionSlugsForDomain, selectedDomainId])

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [businessOwnerFilter, setBusinessOwnerFilter] = useState<string>("all")
  const [techOwnerFilter, setTechOwnerFilter] = useState<string>("all")
  const [hasQueryFilter, setHasQueryFilter] = useState<HasQueryFilter>("all")
  const [sortField, setSortField] = useState<MetricSortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<MetricSortDirection>("desc")

  const metricCategoryOptions = useMemo(() => {
    const set = new Set<string>()
    metricsForSelectedSet.forEach((m) => {
      const pathStr = m.categoryPath.join(" › ")
      if (pathStr) set.add(pathStr)
    })
    return Array.from(set).sort()
  }, [metricsForSelectedSet])

  const metricBusinessOwnerOptions = useMemo(() => {
    const set = new Set<string>()
    metricsForSelectedSet.forEach((m) => {
      if (m.owners?.businessOwner) {
        set.add(m.owners.businessOwner)
      }
    })
    return Array.from(set).sort()
  }, [metricsForSelectedSet])

  const metricTechOwnerOptions = useMemo(() => {
    const set = new Set<string>()
    metricsForSelectedSet.forEach((m) => {
      if (m.owners?.techOwner) {
        set.add(m.owners.techOwner)
      }
    })
    return Array.from(set).sort()
  }, [metricsForSelectedSet])

  const filteredMetricsForSelectedSet = useMemo(() => {
    let result = metricsForSelectedSet

    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter((m) => {
        return (
          m.businessName.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q) ||
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
    metricsForSelectedSet,
    search,
    categoryFilter,
    businessOwnerFilter,
    techOwnerFilter,
    hasQueryFilter,
    sortField,
    sortDirection,
  ])

  useEffect(() => {
    setSelectedSlugsForQuery([])
    setIsCombinedQuerySheetOpen(false)
  }, [selectedMetricSetId, workspaceMode])

  const handleSelectMetricSet = (id: string) => {
    setSelectedMetricSetId(id)
  }


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <ToggleGroup
                type="single"
                size="sm"
                variant="outline"
                value={workspaceMode}
                onValueChange={(value) => {
                  if (!value) return
                  setWorkspaceMode(value as "metricSets" | "metrics" | "dimensions")
                  if (value !== "metricSets") {
                    setSelectedMetricSetId(null)
                  }
                }}
                className="bg-slate-100/50 p-1 rounded-full border border-slate-200"
                aria-label="Toggle metrics workspace mode"
              >
              <ToggleGroupItem
                value="metricSets"
                className="rounded-full px-4 text-xs font-medium data-[state=on]:bg-white data-[state=on]:text-blue-700 data-[state=on]:shadow-sm"
                aria-label="View metric sets"
              >
                Metric sets
              </ToggleGroupItem>
              <ToggleGroupItem
                value="metrics"
                className="rounded-full px-4 text-xs font-medium data-[state=on]:bg-white data-[state=on]:text-blue-700 data-[state=on]:shadow-sm"
                aria-label="View metrics"
              >
                Metrics
              </ToggleGroupItem>
              <ToggleGroupItem
                value="dimensions"
                className="rounded-full px-4 text-xs font-medium data-[state=on]:bg-white data-[state=on]:text-blue-700 data-[state=on]:shadow-sm"
                aria-label="View dimensions"
              >
                Dimensions
              </ToggleGroupItem>
            </ToggleGroup>
            {selectedDomainId && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-[11px] text-slate-500 font-medium">
                <span>Domain:</span>
                <span className="text-slate-900">
                  {domains.find((d) => d.id === selectedDomainId)?.name ?? selectedDomainId}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-1 text-xs border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-colors shadow-sm"
              onClick={() => setIsNewMetricSheetOpen(true)}
            >
              New metric
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-1 text-xs border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-colors shadow-sm"
              onClick={() => setIsNewMetricSetSheetOpen(true)}
            >
              New metric set
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-1 text-xs border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-colors shadow-sm"
              onClick={() => setIsNewDimensionSheetOpen(true)}
            >
              New dimension
            </Button>
          </div>
        </div>

        {(workspaceMode === "metricSets" || workspaceMode === "metrics") && (
          <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Filter Tags</span>
            <div className="flex flex-wrap gap-2">
              {tags.length > 0 ? (
                tags.map((tag) => {
                  const isActive = selectedTagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                        )
                      }
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                        isActive
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-white"
                      }`}
                    >
                      {tag.name}
                    </button>
                  )
                })
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  No tags configured.
                </span>
              )}
            </div>
            {selectedTagIds.length > 0 && (
              <button
                type="button"
                className="ml-auto text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setSelectedTagIds([])}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

         {workspaceMode === "metricSets" && !selectedMetricSet && (
          <div className="grid gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Search className="h-3 w-3" /> Search metric sets
                </span>
                <div className="relative">
                  <Input
                    className="h-9 text-sm pl-3 border-slate-200 focus:border-blue-300 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all rounded-lg"
                    placeholder="Search by name or description..."
                    value={metricSetSearch}
                    onChange={(e) => setMetricSetSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2 flex min-w-0 flex-col gap-2 sm:mt-0 sm:w-72">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <ArrowUpDown className="h-3 w-3" /> Sort
                </span>
                <div className="flex gap-2">
                  <Select
                    value={metricSetSortField}
                    onValueChange={(value: MetricSortField) => setMetricSetSortField(value)}
                  >
                    <SelectTrigger className="h-9 text-xs border-slate-200 rounded-lg bg-slate-50">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Created time</SelectItem>
                      <SelectItem value="updatedAt">Updated time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={metricSetSortDirection}
                    onValueChange={(value: MetricSortDirection) => setMetricSetSortDirection(value)}
                  >
                    <SelectTrigger className="h-9 text-xs border-slate-200 rounded-lg bg-slate-50">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSets.map((set) => (
                <button
                  key={set.id}
                  type="button"
                  onClick={() => handleSelectMetricSet(set.id)}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div>
                      <div className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{set.name}</div>
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">Domain: {set.domain}</div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200">
                      {set.visibility}
                    </Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs text-slate-500 leading-relaxed">{set.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between w-full">
                    <span className="text-[10px] font-medium text-slate-400">
                      {(set.metricSlugs?.length ?? 0)} metric{(set.metricSlugs?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      View details →
                    </span>
                  </div>
                </button>
              ))}
              {filteredSets.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  No metric sets found matching your criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {workspaceMode === "metricSets" && selectedMetricSet && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedMetricSet.name}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Managing {metricsForSelectedSet.length} metrics in this set.
                </p>
              </div>
              <ButtonBackToMetricSets onClick={() => setSelectedMetricSetId(null)} />
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex min-w-0 flex-1 flex-col gap-2 md:basis-1/3">
                    <span className="text-[11px] font-semibold text-slate-700">Search</span>
                    <Input
                      className="h-9 text-xs border-slate-200 rounded-lg"
                      placeholder="Search metrics..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 md:basis-1/4">
                    <span className="text-[11px] font-semibold text-slate-700">Category</span>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-9 text-xs border-slate-200 rounded-lg bg-white">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {metricCategoryOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Additional filters can go here */}
                  <div className="flex min-w-0 flex-1 flex-col gap-2 md:basis-1/4">
                     <span className="text-[11px] font-semibold text-slate-700">Actions</span>
                     <Button
                        type="button"
                        size="sm"
                        className="h-9 text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                        disabled={selectedSlugsForQuery.length === 0}
                        onClick={() => setIsCombinedQuerySheetOpen(true)}
                      >
                        Query Selected ({selectedSlugsForQuery.length})
                      </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50/30">
                {filteredMetricsForSelectedSet.map((m) => (
                  <Card
                    key={m.id}
                    className="group cursor-pointer border-slate-200 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:bg-white"
                    onClick={() => onOpenMetric(m.slug)}
                  >
                    <CardHeader className="flex flex-row items-start justify-between gap-3 p-4 pb-2 space-y-0">
                      <div className="flex flex-1 items-start gap-3">
                        <Checkbox
                          className="mt-1 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          checked={selectedSlugsForQuery.includes(m.slug)}
                          onCheckedChange={(value) => {
                            const isChecked = value === true
                            setSelectedSlugsForQuery((prev) => {
                              if (isChecked) {
                                if (prev.includes(m.slug)) return prev
                                return [...prev, m.slug]
                              }
                              return prev.filter((slug) => slug !== m.slug)
                            })
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          aria-label="Select metric for combined query"
                        />
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {m.businessName}
                          </CardTitle>
                          <CardDescription className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {m.slug}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] border-slate-200 ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                        {m.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="line-clamp-2 text-xs text-slate-500 mb-4 h-8 leading-relaxed">
                        {m.businessDefinition}
                      </p>
                      <div className="flex items-end justify-between gap-2 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />
                          <span className="font-semibold text-slate-700">{m.heat ?? 0}</span>
                        </div>
                        {m.trend30d && m.trend30d.length > 0 && (
                          <div className="h-8 w-20 opacity-70 group-hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={m.trend30d}
                                margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
                              >
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#3b82f6"
                                  strokeWidth={2}
                                  dot={false}
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredMetricsForSelectedSet.length === 0 && (
                   <div className="col-span-full py-8 text-center text-xs text-slate-400">
                    No metrics found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {workspaceMode === "metrics" && (
          <MetricSearchView
            metrics={metricsForDomainWithTagFilter}
            onOpenMetric={onOpenMetric}
            initialViewMode="card"
            onAddToMetricSetFromSelection={(slugs) => {
              setSelectedSlugsForAddToMetricSet(slugs)
              setIsAddToMetricSetSheetOpen(true)
            }}
          />
        )}

        {workspaceMode === "dimensions" && (
          <DimensionsWorkspaceView
            dimensionTree={selectedDomainId ? filteredDimensionTree : dimensionTree}
            dimensions={dimensionsForDomain}
          />
        )}
      </div>

      <NewMetricSheet
        open={isNewMetricSheetOpen}
        onOpenChange={setIsNewMetricSheetOpen}
        categories={categories}
        onRegisterMetric={onRegisterMetric}
      />

      <NewMetricSetSheet
        open={isNewMetricSetSheetOpen}
        onOpenChange={setIsNewMetricSetSheetOpen}
        metrics={metrics}
        metricSets={metricSets}
        onMetricSetsChange={onMetricSetsChange}
        domains={domains}
        initialDomainId={selectedDomainId ?? undefined}
        tags={tags}
      />

      <NewDimensionSheet
        open={isNewDimensionSheetOpen}
        onOpenChange={setIsNewDimensionSheetOpen}
        onCreateDimension={onCreateDimension}
      />

      <AddToMetricSetSheet
        open={isAddToMetricSetSheetOpen}
        onOpenChange={setIsAddToMetricSetSheetOpen}
        metricSets={metricSets}
        onMetricSetsChange={onMetricSetsChange}
        domains={domains}
        selectedSlugs={selectedSlugsForAddToMetricSet}
        selectedDomainId={selectedDomainId ?? undefined}
      />

      {workspaceMode === "metricSets" && selectedMetricSet && (
        <CombinedQuerySheet
          open={isCombinedQuerySheetOpen}
          onOpenChange={setIsCombinedQuerySheetOpen}
          metrics={metricsForSelectedSet}
          selectedSlugs={selectedSlugsForQuery}
          metricSetName={selectedMetricSet.name}
        />
      )}
    </div>
  )
}

interface ButtonBackToMetricSetsProps {
  onClick: () => void
}

function ButtonBackToMetricSets({ onClick }: ButtonBackToMetricSetsProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/30"
    >
      ← Back to metric sets
    </button>
  )
}

interface CombinedQuerySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metrics: Metric[]
  selectedSlugs: string[]
  metricSetName: string
}

function CombinedQuerySheet({
  open,
  onOpenChange,
  metrics,
  selectedSlugs,
  metricSetName,
}: CombinedQuerySheetProps) {
  const selectedMetrics = useMemo(
    () => metrics.filter((m) => selectedSlugs.includes(m.slug)),
    [metrics, selectedSlugs],
  )

  const querySources = useMemo(
    () =>
      Array.from(
        new Set(
          selectedMetrics.flatMap((m) =>
            (m.queryDefinitions ?? []).map((q) => q.source),
          ),
        ),
      ),
    [selectedMetrics],
  )

  const exampleLink = `aeolus://combined?metrics=${encodeURIComponent(selectedSlugs.join(","))}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Combined query (mock)</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 pb-6 text-xs">
          <p className="text-zinc-600">
            You are about to open a combined query for{" "}
            <span className="font-semibold text-zinc-900">{selectedSlugs.length}</span> metrics in metric set{" "}
            <span className="font-semibold text-zinc-900">{metricSetName}</span>.
          </p>

          <div className="space-y-2">
            <p className="font-semibold text-zinc-800">Metrics</p>
            {selectedMetrics.length > 0 ? (
              <ul className="space-y-1">
                {selectedMetrics.map((m) => (
                  <li key={m.slug} className="flex items-center justify-between gap-2">
                    <span>{m.businessName}</span>
                    <span className="font-mono text-[11px] text-zinc-500">{m.slug}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-zinc-500">No metrics selected.</p>
            )}
          </div>

          {querySources.length > 0 && (
            <div className="space-y-1">
              <p className="font-semibold text-zinc-800">Query sources (mock)</p>
              <p className="text-[11px] text-zinc-600">{querySources.join(", ")}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="font-semibold text-zinc-800">Example combined query link (mock)</p>
            <code className="block break-all rounded-md bg-zinc-900 p-3 text-[11px] text-zinc-50">
              {exampleLink}
            </code>
          </div>

          <Button
            type="button"
            size="sm"
            className="text-xs"
            onClick={() => {
              console.log("[mock] Open combined query for metrics:", selectedSlugs)
              onOpenChange(false)
            }}
          >
            Open combined query (mock)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}


interface AddToMetricSetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metricSets: Album[]
  onMetricSetsChange: (sets: Album[]) => void
  domains: Domain[]
  selectedSlugs: string[]
  selectedDomainId?: string
}

function AddToMetricSetSheet({
  open,
  onOpenChange,
  metricSets,
  onMetricSetsChange,
  domains,
  selectedSlugs,
  selectedDomainId,
}: AddToMetricSetSheetProps) {
  const [selectedMetricSetId, setSelectedMetricSetId] = useState<string | undefined>(undefined)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"team" | "private">("team")
  const [message, setMessage] = useState<string | null>(null)

  const metricSetsForDomain = useMemo(() => {
    if (!selectedDomainId) return metricSets
    return metricSets.filter((set) => set.domain === selectedDomainId)
  }, [metricSets, selectedDomainId])

  useEffect(() => {
    if (!open) return

    setName("")
    setDescription("")
    setVisibility("team")

    const defaultSetId = metricSetsForDomain[0]?.id ?? metricSets[0]?.id ?? undefined
    setSelectedMetricSetId(defaultSetId)

    setMessage(null)
  }, [open, metricSetsForDomain, metricSets])

  const handleAddSelectionToSet = () => {
    if (!selectedMetricSetId || selectedSlugs.length === 0) {
      setMessage("Select a metric set and at least one metric.")
      return
    }
    const set = metricSets.find((s) => s.id === selectedMetricSetId)
    if (!set) {
      setMessage("Selected metric set not found in mock data.")
      return
    }

    const mergedSlugs = Array.from(new Set([...(set.metricSlugs ?? []), ...selectedSlugs]))
    const updatedSet: Album = {
      ...set,
      metricSlugs: mergedSlugs,
      metricRefs: mergedSlugs.map(slug => {
        const existing = set.metricRefs?.find(r => r.slug === slug)
        return existing || { slug, version: "latest" }
      }),
    }
    const next = metricSets.map((s) => (s.id === set.id ? updatedSet : s))
    onMetricSetsChange(next)
    setMessage(
      `Added ${selectedSlugs.length} metric${selectedSlugs.length === 1 ? "" : "s"} to "${set.name}" (mock).`,
    )
  }

  const handleCreateNewSet = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setMessage("Name is required.")
      return
    }
    if (metricSets.some((set) => set.name === trimmedName)) {
      setMessage(`Metric set with name "${trimmedName}" already exists (mock uniqueness validation).`)
      return
    }
    const now = Date.now()
    const newSet: Album = {
      id: `a-${now}`,
      name: trimmedName,
      description: description.trim(),
      scope: "",
      visibility,
      domain: selectedDomainId || domains[0]?.id || "Custom",
      metricSlugs: selectedSlugs,
      metricRefs: selectedSlugs.map(slug => ({ slug, version: "latest" })),
      dimensionRefs: [],
      tags: [],
    }
    onMetricSetsChange([...metricSets, newSet])
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Add to metric set</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5 pb-6 text-xs">
          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-800">Add to existing metric set</p>
              <span className="text-[11px] text-zinc-500">
                {selectedSlugs.length
                  ? `${selectedSlugs.length} metrics selected.`
                  : "No metrics selected in the workspace."}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-700">Metric set (filtered by domain)</label>
                <Select
                  value={selectedMetricSetId ?? ""}
                  onValueChange={(value) => setSelectedMetricSetId(value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select metric set" />
                  </SelectTrigger>
                  <SelectContent>
                    {metricSetsForDomain.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  size="sm"
                  className="w-full text-xs"
                  variant="outline"
                  disabled={selectedSlugs.length === 0 || metricSetsForDomain.length === 0}
                  onClick={handleAddSelectionToSet}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-zinc-200 pt-4">
            <p className="text-xs font-semibold text-zinc-800">Create new metric set</p>
            <form className="space-y-4" onSubmit={handleCreateNewSet}>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Name</label>
                <Input
                  className="h-8 text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="2025 Q1 SGI QBR"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Description</label>
                <Textarea
                  rows={3}
                  className="text-xs"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Metric set for SGI / QBR core monetization metrics."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Visibility</label>
                <Select value={visibility} onValueChange={(value: "team" | "private") => setVisibility(value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Button type="submit" size="sm" className="text-xs">
                  Create
                </Button>
                {message && <p className="text-[11px] text-zinc-600">{message}</p>}
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
