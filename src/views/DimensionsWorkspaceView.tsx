import { useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DimensionTreeNode, Dimension } from "@/types"
import { Folder, Tag, Plus, ArrowLeft, Search, Layers, Flame, FileText, Share2, ArrowRight, History } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export interface DimensionsWorkspaceViewProps {
  dimensionTree: DimensionTreeNode[]
  dimensions: Dimension[]
}

export function DimensionsWorkspaceView({ dimensionTree, dimensions }: DimensionsWorkspaceViewProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)

  // -- Data Processing for Grid View --
  const categories = useMemo(() => {
    return dimensionTree.map(node => {
      // Calculate total fields (dimensions) in this category recursively
      const countFields = (n: DimensionTreeNode): number => {
        let count = n.dimensionSlugs?.length ?? 0
        if (n.children) {
          count += n.children.reduce((acc, child) => acc + countFields(child), 0)
        }
        return count
      }
      
      const totalFields = countFields(node)
      
      // Determine badge/tag based on name or other logic
      let badge = "Business"
      let badgeColor = "bg-purple-50 text-purple-700 border-purple-100"
      
      const lower = node.name.toLowerCase()
      if (lower.includes("user") || lower.includes("core")) {
        badge = "Core"
        badgeColor = "bg-blue-50 text-blue-700 border-blue-100"
      } else if (lower.includes("finance") || lower.includes("pay")) {
        badge = "Financial"
        badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100"
      } else if (lower.includes("meta") || lower.includes("system")) {
        badge = "System"
        badgeColor = "bg-slate-100 text-slate-700 border-slate-200"
      } else if (lower.includes("analytic")) {
        badge = "Reporting"
        badgeColor = "bg-orange-50 text-orange-700 border-orange-100"
      }

      return {
        ...node,
        totalFields,
        badge,
        badgeColor,
        description: getDescriptionForCategory(node.name)
      }
    })
  }, [dimensionTree])

  // -- Data Processing for Detail View --
  const activeNode = useMemo(() => {
    if (!activeNodeId) return null
    
    // Find node in tree (recursive)
    const findNode = (nodes: DimensionTreeNode[]): DimensionTreeNode | null => {
      for (const node of nodes) {
        if (node.id === activeNodeId) return node
        if (node.children) {
          const found = findNode(node.children)
          if (found) return found
        }
      }
      return null
    }
    return findNode(dimensionTree)
  }, [dimensionTree, activeNodeId])

  const activeDimensions = useMemo(() => {
    if (!activeNode) return []
    // Gather all dimension slugs from this node and children
    const slugs = new Set<string>()
    const collectSlugs = (n: DimensionTreeNode) => {
      n.dimensionSlugs?.forEach(s => slugs.add(s))
      n.children?.forEach(collectSlugs)
    }
    collectSlugs(activeNode)
    
    return dimensions.filter(d => slugs.has(d.slug))
  }, [activeNode, dimensions])


  const handleDimensionClick = (dim: Dimension) => {
    setSelectedDimension(dim)
    setIsDetailSheetOpen(true)
  }

  // -- Render --

  if (activeNodeId && activeNode) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveNodeId(null)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 hover:border-blue-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{activeNode.name}</h2>
            <p className="text-slate-500">Viewing {activeDimensions.length} fields in this category</p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
             <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
               <Layers className="h-4 w-4" />
               <span>Dimensions List</span>
             </div>
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search fields..." 
                  className="h-9 w-64 rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all"
                />
             </div>
          </div>
          <div className="divide-y divide-slate-100">
            {activeDimensions.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No dimensions found in this category.
              </div>
            ) : (
              activeDimensions.map((dim) => (
                <div 
                  key={dim.id} 
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => handleDimensionClick(dim)}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{dim.name}</span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase tracking-wide">
                        {dim.type}
                      </span>
                    </div>
                    {dim.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{dim.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-400">
                     <span className="text-xs font-medium">{dim.values?.length ?? 0} values</span>
                     <div className="flex gap-1 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                       View details →
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <DimensionDetailSheet 
          open={isDetailSheetOpen} 
          onOpenChange={setIsDetailSheetOpen} 
          dimension={selectedDimension} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dimensions</h2>
          <p className="text-slate-500 mt-1">Organize and categorize your data fields</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all">
          <Plus className="h-4 w-4" />
          Create Dimension
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card 
            key={category.id} 
            className="group relative overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5 hover:border-blue-200 hover:-translate-y-1 cursor-pointer"
            onClick={() => setActiveNodeId(category.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{category.name}</h3>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-1 ${category.badgeColor}`}>
                      {category.badge}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-6 line-clamp-2 h-10 leading-relaxed">
                {category.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-500">
                  <Tag className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{category.totalFields} fields</span>
                </div>
                <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors group-hover:translate-x-1">
                  View Fields
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DimensionDetailSheet 
        open={isDetailSheetOpen} 
        onOpenChange={setIsDetailSheetOpen} 
        dimension={selectedDimension} 
      />
    </div>
  )
}

function getDescriptionForCategory(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes("user")) return "Fields related to user information, profiles, and account settings."
  if (lower.includes("product")) return "Product catalog, inventory status, and SKU details."
  if (lower.includes("order")) return "Order processing, shipping tracking, and fulfillment data."
  if (lower.includes("pay")) return "Payment methods, transaction history, and billing records."
  if (lower.includes("analytic")) return "Key performance indicators, usage metrics, and analytics tracking."
  if (lower.includes("meta")) return "System-level metadata, timestamps, and version control info."
  return "General data fields and dimensions for this category."
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
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
               <SheetTitle className="text-lg font-bold text-slate-900">{dimension.name}</SheetTitle>
               <p className="font-mono text-xs text-slate-500">{dimension.slug}</p>
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-8">
           {/* Basic Info */}
           <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                 <div className="space-y-1">
                   <span className="text-slate-500">Domain</span>
                   <p className="font-medium text-slate-900">{dimension.domain}</p>
                 </div>
                 <div className="space-y-1">
                   <span className="text-slate-500">Type</span>
                   <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-700">
                      {dimension.type}
                   </Badge>
                 </div>
                 <div className="col-span-2 space-y-1">
                   <span className="text-slate-500">Description</span>
                   <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                     {dimension.description || "No description provided."}
                   </p>
                 </div>
              </div>
           </div>

           {/* Stats / Heat */}
           <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Usage & Heat
              </h3>
              <div className="flex items-center gap-4">
                 <div className="flex-1 bg-orange-50 rounded-xl p-4 border border-orange-100 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-orange-600">High</span>
                    <span className="text-[10px] font-medium text-orange-700/70 uppercase tracking-wide mt-1">Usage Heat</span>
                 </div>
                 <div className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-blue-600">{dimension.boundMetricSlugs.length}</span>
                    <span className="text-[10px] font-medium text-blue-700/70 uppercase tracking-wide mt-1">Bound Metrics</span>
                 </div>
              </div>
           </div>

           {/* Lineage / Bound Metrics */}
           <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="h-4 w-4 text-blue-500" />
                Metric Lineage (Bound Metrics)
              </h3>
              {dimension.boundMetricSlugs.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                   <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                     Metrics using this dimension
                   </div>
                   <ul className="divide-y divide-slate-100">
                     {dimension.boundMetricSlugs.map(slug => (
                       <li key={slug} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <span className="text-xs font-medium text-slate-700">{slug}</span>
                          <ArrowRight className="h-3 w-3 text-slate-300" />
                       </li>
                     ))}
                   </ul>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  No metrics are currently bound to this dimension.
                </div>
              )}
           </div>

           {/* History */}
           <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="h-4 w-4 text-purple-500" />
                Version History
              </h3>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden p-4">
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
              </div>
           </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
