
import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DimensionTreeNode, Dimension } from "@/types"
import { Folder, ArrowRight, Tag, Pencil, Trash2, Plus, ArrowLeft, Search, Layers } from "lucide-react"

export interface DimensionsWorkspaceViewProps {
  dimensionTree: DimensionTreeNode[]
  dimensions: Dimension[]
}

export function DimensionsWorkspaceView({ dimensionTree, dimensions }: DimensionsWorkspaceViewProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)

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

  const stats = useMemo(() => {
    const totalDimensions = categories.length
    const totalFields = dimensions.length
    const avgFields = totalDimensions > 0 ? (totalFields / totalDimensions).toFixed(1) : "0"
    return { totalDimensions, totalFields, avgFields }
  }, [categories, dimensions])


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
                <div key={dim.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900 text-sm">{dim.name}</span>
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
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                       <button className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
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

      {/* Statistics Section */}
      <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Dimension Statistics</h3>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex items-center gap-4 border-l-4 border-blue-500 pl-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Dimensions</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{stats.totalDimensions}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Fields</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{stats.totalFields}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l-4 border-purple-500 pl-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Fields per Dimension</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{stats.avgFields}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
