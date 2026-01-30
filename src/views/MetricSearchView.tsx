import { useEffect, useMemo, useState } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
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
import { Search as SearchIcon, Flame } from "lucide-react"
import { ResponsiveContainer, LineChart, Line } from "recharts"

import { Metric } from "@/types"
import { getMetricTimestamp } from "@/lib/utils"

export interface MetricSearchViewProps {
  metrics: Metric[]
  onOpenMetric: (slug: string) => void
  initialViewMode?: MetricViewMode
  onAddToMetricSetFromSelection?: (metricSlugs: string[]) => void
}

export type MetricViewMode = "card" | "list"

export type MetricSortField = "createdAt" | "updatedAt"
export type MetricSortDirection = "asc" | "desc"
export type HasQueryFilter = "all" | "yes" | "no"

export function MetricSearchView({ metrics, onOpenMetric, initialViewMode, onAddToMetricSetFromSelection }: MetricSearchViewProps) {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<MetricViewMode>(initialViewMode ?? "list")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [businessOwnerFilter, setBusinessOwnerFilter] = useState<string>("all")
  const [techOwnerFilter, setTechOwnerFilter] = useState<string>("all")
  const [hasQueryFilter, setHasQueryFilter] = useState<HasQueryFilter>("all")
  const [sortField, setSortField] = useState<MetricSortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<MetricSortDirection>("desc")
  const [selectedMetricSlugs, setSelectedMetricSlugs] = useState<string[]>([])

  const hasBulkSelection = typeof onAddToMetricSetFromSelection === "function"

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
    metrics,
    search,
    categoryFilter,
    businessOwnerFilter,
    techOwnerFilter,
    hasQueryFilter,
    sortField,
    sortDirection,
  ])

  useEffect(() => {
    setSelectedMetricSlugs((prev) => prev.filter((slug) => metrics.some((m) => m.slug === slug)))
  }, [metrics])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="space-y-3 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle>Metric search & list</CardTitle>
                <CardDescription>
                  Search across metric registry and open a metric profile. Toggle between card and list view.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1">
                  <SearchIcon className="h-4 w-4 text-zinc-500" />
                  <Input
                    className="h-8 border-0 px-1 text-xs shadow-none focus-visible:ring-0"
                    placeholder="Search by business name, slug or definition…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 text-xs">
                  <button
                    type="button"
                    className={`flex items-center gap-1 rounded px-2 py-1 ${
                      viewMode === "card" ? "bg-zinc-900 text-white" : "text-zinc-700"
                    }`}
                    onClick={() => setViewMode("card")}
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-1 rounded px-2 py-1 ${
                      viewMode === "list" ? "bg-zinc-900 text-white" : "text-zinc-700"
                    }`}
                    onClick={() => setViewMode("list")}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex min-w-0 flex-1 flex-col gap-1 md:basis-1/4">
                <span className="text-[11px] font-medium text-zinc-600">Category path</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 md:basis-1/4">
                <span className="text-[11px] font-medium text-zinc-600">Business owner</span>
                <Select value={businessOwnerFilter} onValueChange={setBusinessOwnerFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All business owners" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {businessOwnerOptions.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 md:basis-1/4">
                <span className="text-[11px] font-medium text-zinc-600">Tech owner</span>
                <Select value={techOwnerFilter} onValueChange={setTechOwnerFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All tech owners" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {techOwnerOptions.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 md:basis-1/4">
                <span className="text-[11px] font-medium text-zinc-600">Query & sort</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={hasQueryFilter} onValueChange={(value: HasQueryFilter) => setHasQueryFilter(value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Has bound query" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All queries</SelectItem>
                      <SelectItem value="yes">Has bound query</SelectItem>
                      <SelectItem value="no">No bound query</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-1 gap-2">
                    <Select value={sortField} onValueChange={(value: MetricSortField) => setSortField(value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sort field" />
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
            </div>
          </div>
        </CardHeader>
      </Card>

      {hasBulkSelection && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs">
          <span className="text-[11px] text-zinc-600">
            {selectedMetricSlugs.length
              ? `${selectedMetricSlugs.length} selected for metric set.`
              : "Select metrics in card or list view, then add them into a metric set."}
          </span>
          <Button
            type="button"
            size="sm"
            className="text-xs"
            variant="outline"
            disabled={selectedMetricSlugs.length === 0}
            onClick={() => {
              if (!onAddToMetricSetFromSelection || selectedMetricSlugs.length === 0) return
              onAddToMetricSetFromSelection(selectedMetricSlugs)
            }}
          >
            Add to metric set
          </Button>
        </div>
      )}

      {viewMode === "card" && (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((m) => (
            <Card
              key={m.id}
              className="cursor-pointer transition hover:border-zinc-300 hover:shadow-md"
              onClick={() => onOpenMetric(m.slug)}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex flex-1 items-start gap-2">
                  {hasBulkSelection && (
                    <Checkbox
                      className="mt-1"
                      aria-label="Select metric"
                      checked={selectedMetricSlugs.includes(m.slug)}
                      onCheckedChange={(value) => {
                        const isChecked = value === true
                        setSelectedMetricSlugs((prev) => {
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
                    />
                  )}
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
                  <div className="text-[11px] text-zinc-500">{m.categoryPath.join(" › ")}</div>
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
                        <LineChart data={m.trend30d} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
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
          {filtered.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No metrics match the search</CardTitle>
                <CardDescription>Try a different keyword or clear the search input.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      )}

      {viewMode === "list" && (
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm">Metric list</CardTitle>
              <CardDescription>Click a row to open the metric profile.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {hasBulkSelection && <TableHead className="w-8" />}
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => onOpenMetric(m.slug)}>
                    {hasBulkSelection && (
                      <TableCell
                        className="w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <Checkbox
                          aria-label="Select metric"
                          checked={selectedMetricSlugs.includes(m.slug)}
                          onCheckedChange={(value) => {
                            const isChecked = value === true
                            setSelectedMetricSlugs((prev) => {
                              if (isChecked) {
                                if (prev.includes(m.slug)) return prev
                                return [...prev, m.slug]
                              }
                              return prev.filter((slug) => slug !== m.slug)
                            })
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-xs font-medium">{m.businessName}</TableCell>
                    <TableCell className="text-[11px] font-mono text-zinc-600">{m.slug}</TableCell>
                    <TableCell className="text-xs text-zinc-600">{m.domain}</TableCell>
                    <TableCell className="text-xs text-zinc-600">
                      {m.categoryPath.join(" › ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {m.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption className="text-xs">
                {hasBulkSelection
                  ? "Listing metrics from the mock registry. Select metrics above and click \"Add to metric set\" to group them."
                  : "Listing metrics from the mock registry. Click any row to inspect its metric profile."}
              </TableCaption>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
