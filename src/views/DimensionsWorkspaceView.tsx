import { useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DimensionTreeNode, Dimension } from "@/types"
import { 
  Folder, 
  Tag, 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Filter, 
  ArrowUpDown,
  Database,
  Share2,
  History,
  FileText,
  Flame,
  ArrowRight,
  User,
  Info,
  Truck
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export interface DimensionsWorkspaceViewProps {
  dimensionTree: DimensionTreeNode[]
  dimensions: Dimension[]
}

export type DimensionViewMode = "card" | "list"
export type DimensionSortField = "name" | "updatedAt" | "usage"

export function DimensionsWorkspaceView({ dimensionTree, dimensions }: DimensionsWorkspaceViewProps) {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<DimensionViewMode>("card")
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [sortField, setSortField] = useState<DimensionSortField>("updatedAt")

  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [ownerFilter, setOwnerFilter] = useState<string>("all")

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    dimensions.forEach((d) => {
      const pathStr = d.categoryPath?.join(" › ") ?? d.category
      if (pathStr) set.add(pathStr)
    })
    return Array.from(set).sort()
  }, [dimensions])

  const ownerOptions = useMemo(() => {
    const set = new Set<string>()
    dimensions.forEach((d) => {
      if (d.owner) {
        set.add(d.owner)
      }
    })
    return Array.from(set).sort()
  }, [dimensions])

  const filteredDimensions = useMemo(() => {
    let result = dimensions
    
    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.fieldName.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== "all") {
      result = result.filter(d => (d.categoryPath?.join(" › ") ?? d.category) === categoryFilter)
    }

    if (ownerFilter !== "all") {
      result = result.filter(d => d.owner === ownerFilter)
    }

    return result.sort((a, b) => {
      if (sortField === "name") {
        return a.name.localeCompare(b.name)
      }
      if (sortField === "usage") {
        return b.boundMetricFieldNames.length - a.boundMetricFieldNames.length
      }
      // updatedAt
      const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return tB - tA
    })
  }, [dimensions, search, categoryFilter, ownerFilter, sortField])

  const handleDimensionClick = (dim: Dimension) => {
    setSelectedDimension(dim)
    setIsDetailSheetOpen(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search dimensions by name, field name, or description..."
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

            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="h-9 text-xs w-[150px] bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="All owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {ownerOptions.map((owner) => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
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
        {filteredDimensions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No dimensions found</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
              We couldn't find any dimensions matching your criteria. Try adjusting your search terms or filters.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch("")
                setSortField("updatedAt")
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDimensions.map(dim => (
                <Card 
                key={dim.id} 
                className="group hover:shadow-lg transition-all duration-200 border-slate-200 cursor-pointer overflow-hidden flex flex-col hover:border-blue-200"
                onClick={() => handleDimensionClick(dim)}
              >
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold leading-tight group-hover:text-blue-600 transition-colors truncate">
                        {dim.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{dim.fieldName}</span>
                        <span className="text-slate-300">•</span>
                        <span>{dim.type}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={dim.status === "Active" ? "default" : "secondary"}
                      className={`shrink-0 ${dim.status === "Active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                    >
                      {dim.status || "Active"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-sm leading-relaxed h-10">
                    {dim.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-4 flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{dim.owner || "PM"}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 pb-3 text-[11px] text-slate-400 flex justify-between items-center border-t border-slate-50 bg-slate-50/50 mt-auto">
                  <span className="truncate max-w-[150px]">
                    {dim.categoryPath?.join(" › ") ?? dim.category ?? "Uncategorized"}
                  </span>
                  <span>{dim.updatedAt ? new Date(dim.updatedAt).toLocaleDateString() : "-"}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden border-slate-200 shadow-sm rounded-2xl">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Dimension Name</TableHead>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDimensions.map((d) => (
                  <TableRow 
                    key={d.id} 
                    className="cursor-pointer hover:bg-slate-50/80"
                    onClick={() => handleDimensionClick(d)}
                  >
                    <TableCell className="font-medium text-slate-900">{d.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{d.fieldName}</TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {d.categoryPath?.join(" › ") ?? d.category ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{d.owner || "PM"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={d.status === "Active" ? "default" : "secondary"}
                        className={`shrink-0 ${d.status === "Active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {d.status || "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{d.boundMetricFieldNames.length} metrics</TableCell>
                    <TableCell className="text-xs text-slate-500 text-right">{d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <DimensionDetailSheet 
        open={isDetailSheetOpen} 
        onOpenChange={setIsDetailSheetOpen} 
        dimension={selectedDimension} 
      />
    </div>
  )
}

interface DimensionDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dimension: Dimension | null
}

function DimensionDetailSheet({ open, onOpenChange, dimension }: DimensionDetailSheetProps) {
  const latestDeploy = useMemo(() => {
    if (!dimension?.deployHistory || dimension.deployHistory.length === 0) return null
    return dimension.deployHistory[dimension.deployHistory.length - 1]
  }, [dimension])

  if (!dimension) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl p-0">
        <SheetHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between bg-white/80 border-b border-slate-200/70 p-6">
          <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-bold text-slate-900">{dimension.name}</CardTitle>
                <Badge variant={dimension.status === "Active" ? "default" : "secondary"} className={`h-6 text-[10px] px-2 rounded-full ${dimension.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                  {dimension.status || "Active"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono bg-white px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                  {dimension.fieldName}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">
                  Category: {dimension.categoryPath?.join(" › ") ?? dimension.category}
                </span>
              </div>
            </div>
        </SheetHeader>

        <div className="px-6 py-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-1">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-500" />
                  Business Information
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Business definition and ownership details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-5 text-xs">
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-800">Description</p>
                  <p className="text-slate-600 leading-relaxed">{dimension.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-slate-500">Owner</span>
                    <p className="font-medium text-slate-900">{dimension.owner || "PM"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                Technical Information
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Technical definition and configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-5 text-xs">
              <div className="space-y-1">
                 <span className="text-slate-500">Technical Definition (SQL)</span>
                 <div className="font-mono text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 overflow-x-auto">
                   {dimension.technicalDefinition || "No definition provided."}
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-orange-500" />
                Enum Values
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Enumerated values and their meanings.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs h-9">Code</TableHead>
                    <TableHead className="text-xs h-9">Label</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dimension.values && dimension.values.length > 0 ? (
                    dimension.values.map((val, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/50">
                        <TableCell className="text-xs font-mono py-2">{val.code}</TableCell>
                        <TableCell className="text-xs py-2">{val.label}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-xs text-slate-400 text-center py-4 italic">
                        No enum values defined.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Source Info
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Source table and field mapping.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 text-xs">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-3">Physical Info</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-slate-500">Hive Table</span>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate">
                        {dimension.sourceLink || "Not configured"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Hive Field</span>
                    <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      {dimension.sourceDimensionField || "Not configured"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deploy Scenario */}
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
             <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-emerald-500" />
                      Deploy Scenario
                    </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Deployment status and history.
                  </CardDescription>
                 </div>
                 <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full transition-colors shadow-sm"
                 >
                   Deploy
                 </button>
               </div>
            </CardHeader>
            <CardContent className="p-5 text-xs">
               <div className="space-y-1.5">
                  <p className="font-semibold text-slate-800">Deploy status</p>
                  {latestDeploy ? (
                    <div className="text-xs text-slate-600 space-y-2">
                      <div>
                        {latestDeploy.targetType} · {latestDeploy.target}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {latestDeploy.status} · {new Date(latestDeploy.deployedAt).toLocaleString()}
                      </div>
                      {dimension.deployHistory && dimension.deployHistory.length > 1 && (
                        <div className="space-y-1 text-[11px] text-slate-500">
                          {dimension.deployHistory.slice(-3).reverse().map((item, index) => (
                            <div key={`${item.target}-${item.deployedAt}-${index}`}>
                              {item.targetType} · {item.target} · {item.status}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No deploy history yet.</p>
                  )}
                </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="h-4 w-4 text-purple-500" />
                Version History
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Change logs for this dimension.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {dimension.history?.map((log, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="min-w-[30px] pt-1 flex flex-col items-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500 ring-2 ring-purple-50"></div>
                      {i !== (dimension.history?.length ?? 0) - 1 && <div className="w-px h-full bg-slate-100 my-1"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900">{log.version}</span>
                        <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-medium text-slate-800 mr-1">{log.editor}</span>
                        <span>{log.action}d this dimension.</span>
                      </div>
                      {log.comment && <p className="text-slate-500 italic mt-0.5">"{log.comment}"</p>}
                    </div>
                  </div>
                )) ?? <p className="text-slate-400 italic">No history available.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
