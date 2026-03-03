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

import { Metric, Tag } from "@/types"
import { getMetricTimestamp } from "@/lib/utils"

export interface MetricSearchViewProps {
  metrics: Metric[]
  onOpenMetric: (fieldName: string) => void
  initialViewMode?: MetricViewMode
  onAddToMetricSetFromSelection?: (metricFieldNames: string[]) => void
  favoriteMetricFieldNames?: string[]
  onToggleFavoriteMetric?: (fieldName: string) => void
  tags?: Tag[]
  selectedTagId?: string | null
  onSelectTag?: (tagId: string | null) => void
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
  tags,
  selectedTagId,
  onSelectTag,
}: MetricSearchViewProps) {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<MetricViewMode>(initialViewMode ?? "card")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [businessOwnerFilter, setBusinessOwnerFilter] = useState<string>("all")
  const [techOwnerFilter, setTechOwnerFilter] = useState<string>("all")
  const [hasQueryFilter, setHasQueryFilter] = useState<HasQueryFilter>("all")
  const [sortField, setSortField] = useState<MetricSortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<MetricSortDirection>("desc")
  const [selectedMetricFieldNames, setSelectedMetricFieldNames] = useState<string[]>([])

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

  useEffect(() => {
    setSelectedMetricFieldNames((prev) => prev.filter((fieldName) => metrics.some((m) => m.fieldName === fieldName)))
  }, [metrics])

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Header Section */}
      <div className="border-b bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <Input
                placeholder="Search metrics by name, description, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-7 bg-slate-50 border-slate-200 focus:bg-white transition-colors text-[11px]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-7 text-[11px] w-[160px] bg-white">
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={businessOwnerFilter} onValueChange={setBusinessOwnerFilter}>
                <SelectTrigger className="h-7 text-[11px] w-[150px] bg-white">
                  <SelectValue placeholder="All business owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Business Owners</SelectItem>
                  {businessOwnerOptions.map((owner) => (
                    <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortField} onValueChange={(value: MetricSortField) => setSortField(value)}>
                <SelectTrigger className="h-7 text-[11px] w-[130px] bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                </SelectContent>
              </Select>
              {tags && tags.length > 0 && onSelectTag && (
                <Select
                  value={selectedTagId ?? "all"}
                  onValueChange={(value) => onSelectTag(value === "all" ? null : value)}
                >
                  <SelectTrigger className="h-7 text-[11px] w-[140px] bg-white">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-slate-500"
                onClick={() => {
                  setCategoryFilter("all")
                  setBusinessOwnerFilter("all")
                  setTechOwnerFilter("all")
                  setHasQueryFilter("all")
                  setSearch("")
                  onSelectTag?.(null)
                }}
              >
                Reset Filters
              </Button>
            </div>
            <div className="flex items-center gap-2 border-l pl-3 ml-2">
               <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 rounded-md ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                  onClick={() => setViewMode('card')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {hasBulkSelection && (
             <div className="flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-blue-900 font-medium">
                  {selectedMetricFieldNames.length
                    ? `${selectedMetricFieldNames.length} metrics selected`
                    : "Select metrics to add to your set"}
                </span>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                disabled={selectedMetricFieldNames.length === 0}
                onClick={() => {
                  if (!onAddToMetricSetFromSelection || selectedMetricFieldNames.length === 0) return
                  onAddToMetricSetFromSelection(selectedMetricFieldNames)
                }}
              >
                Add to Metric View
              </Button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
              <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No metrics found</h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                We couldn't find any metrics matching your criteria. Try adjusting your search terms or filters.
              </p>
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(metric => (
                <Card 
                  key={metric.id} 
                  className={`group hover:shadow-lg transition-all duration-200 border-slate-200 cursor-pointer overflow-hidden flex flex-col ${selectedMetricFieldNames.includes(metric.fieldName) ? 'ring-2 ring-blue-500 border-transparent' : 'hover:border-blue-200'}`}
                  onClick={() => onOpenMetric(metric.fieldName)}
                >
                  <CardHeader className="space-y-3 pb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                         {hasBulkSelection && (
                          <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedMetricFieldNames.includes(metric.fieldName)}
                              onCheckedChange={(checked) => {
                                setSelectedMetricFieldNames(prev => 
                                  checked 
                                    ? [...prev, metric.fieldName]
                                    : prev.filter(s => s !== metric.fieldName)
                                )
                              }}
                            />
                          </div>
                        )}
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
                        <Badge 
                          variant={metric.status === 'Active' ? 'default' : 'secondary'}
                          className={`shrink-0 ${metric.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200' : ''}`}
                        >
                          {metric.status}
                        </Badge>
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
                      
                      <div className="flex items-end justify-between gap-2 pt-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span>{metric.heat ?? 0} Heat</span>
                        </div>
                        
                        {metric.trend30d && metric.trend30d.length > 0 && (
                          <div className="h-8 w-20 opacity-70 group-hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={metric.trend30d}>
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
                    <span className="truncate max-w-[150px]">{metric.categoryPath.join(" › ")}</span>
                    <span>{metric.updatedAt ? new Date(metric.updatedAt).toLocaleDateString() : "-"}</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    {onToggleFavoriteMetric && <TableHead className="w-10"></TableHead>}
                    {hasBulkSelection && <TableHead className="w-12"></TableHead>}
                    <TableHead>Metric Name</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
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
                    {hasBulkSelection && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedMetricFieldNames.includes(m.fieldName)}
                            onCheckedChange={(checked) => {
                              setSelectedMetricFieldNames(prev => 
                                checked 
                                  ? [...prev, m.fieldName]
                                  : prev.filter(s => s !== m.fieldName)
                              )
                            }}
                          />
                        </TableCell>
                      )}
                    <TableCell className="font-medium text-slate-900">{m.businessName}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{m.fieldName}</TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[200px] truncate" title={m.categoryPath.join(" > ")}>
                        {m.categoryPath.join(" › ")}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{m.owners.businessOwner}</TableCell>
                      <TableCell>
                         <Badge 
                          variant="outline" 
                          className={`text-[10px] ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}`}
                        >
                          {m.status}
                        </Badge>
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
