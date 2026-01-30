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
import { Flame } from "lucide-react"

import type { Metric, Domain, Album, Dimension, DimensionTreeNode, CategoryNode, NewMetricPayload, Tag } from "@/App"
import { getMetricTimestamp } from "@/App"
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
    return metrics.filter((m) => selectedMetricSet.metricSlugs.includes(m.slug))
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
        set.metricSlugs.forEach((slug) => slugs.add(slug))
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
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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
                className="rounded-full bg-white p-1 text-xs shadow-sm"
                aria-label="Toggle metrics workspace mode"
              >
              <ToggleGroupItem
                value="metricSets"
                className="rounded-full px-3 py-1 text-xs font-medium"
                aria-label="View metric sets"
              >
                Metric sets
              </ToggleGroupItem>
              <ToggleGroupItem
                value="metrics"
                className="rounded-full px-3 py-1 text-xs font-medium"
                aria-label="View metrics"
              >
                Metrics
              </ToggleGroupItem>
              <ToggleGroupItem
                value="dimensions"
                className="rounded-full px-3 py-1 text-xs font-medium"
                aria-label="View dimensions"
              >
                Dimensions
              </ToggleGroupItem>
            </ToggleGroup>
            {selectedDomainId && (
              <div className="text-[11px] text-zinc-500">
                Domain:{" "}
                <span className="font-mono text-zinc-700">
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
              className="rounded-full px-3 py-1 text-xs shadow-sm hover:shadow-md"
              onClick={() => setIsNewMetricSheetOpen(true)}
            >
              New metric
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-3 py-1 text-xs shadow-sm hover:shadow-md"
              onClick={() => setIsNewMetricSetSheetOpen(true)}
            >
              New metric set
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-3 py-1 text-xs shadow-sm hover:shadow-md"
              onClick={() => setIsNewDimensionSheetOpen(true)}
            >
              New dimension
            </Button>
          </div>
        </div>

        {(workspaceMode === "metricSets" || workspaceMode === "metrics") && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-medium text-zinc-600">Tags</span>
            <div className="flex flex-wrap gap-1">
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
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                        isActive
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                      }`}
                    >
                      {tag.name}
                    </button>
                  )
                })
              ) : (
                <span className="text-[11px] text-zinc-400">
                  No tags configured yet. Use Metric set management → Manage tags.
                </span>
              )}
            </div>
            {selectedTagIds.length > 0 && (
              <button
                type="button"
                className="text-[11px] text-indigo-600 underline"
                onClick={() => setSelectedTagIds([])}
              >
                Clear
              </button>
            )}
          </div>
        )}

         {workspaceMode === "metricSets" && !selectedMetricSet && (
          <Card>
            <CardContent>
              <div className="space-y-3 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[11px] font-medium text-zinc-600">Search metric sets</span>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Search by metric set name or description…"
                      value={metricSetSearch}
                      onChange={(e) => setMetricSetSearch(e.target.value)}
                    />
                  </div>
                  <div className="mt-1 flex min-w-0 flex-col gap-1 sm:mt-0 sm:w-64">
                    <span className="text-[11px] font-medium text-zinc-600">Sort</span>
                    <div className="flex gap-2">
                      <Select
                        value={metricSetSortField}
                        onValueChange={(value: MetricSortField) => setMetricSetSortField(value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Asc</SelectItem>
                          <SelectItem value="desc">Desc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredSets.map((set) => (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() => handleSelectMetricSet(set.id)}
                      className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{set.name}</div>
                          <div className="text-[11px] text-zinc-500">Domain: {set.domain}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {set.visibility}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[11px] text-zinc-600">{set.description}</p>
                      <p className="mt-2 text-[11px] text-zinc-500">
                        {set.metricSlugs.length} metric{set.metricSlugs.length === 1 ? "" : "s"} in this set.
                      </p>
                    </button>
                  ))}
                  {filteredSets.length === 0 && (
                    <p className="text-xs text-zinc-500">
                      No metric sets for the selected domain in the mock data.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {workspaceMode === "metricSets" && selectedMetricSet && (
          <Card>
            <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm">Metric set: {selectedMetricSet.name}</CardTitle>
                <CardDescription className="text-xs">
                  Metrics inside this set. Click a metric card to open the profile drawer on the right.
                </CardDescription>
              </div>
              <ButtonBackToMetricSets onClick={() => setSelectedMetricSetId(null)} />
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-3 text-xs">
                <div className="flex min-w-0 flex-1 flex-col gap-1 md:basis-1/3">
                  <span className="text-[11px] font-medium text-zinc-600">Search in this metric set</span>
                  <Input
                    className="h-8 text-xs"
                    placeholder="Search by business name, slug or definition…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 md:basis-1/3">
                  <span className="text-[11px] font-medium text-zinc-600">Category path</span>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 text-xs">
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
                <div className="flex min-w-0 flex-1 flex-col gap-1 md:basis-1/3">
                  <span className="text-[11px] font-medium text-zinc-600">Owners &amp; query</span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={businessOwnerFilter} onValueChange={setBusinessOwnerFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Business owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All owners</SelectItem>
                        {metricBusinessOwnerOptions.map((owner) => (
                          <SelectItem key={owner} value={owner}>
                            {owner}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={techOwnerFilter} onValueChange={setTechOwnerFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Tech owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All tech</SelectItem>
                        {metricTechOwnerOptions.map((owner) => (
                          <SelectItem key={owner} value={owner}>
                            {owner}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 md:basis-1/3">
                  <span className="text-[11px] font-medium text-zinc-600">Query &amp; sort</span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={hasQueryFilter}
                      onValueChange={(value: HasQueryFilter) => setHasQueryFilter(value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Has bound query" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Has query</SelectItem>
                        <SelectItem value="no">No query</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortField} onValueChange={(value: MetricSortField) => setSortField(value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Created time</SelectItem>
                        <SelectItem value="updatedAt">Updated time</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={sortDirection}
                      onValueChange={(value: MetricSortDirection) => setSortDirection(value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Asc</SelectItem>
                        <SelectItem value="desc">Desc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-zinc-500">
                  {selectedSlugsForQuery.length
                    ? `${selectedSlugsForQuery.length} metrics selected for combined query.`
                    : "Select metrics to run a combined query (mock)."}
                </span>
                <Button
                  type="button"
                  size="sm"
                  className="text-xs"
                  variant="outline"
                  disabled={selectedSlugsForQuery.length === 0}
                  onClick={() => setIsCombinedQuerySheetOpen(true)}
                >
                  Query selected metrics
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {filteredMetricsForSelectedSet.map((m) => (
                  <Card
                    key={m.id}
                    className="cursor-pointer transition hover:border-zinc-300 hover:shadow-md"
                    onClick={() => onOpenMetric(m.slug)}
                  >
                    <CardHeader className="flex flex-row items-start justify-between gap-2">
                      <div className="flex flex-1 items-start gap-2">
                        <Checkbox
                          className="mt-1"
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
                          <CardTitle className="text-sm">{m.businessName}</CardTitle>
                          <CardDescription className="text-[11px] font-mono text-zinc-500">
                            {m.slug}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-right">
                        <Badge variant="outline" className="text-[10px]">
                          {m.status}
                        </Badge>
                        <div className="text-[11px] text-zinc-500">{m.domain}</div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-xs text-zinc-700">{m.businessDefinition}</p>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span className="font-medium text-zinc-700">{m.heat ?? 0}</span>
                        </div>
                        {m.trend30d && m.trend30d.length > 0 && (
                          <div className="h-10 w-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={m.trend30d}
                                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                              >
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#111827"
                                  strokeWidth={1.5}
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
                  <p className="text-xs text-zinc-500">
                    No metrics mapped to this metric set in the mock data.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
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
      className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md"
    >
      Back to metric sets
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

    const mergedSlugs = Array.from(new Set([...set.metricSlugs, ...selectedSlugs]))
    const updatedSet: Album = {
      ...set,
      metricSlugs: mergedSlugs,
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
