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
  Info
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
  const [typeFilter, setTypeFilter] = useState<string>("all")

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

    if (typeFilter !== "all") {
      result = result.filter(d => d.type === typeFilter)
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
  }, [dimensions, search, typeFilter, sortField])

  const typeOptions = useMemo(() => {
    const types = new Set(dimensions.map(d => d.type))
    return Array.from(types).sort()
  }, [dimensions])

  const handleDimensionClick = (dim: Dimension) => {
    setSelectedDimension(dim)
    setIsDetailSheetOpen(true)
  }

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="border-b border-slate-200/70 bg-white/90 px-5 py-3 sticky top-16 z-10 backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <Input
                placeholder="Search dimensions by name, field name, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-8 bg-slate-50 border-slate-200 focus:bg-white transition-colors text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-xs w-[150px] bg-white">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortField} onValueChange={(value: DimensionSortField) => setSortField(value)}>
                <SelectTrigger className="h-8 text-xs w-[140px] bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="usage">Usage Count</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-slate-500"
                onClick={() => {
                  setTypeFilter("all")
                  setSearch("")
                  setSortField("updatedAt")
                }}
              >
                Reset Filters
              </Button>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200/70 pl-3 ml-2">
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

      <div className="flex-1 overflow-auto px-5 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredDimensions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
              <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No dimensions found</h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                We couldn't find any dimensions matching your criteria. Try adjusting your search terms or filters.
              </p>
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
                        <span className="truncate">{dim.owners?.techOwner || "DE"}</span>
                      </div>
                      
                      <div className="flex items-end justify-between gap-2 pt-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                          <Share2 className="h-3 w-3 text-blue-500" />
                          <span>{dim.boundMetricFieldNames.length} Metrics</span>
                        </div>
                        
                        {dim.values && dim.values.length > 0 && (
                          <div className="text-[10px] text-slate-400">
                            {dim.values.length} values
                          </div>
                        )}
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
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Dimension Name</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tech Owner</TableHead>
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
                      <TableCell>
                         <Badge 
                          variant="secondary" 
                          className="text-[10px] bg-slate-100 text-slate-600 border-slate-200"
                        >
                          {d.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {d.categoryPath?.join(" › ") ?? d.category ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{d.owners?.techOwner || "DE"}</TableCell>
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
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-700 font-mono">
                {dimension.type}
              </Badge>
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
                    <span className="text-slate-500">Business owner</span>
                    <p className="font-medium text-slate-900">{dimension.owners?.businessOwner || "PM"}</p>
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
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <span className="text-slate-500">Tech owner</span>
                    <p className="font-medium text-slate-900">{dimension.owners?.techOwner || "DE"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Type</span>
                    <p className="font-mono text-slate-900">{dimension.type}</p>
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* Source Info */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-slate-500">Source Table</span>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate">
                        {dimension.sourceLink || "Not configured"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Source Field</span>
                    <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      {dimension.sourceDimensionField || "Not configured"}
                    </p>
                  </div>
                </div>
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
