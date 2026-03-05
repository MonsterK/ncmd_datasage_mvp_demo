import { useEffect, useMemo, useState } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ResponsiveContainer, LineChart, Line } from "recharts"
import { Flame, Search, Filter, ArrowUpDown, Plus } from "lucide-react"

import type {
  Metric,
  Album,
  Tenant,
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
  tenants: Tenant[]
  dimensionTree: DimensionTreeNode[]
  dimensions: Dimension[]
  categories: CategoryNode[]
  activeGlobalTenantId: string | null
  onOpenMetric: (fieldName: string) => void
  onRegisterMetric: (payload: NewMetricPayload) => void
  onMetricSetsChange: (sets: Album[]) => void
  onCreateDimension: (payload: {
    fieldName: string
    businessName: string
    businessOwner: string
    techOwner: string
    technicalDefinition: string
    description: string
    category: string
    categoryPath: string[]
    tenantId: string
    sourceLink: string
    sourceDimensionField: string
    values: { code: string; label: string }[]
  }) => void
  tags: Tag[]
  favoriteMetricFieldNames?: string[]
  onToggleFavoriteMetric?: (fieldName: string) => void
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
  tenants,
  dimensionTree,
  dimensions,
  categories,
  activeGlobalTenantId,
  onOpenMetric,
  onRegisterMetric,
  onMetricSetsChange,
  onCreateDimension,
  tags,
  favoriteMetricFieldNames,
  onToggleFavoriteMetric,
}: MetricsWorkspaceViewProps) {

  const selectedTenantId = activeGlobalTenantId

  const [selectedMetricSetId, setSelectedMetricSetId] = useState<string | null>(null)
  const [workspaceMode, setWorkspaceMode] = useState<"metrics" | "dimensions">("metrics")
  const [metricsViewMode, setMetricsViewMode] = useState<"view" | "library">("view")
  const [metricSetSearch, setMetricSetSearch] = useState("")
  const [metricSetSortField, setMetricSetSortField] = useState<MetricSortField>("updatedAt")
  const [metricSetSortDirection, setMetricSetSortDirection] = useState<MetricSortDirection>("desc")
  const [isNewMetricSheetOpen, setIsNewMetricSheetOpen] = useState(false)
  const [isNewMetricSetSheetOpen, setIsNewMetricSetSheetOpen] = useState(false)
  const [metricSetSheetMode, setMetricSetSheetMode] = useState<"create" | "edit">("create")
  const [metricSetToEdit, setMetricSetToEdit] = useState<Album | null>(null)
  const [isNewDimensionSheetOpen, setIsNewDimensionSheetOpen] = useState(false)
  const [selectedFieldNamesForQuery, setSelectedFieldNamesForQuery] = useState<string[]>([])
  const [isCombinedQuerySheetOpen, setIsCombinedQuerySheetOpen] = useState(false)
  const [isAddToMetricSetSheetOpen, setIsAddToMetricSetSheetOpen] = useState(false)
  const [selectedFieldNamesForAddToMetricSet, setSelectedFieldNamesForAddToMetricSet] = useState<string[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  const metricSetsForTenant = useMemo(() => {
    if (!selectedTenantId) return metricSets
    return metricSets.filter((set) => set.tenant === selectedTenantId)
  }, [metricSets, selectedTenantId])

  const filteredSets = useMemo(() => {
    let result = metricSetsForTenant

    const q = metricSetSearch.toLowerCase().trim()
    if (q) {
      result = result.filter((set) => set.name.toLowerCase().includes(q))
    }

    if (selectedTagId) {
      result = result.filter((set) => {
        if (!set.tags || set.tags.length === 0) return false
        return set.tags.includes(selectedTagId)
      })
    }

    const sorted = [...result].sort((a, b) => {
      const aTime = getMetricSetTimestamp(a, metricSetSortField)
      const bTime = getMetricSetTimestamp(b, metricSetSortField)
      return metricSetSortDirection === "asc" ? aTime - bTime : bTime - aTime
    })

    return sorted
  }, [metricSetsForTenant, metricSetSearch, metricSetSortField, metricSetSortDirection, selectedTagId])

  const selectedMetricSet = useMemo(() => {
    if (!selectedMetricSetId) return null
    return metricSets.find((s) => s.id === selectedMetricSetId) ?? null
  }, [metricSets, selectedMetricSetId])

  const metricsForSelectedSet = useMemo(() => {
    if (!selectedMetricSet) return []

    if (selectedMetricSet.metricRefs && selectedMetricSet.metricRefs.length > 0) {
      return selectedMetricSet.metricRefs
        .map((ref) => {
          const metric = metrics.find((m) => m.fieldName === ref.fieldName)
          if (!metric) return null
          return { ...metric, _refVersion: ref.version }
        })
        .filter((m) => m !== null) as (Metric & { _refVersion?: string })[]
    }

    return metrics.filter((m) => (selectedMetricSet.metricFieldNames ?? []).includes(m.fieldName))
  }, [metrics, selectedMetricSet])


  const metricsForTenant = useMemo(() => {
    if (!selectedTenantId) return metrics
    return metrics.filter((m) => m.tenant === selectedTenantId)
  }, [metrics, selectedTenantId])

  const metricFieldNamesForSelectedTags = useMemo(() => {
    if (!selectedTagId) return null
    const setsInTenant = selectedTenantId ? metricSets.filter((set) => set.tenant === selectedTenantId) : metricSets
    const fieldNames = new Set<string>()
    setsInTenant.forEach((set) => {
      if (!set.tags || set.tags.length === 0) return
      if (set.tags.includes(selectedTagId)) {
        (set.metricFieldNames ?? []).forEach((fieldName) => fieldNames.add(fieldName))
      }
    })
    return fieldNames
  }, [metricSets, selectedTenantId, selectedTagId])

  const metricsForTenantWithTagFilter = useMemo(() => {
    if (!metricFieldNamesForSelectedTags) return metricsForTenant
    return metricsForTenant.filter((m) => metricFieldNamesForSelectedTags.has(m.fieldName))
  }, [metricsForTenant, metricFieldNamesForSelectedTags])

  const dimensionsForTenant = useMemo(() => {
    if (!selectedTenantId) return dimensions
    return dimensions.filter(
      (d) => d.tenant === selectedTenantId || (d.scope && d.scope.includes(selectedTenantId)),
    )
  }, [dimensions, selectedTenantId])

  const dimensionFieldNamesForTenant = useMemo(
    () => new Set(dimensionsForTenant.map((d) => d.fieldName)),
    [dimensionsForTenant],
  )

  const filteredDimensionTree = useMemo(() => {
    if (!selectedTenantId) return dimensionTree

    const filterNode = (node: DimensionTreeNode): DimensionTreeNode | null => {
      const children =
        node.children
          ?.map(filterNode)
          .filter((child): child is DimensionTreeNode => child !== null) ?? []

      const ownFieldNames = node.dimensionFieldNames?.filter((fieldName) => dimensionFieldNamesForTenant.has(fieldName)) ?? []
      const childrenCount = children.reduce((sum, child) => sum + child.count, 0)
      const totalCount = ownFieldNames.length + childrenCount

      if (totalCount === 0) {
        return null
      }

      return {
        ...node,
        children: children.length ? children : undefined,
        dimensionFieldNames: ownFieldNames.length ? ownFieldNames : undefined,
        count: totalCount,
      }
    }

    const roots = dimensionTree
      .map(filterNode)
      .filter((node): node is DimensionTreeNode => node !== null)

    return roots
  }, [dimensionTree, dimensionFieldNamesForTenant, selectedTenantId])

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
    setSelectedFieldNamesForQuery([])
    setIsCombinedQuerySheetOpen(false)
  }, [selectedMetricSetId, workspaceMode, metricsViewMode])

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
                  setWorkspaceMode(value as "metrics" | "dimensions")
                  setSelectedMetricSetId(null)
                }}
                className="bg-slate-100/50 p-1 rounded-full border border-slate-200"
                aria-label="Toggle workspace mode"
              >
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 w-9 rounded-full bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700"
                  aria-label="New"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => setIsNewMetricSheetOpen(true)}
                  className="text-sm"
                >
                  New metric
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setMetricSetSheetMode("create")
                    setMetricSetToEdit(null)
                    setIsNewMetricSetSheetOpen(true)
                  }}
                  className="text-sm"
                >
                  New Metric View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsNewDimensionSheetOpen(true)}
                  className="text-sm"
                >
                  New dimension
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {workspaceMode === "metrics" && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Metrics</span>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={metricsViewMode}
              onValueChange={(value) => {
                if (!value) return
                setMetricsViewMode(value as "view" | "library")
                setSelectedMetricSetId(null)
              }}
              className="bg-slate-50 p-0.5 rounded-full border border-slate-200"
              aria-label="Toggle metrics view mode"
            >
              <ToggleGroupItem
                value="view"
                className="rounded-full px-4 text-xs font-medium data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-sm"
                aria-label="View Metric View"
              >
                Metric View
              </ToggleGroupItem>
              <ToggleGroupItem
                value="library"
                className="rounded-full px-4 text-xs font-medium data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-sm"
                aria-label="View metric library"
              >
                Metric library
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

         {workspaceMode === "metrics" && metricsViewMode === "view" && !selectedMetricSet && (
            <div className="grid gap-6">
            <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="relative max-w-xs">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <Input
                    className="h-7 text-[11px] pl-7 border-slate-200 focus:border-blue-300 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all rounded-lg"
                    placeholder="Search Metric Views..."
                    value={metricSetSearch}
                    onChange={(e) => setMetricSetSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2 flex min-w-0 flex-col gap-2 sm:mt-0 sm:w-64">
                <div className="flex gap-2">
                  <Select
                    value={metricSetSortField}
                    onValueChange={(value: MetricSortField) => setMetricSetSortField(value)}
                  >
                    <SelectTrigger className="h-7 text-[11px] border-slate-200 rounded-lg bg-slate-50">
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
                    <SelectTrigger className="h-7 text-[11px] border-slate-200 rounded-lg bg-slate-50">
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
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200">
                      {set.visibility}
                    </Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs text-slate-500 leading-relaxed">{set.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between w-full">
                    <span className="text-[10px] font-medium text-slate-400">
                      {(set.metricFieldNames?.length ?? 0)} metric{(set.metricFieldNames?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      View details →
                    </span>
                  </div>
                </button>
              ))}
              {filteredSets.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  No Metric Views found matching your criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {workspaceMode === "metrics" && metricsViewMode === "view" && selectedMetricSet && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedMetricSet.name}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Managing {metricsForSelectedSet.length} metrics in this view.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   className="h-8 px-3 text-xs rounded-full border-slate-200 shadow-sm hover:border-blue-200 hover:text-blue-600"
                   onClick={() => {
                     setMetricSetSheetMode("edit")
                     setMetricSetToEdit(selectedMetricSet)
                     setIsNewMetricSetSheetOpen(true)
                   }}
                >
                  Edit View
                </Button>
                <ButtonBackToMetricSets onClick={() => setSelectedMetricSetId(null)} />
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200/70 bg-white/70">
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex min-w-0 flex-1 flex-col gap-2 md:basis-1/3">
                    <span className="text-xs font-semibold text-slate-700">Search</span>
                    <Input
                      className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                      placeholder="Search metrics..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 md:basis-1/4">
                    <span className="text-xs font-semibold text-slate-700">Category</span>
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
                  <div className="flex min-w-0 flex-1 flex-col gap-2 md:basis-1/4">
                    <span className="text-xs font-semibold text-slate-700">Actions</span>
                     <Button
                        type="button"
                        size="sm"
                        className="h-9 text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                        disabled={selectedFieldNamesForQuery.length === 0}
                        onClick={() => setIsCombinedQuerySheetOpen(true)}
                      >
                        Query Selected ({selectedFieldNamesForQuery.length})
                      </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/30">
                {filteredMetricsForSelectedSet.map((m) => (
                  <Card
                    key={m.id}
                    className="group hover:shadow-lg transition-all duration-200 border-slate-200 cursor-pointer overflow-hidden flex flex-col"
                    onClick={() => onOpenMetric(m.fieldName)}
                  >
                    <CardHeader className="space-y-3 pb-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedFieldNamesForQuery.includes(m.fieldName)}
                              onCheckedChange={(value) => {
                                const isChecked = value === true
                                setSelectedFieldNamesForQuery((prev) => {
                                  if (isChecked) {
                                    if (prev.includes(m.fieldName)) return prev
                                    return [...prev, m.fieldName]
                                  }
                                  return prev.filter((fieldName) => fieldName !== m.fieldName)
                                })
                              }}
                            />
                          </div>
                          <CardTitle className="text-lg font-semibold leading-tight group-hover:text-blue-600 transition-colors truncate">
                            {m.businessName}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{m.fieldName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={m.status === "Active" ? "default" : "secondary"}
                            className={`shrink-0 ${m.status === "Active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" : ""}`}
                          >
                            {m.status}
                          </Badge>
                          {(m as any)._refVersion && (m as any)._refVersion !== "latest" && (
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              {(m as any)._refVersion}
                            </span>
                          )}
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 text-sm leading-relaxed h-10">
                        {m.businessDefinition}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-4 flex-1">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="truncate">{m.owners?.businessOwner ?? "Unknown owner"}</span>
                        </div>

                        <div className="flex items-end justify-between gap-2 pt-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                            <Flame className="h-3 w-3 text-orange-500" />
                            <span>{m.heat ?? 0} Heat</span>
                          </div>

                          {m.trend30d && m.trend30d.length > 0 && (
                            <div className="h-8 w-20 opacity-70 group-hover:opacity-100 transition-opacity">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={m.trend30d}>
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-3 pb-3 text-[11px] text-slate-400 flex justify-between items-center border-t border-slate-50 bg-slate-50/50 mt-auto">
                      <span className="truncate max-w-[150px]">{m.categoryPath.join(" › ")}</span>
                      <span>{m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : "-"}</span>
                    </CardFooter>
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

        {workspaceMode === "metrics" && metricsViewMode === "library" && (
          <MetricSearchView
            metrics={metricsForTenantWithTagFilter}
            onOpenMetric={onOpenMetric}
            initialViewMode="card"
            onAddToMetricSetFromSelection={(fieldNames) => {
              setSelectedFieldNamesForAddToMetricSet(fieldNames)
              setIsAddToMetricSetSheetOpen(true)
            }}
            favoriteMetricFieldNames={favoriteMetricFieldNames}
            onToggleFavoriteMetric={onToggleFavoriteMetric}
            tags={tags}
            selectedTagId={selectedTagId}
            onSelectTag={(tagId) => setSelectedTagId(tagId)}
          />
        )}

        {workspaceMode === "dimensions" && (
          <DimensionsWorkspaceView
            dimensionTree={selectedTenantId ? filteredDimensionTree : dimensionTree}
            dimensions={dimensionsForTenant}
          />
        )}
      </div>

      <NewMetricSheet
        open={isNewMetricSheetOpen}
        onOpenChange={setIsNewMetricSheetOpen}
        tenants={tenants}
        dimensions={dimensions}
        metrics={metrics}
        categories={categories}
        onRegisterMetric={onRegisterMetric}
        defaultTenantId={selectedTenantId}
      />

      <NewMetricSetSheet
        open={isNewMetricSetSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMetricSetToEdit(null)
            setMetricSetSheetMode("create")
          }
          setIsNewMetricSetSheetOpen(open)
        }}
        metrics={metrics}
        metricSets={metricSets}
        onMetricSetsChange={onMetricSetsChange}
        tenants={tenants}
        initialTenantId={selectedTenantId ?? undefined}
        tags={tags}
        mode={metricSetSheetMode}
        initialMetricSet={metricSetToEdit}
      />

      <NewDimensionSheet
        open={isNewDimensionSheetOpen}
        onOpenChange={setIsNewDimensionSheetOpen}
        tenants={tenants}
        categories={categories}
        defaultTenantId={selectedTenantId}
        onCreateDimension={onCreateDimension}
      />

      <AddToMetricSetSheet
        open={isAddToMetricSetSheetOpen}
        onOpenChange={setIsAddToMetricSetSheetOpen}
        metricSets={metricSets}
        onMetricSetsChange={onMetricSetsChange}
        tenants={tenants}
        selectedFieldNames={selectedFieldNamesForAddToMetricSet}
        selectedTenantId={selectedTenantId ?? undefined}
      />

      {workspaceMode === "metrics" && metricsViewMode === "view" && selectedMetricSet && (
        <CombinedQuerySheet
          open={isCombinedQuerySheetOpen}
          onOpenChange={setIsCombinedQuerySheetOpen}
          metrics={metricsForSelectedSet}
          selectedFieldNames={selectedFieldNamesForQuery}
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
      ← Back to Metric View
    </button>
  )
}

interface CombinedQuerySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metrics: Metric[]
  selectedFieldNames: string[]
  metricSetName: string
}

function CombinedQuerySheet({
  open,
  onOpenChange,
  metrics,
  selectedFieldNames,
  metricSetName,
}: CombinedQuerySheetProps) {
  const selectedMetrics = useMemo(
    () => metrics.filter((m) => selectedFieldNames.includes(m.fieldName)),
    [metrics, selectedFieldNames],
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

  const exampleLink = `aeolus://combined?metrics=${encodeURIComponent(selectedFieldNames.join(","))}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Combined query (mock)</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 pb-6 text-xs">
          <p className="text-zinc-600">
            You are about to open a combined query for{" "}
            <span className="font-semibold text-zinc-900">{selectedFieldNames.length}</span> metrics in Metric View{" "}
            <span className="font-semibold text-zinc-900">{metricSetName}</span>.
          </p>

          <div className="space-y-2">
            <p className="font-semibold text-zinc-800">Metrics</p>
            {selectedMetrics.length > 0 ? (
              <ul className="space-y-1">
                {selectedMetrics.map((m) => (
                  <li key={m.fieldName} className="flex items-center justify-between gap-2">
                    <span>{m.businessName}</span>
                    <span className="font-mono text-[11px] text-zinc-500">{m.fieldName}</span>
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
              console.log("[mock] Open combined query for metrics:", selectedFieldNames)
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
  tenants: Tenant[]
  selectedFieldNames: string[]
  selectedTenantId?: string
}

function AddToMetricSetSheet({
  open,
  onOpenChange,
  metricSets,
  onMetricSetsChange,
  tenants,
  selectedFieldNames,
  selectedTenantId,
}: AddToMetricSetSheetProps) {
  const [selectedMetricSetId, setSelectedMetricSetId] = useState<string | undefined>(undefined)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"team" | "private">("team")
  const [message, setMessage] = useState<string | null>(null)

  const metricSetsForTenant = useMemo(() => {
    if (!selectedTenantId) return metricSets
    return metricSets.filter((set) => set.tenant === selectedTenantId)
  }, [metricSets, selectedTenantId])

  useEffect(() => {
    if (!open) return

    setName("")
    setDescription("")
    setVisibility("team")

    const defaultSetId = metricSetsForTenant[0]?.id ?? metricSets[0]?.id ?? undefined
    setSelectedMetricSetId(defaultSetId)

    setMessage(null)
  }, [open, metricSetsForTenant, metricSets])

  const handleAddSelectionToSet = () => {
    if (!selectedMetricSetId || selectedFieldNames.length === 0) {
      setMessage("Select a Metric View and at least one metric.")
      return
    }
    const set = metricSets.find((s) => s.id === selectedMetricSetId)
    if (!set) {
      setMessage("Selected Metric View not found in mock data.")
      return
    }

    const mergedFieldNames = Array.from(new Set([...(set.metricFieldNames ?? []), ...selectedFieldNames]))
    const updatedSet: Album = {
      ...set,
      metricFieldNames: mergedFieldNames,
      metricRefs: mergedFieldNames.map(fieldName => {
        const existing = set.metricRefs?.find(r => r.fieldName === fieldName)
        return existing || { fieldName, version: "latest" }
      }),
    }
    const next = metricSets.map((s) => (s.id === set.id ? updatedSet : s))
    onMetricSetsChange(next)
    setMessage(
      `Added ${selectedFieldNames.length} metric${selectedFieldNames.length === 1 ? "" : "s"} to "${set.name}" (mock).`,
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
      setMessage(`Metric View with name "${trimmedName}" already exists (mock uniqueness validation).`)
      return
    }
    const now = Date.now()
    const newSet: Album = {
      id: `a-${now}`,
      name: trimmedName,
      description: description.trim(),
      scope: "",
      visibility,
      tenant: selectedTenantId || tenants[0]?.id || "Custom",
      metricFieldNames: selectedFieldNames,
      metricRefs: selectedFieldNames.map(fieldName => ({ fieldName, version: "latest" })),
      dimensionRefs: [],
      tags: [],
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      history: [
        {
          version: "v1",
          editor: "Current User",
          timestamp: new Date(now).toISOString(),
          action: "create",
          comment: "Initial creation via Add to Metric View",
        }
      ]
    }
    onMetricSetsChange([...metricSets, newSet])
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Add to Metric View</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5 pb-6 text-xs">
          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-800">Add to existing Metric View</p>
              <span className="text-[11px] text-zinc-500">
                {selectedFieldNames.length
                  ? `${selectedFieldNames.length} metrics selected.`
                  : "No metrics selected in the workspace."}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-700">Metric View (filtered by tenant)</label>
                <Select
                  value={selectedMetricSetId ?? ""}
                  onValueChange={(value) => setSelectedMetricSetId(value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select Metric View" />
                  </SelectTrigger>
                  <SelectContent>
                    {metricSetsForTenant.map((set) => (
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
                  disabled={selectedFieldNames.length === 0 || metricSetsForTenant.length === 0}
                  onClick={handleAddSelectionToSet}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-zinc-200 pt-4">
            <p className="text-xs font-semibold text-zinc-800">Create new Metric View</p>
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
                  placeholder="Metric View for SGI / QBR core monetization metrics."
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
