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
  activeGlobalTenantId: string | null
  onOpenMetric: (fieldName: string) => void
  onRegisterMetric: (payload: NewMetricPayload) => void
  onMetricSetsChange: (sets: Album[]) => void
  onCreateDimension: (payload: {
    fieldName: string
    businessName: string
    businessOwner: string
    techOwner: string
    description: string
    category: string
    tenantId: string
    sourceLink: string
    sourceDimensionField: string
    values: { code: string; label: string }[]
  }) => void
  tags: Tag[]
  favoriteMetricFieldNames?: string[]
  onToggleFavoriteMetric?: (fieldName: string) => void
}

export function MetricsWorkspaceView({
  metrics,
  metricSets,
  tenants,
  dimensionTree,
  dimensions,
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

  const [workspaceMode, setWorkspaceMode] = useState<"metrics" | "dimensions">("metrics")
  const [isNewMetricSheetOpen, setIsNewMetricSheetOpen] = useState(false)
  const [isNewDimensionSheetOpen, setIsNewDimensionSheetOpen] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)


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
          <MetricSearchView
            metrics={metricsForTenantWithTagFilter}
            onOpenMetric={onOpenMetric}
            initialViewMode="card"
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
        onRegisterMetric={onRegisterMetric}
        defaultTenantId={selectedTenantId}
      />

      <NewDimensionSheet
        open={isNewDimensionSheetOpen}
        onOpenChange={setIsNewDimensionSheetOpen}
        tenants={tenants}
        defaultTenantId={selectedTenantId}
        onCreateDimension={onCreateDimension}
      />
    </div>
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
      setMessage("Select a metric set and at least one metric.")
      return
    }
    const set = metricSets.find((s) => s.id === selectedMetricSetId)
    if (!set) {
      setMessage("Selected metric set not found in mock data.")
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
          comment: "Initial creation via Add to Metric Set",
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
          <SheetTitle className="text-sm font-semibold">Add to metric set</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5 pb-6 text-xs">
          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-800">Add to existing metric set</p>
              <span className="text-[11px] text-zinc-500">
                {selectedFieldNames.length
                  ? `${selectedFieldNames.length} metrics selected.`
                  : "No metrics selected in the workspace."}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-700">Metric set (filtered by tenant)</label>
                <Select
                  value={selectedMetricSetId ?? ""}
                  onValueChange={(value) => setSelectedMetricSetId(value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select metric set" />
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
