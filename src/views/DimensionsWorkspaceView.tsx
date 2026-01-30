import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DimensionTreeNode, Dimension } from "@/types"
import { Folder, ArrowRight, Tag, Pencil, Trash2, Plus } from "lucide-react"

export interface DimensionsWorkspaceViewProps {
  dimensionTree: DimensionTreeNode[]
  dimensions: Dimension[]
}

export function DimensionsWorkspaceView({ dimensionTree, dimensions }: DimensionsWorkspaceViewProps) {
  // We'll treat the top-level nodes of the dimension tree as the categories to display as cards
  // just like in the "Field Manager" reference image.
  
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
      let badgeColor = "bg-purple-100 text-purple-700"
      
      if (node.name.toLowerCase().includes("user") || node.name.toLowerCase().includes("core")) {
        badge = "Core"
        badgeColor = "bg-blue-100 text-blue-700"
      } else if (node.name.toLowerCase().includes("finance") || node.name.toLowerCase().includes("pay")) {
        badge = "Financial"
        badgeColor = "bg-emerald-100 text-emerald-700"
      } else if (node.name.toLowerCase().includes("meta") || node.name.toLowerCase().includes("system")) {
        badge = "System"
        badgeColor = "bg-zinc-100 text-zinc-700"
      } else if (node.name.toLowerCase().includes("analytic")) {
        badge = "Reporting"
        badgeColor = "bg-orange-100 text-orange-700"
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Dimensions</h2>
          <p className="text-zinc-500 mt-1">Organize and categorize your data fields</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Create Dimension
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="group relative overflow-hidden border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900">{category.name}</h3>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${category.badgeColor}`}>
                      {category.badge}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="p-2 text-zinc-400 hover:text-blue-600 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-zinc-400 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-zinc-500 mb-6 line-clamp-2 h-10">
                {category.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm">{category.totalFields} fields</span>
                </div>
                <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group-hover:translate-x-1">
                  View Fields
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics Section */}
      <Card className="border-zinc-200 bg-white shadow-sm">
        <CardContent className="p-8">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6">Dimension Statistics</h3>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex items-center gap-4 border-l-4 border-blue-500 pl-4">
              <div>
                <div className="text-sm font-medium text-zinc-500">Total Dimensions</div>
                <div className="text-3xl font-bold text-zinc-900 mt-1">{stats.totalDimensions}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-4">
              <div>
                <div className="text-sm font-medium text-zinc-500">Total Fields</div>
                <div className="text-3xl font-bold text-zinc-900 mt-1">{stats.totalFields}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l-4 border-purple-500 pl-4">
              <div>
                <div className="text-sm font-medium text-zinc-500">Avg Fields per Dimension</div>
                <div className="text-3xl font-bold text-zinc-900 mt-1">{stats.avgFields}</div>
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
