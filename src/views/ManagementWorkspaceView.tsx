
import { useEffect, useMemo, useState } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryTreeSelect } from "@/components/CategoryTreeSelect"
import { Home, Layers, FolderKanban, LineChart as LineChartIcon, PlusCircle, Hash, Type, Calendar, Braces, Trash2, Eye } from "lucide-react"

import {
  Metric,
  Dimension,
  CategoryNode,
  NewMetricPayload,
  Album,
  MetricStatus,
} from "@/types"
import { MetricRegistrationView } from "@/views/MetricRegistrationView"

export type ManagementSection = "metric" | "dimension" | "business_module" | "category" | "workspace"

export interface ManagementWorkspaceViewProps {
  activeSection: ManagementSection
  onChangeSection: (section: ManagementSection) => void
  metrics: Metric[]
  metricSets: Album[]
  setMetricSets: (sets: Album[]) => void
  dimensions: Dimension[]
  categories: CategoryNode[]
  onOpenMetricProfile: (fieldName: string) => void
  onRegisterMetric: (payload: NewMetricPayload) => void
  onUpdateMetric: (fieldName: string, payload: NewMetricPayload) => void
  onUpdateMetricStatus: (fieldName: string, status: MetricStatus) => void
  onDeleteMetric: (fieldName: string) => void
  onCreateCategory: (payload: { id: string; name: string; description: string; parentId?: string }) => void
  onUpdateCategory: (payload: { id: string; semanticView?: { name: string; hiveTables: string[] }; name?: string; description?: string }) => void
  onDeleteCategory?: (id: string) => void
  onNavigateWorkspace: () => void
  onCreateDimension: (payload: {
    fieldName: string
    businessName: string
    owner: string
    technicalDefinition: string
    description: string
    category: string
    categoryPath: string[]
    sourceLink: string
    sourceDimensionField: string
    values: { code: string; label: string }[]
  }) => void
  onUpdateDimension: (payload: {
    id: string
    businessName: string
    owner: string
    technicalDefinition: string
    description: string
    category: string
    categoryPath: string[]
    sourceLink: string
    sourceDimensionField: string
    values: { code: string; label: string }[]
  }) => void
  onDeleteDimension: (id: string) => void
}

export function ManagementWorkspaceView({
  activeSection,
  onChangeSection,
  metrics,
  metricSets,
  setMetricSets,
  dimensions,
  categories,
  onOpenMetricProfile,
  onRegisterMetric,
  onUpdateMetric,
  onUpdateMetricStatus,
  onDeleteMetric,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onNavigateWorkspace,
  onCreateDimension,
  onUpdateDimension,
  onDeleteDimension,
}: ManagementWorkspaceViewProps) {
  const [isNewMetricSheetOpen, setIsNewMetricSheetOpen] = useState(false)
  const [isNewDimensionSheetOpen, setIsNewDimensionSheetOpen] = useState(false)
  const [metricSheetMode, setMetricSheetMode] = useState<"create" | "edit">("create")
  const [metricToEdit, setMetricToEdit] = useState<Metric | null>(null)
  const [dimensionSheetMode, setDimensionSheetMode] = useState<"create" | "edit">("create")
  const [dimensionToEdit, setDimensionToEdit] = useState<Dimension | null>(null)
  const [isSemanticViewPreviewOpen, setIsSemanticViewPreviewOpen] = useState(false)
  const [semanticViewPreview, setSemanticViewPreview] = useState<{
    name: string
    tables: string[]
    categoryName: string
  } | null>(null)
  const [isSemanticViewDialogOpen, setIsSemanticViewDialogOpen] = useState(false)
  const [semanticViewCategory, setSemanticViewCategory] = useState<CategoryNode | null>(null)
  const [semanticViewName, setSemanticViewName] = useState("")
  const [semanticViewTables, setSemanticViewTables] = useState<string[]>([])

  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false)
  const [categorySheetMode, setCategorySheetMode] = useState<"create" | "edit">("create")
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryNode | null>(null)
  const [isEditingSubCategory, setIsEditingSubCategory] = useState(false)
  const [parentCategoryForCreate, setParentCategoryForCreate] = useState<CategoryNode | null>(null)

  const renderSectionContent = () => {
    switch (activeSection) {
      case "metric":
        return (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-slate-50 border-slate-100 bg-slate-50/50">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-4">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Field Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Module</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Owners</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated at</TableHead>
                    <TableHead className="w-[1%] text-xs text-right font-semibold text-slate-500 uppercase tracking-wider pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((m) => (
                    <TableRow key={m.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors group">
                      <TableCell className="text-sm font-medium text-slate-900 pl-4">{m.businessName}</TableCell>
                      <TableCell className="font-mono text-[11px] text-slate-500">{m.fieldName}</TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {m.categoryPath?.length ? m.categoryPath.join(" › ") : "Uncategorized"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Select
                          value={m.status}
                          onValueChange={(value) => onUpdateMetricStatus(m.fieldName, value as MetricStatus)}
                        >
                          <SelectTrigger className={`h-7 text-[10px] border-none shadow-none px-2 w-auto min-w-[80px] ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="text-slate-900">{m.owner}</span>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-500">{formatDate(m.updatedAt)}</TableCell>
                      <TableCell className="text-xs pr-4">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => onOpenMetricProfile(m.fieldName)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setMetricSheetMode("edit")
                              setMetricToEdit(m)
                              setIsNewMetricSheetOpen(true)
                            }}
                          >
                            <Type className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onDeleteMetric(m.fieldName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {metrics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                        No metrics in the registry yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case "dimension":
        return (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-slate-50 border-slate-100 bg-slate-50/50">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-4">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Field Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Owners</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated at</TableHead>
                    <TableHead className="w-[1%] text-xs text-right font-semibold text-slate-500 uppercase tracking-wider pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dimensions.map((d) => (
                    <TableRow key={d.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors group">
                      <TableCell className="text-sm font-medium text-slate-900 pl-4">{d.name}</TableCell>
                      <TableCell className="font-mono text-[11px] text-slate-500">{d.fieldName}</TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {d.categoryPath?.[0] ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {d.categoryPath?.length && d.categoryPath.length > 1 ? d.categoryPath.slice(1).join(" › ") : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-600">
                          {d.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.owner ? (
                          <span className="text-slate-900">{d.owner}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-500">{formatDate(d.updatedAt)}</TableCell>
                      <TableCell className="text-xs pr-4">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setDimensionSheetMode("edit")
                              setDimensionToEdit(d)
                              setIsNewDimensionSheetOpen(true)
                            }}
                          >
                            <Type className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onDeleteDimension(d.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {dimensions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                        No dimensions in the registry yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case "workspace":
        return (
          <div className="space-y-4">
             <p>Workspace content here</p>
          </div>
        )
      case "business_module":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-slate-50 border-slate-100 bg-slate-50/50">
                    <TableHead className="w-[40%] pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                    <TableHead className="w-[30%] text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</TableHead>
                    <TableHead className="w-[20%] text-xs font-semibold text-slate-500 uppercase tracking-wider">Semantic View</TableHead>
                    <TableHead className="w-[10%] pr-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <BusinessModuleRow
                      key={category.id}
                      category={category}
                      onEdit={(cat) => {
                        setCategorySheetMode("edit")
                        setCategoryToEdit(cat)
                        setIsEditingSubCategory(false)
                        setIsCategorySheetOpen(true)
                      }}
                      onDelete={(id) => onDeleteCategory?.(id)}
                      onViewSemanticView={(cat) => {
                        setSemanticViewPreview({
                          name: cat.semanticView?.name ?? `${cat.name}_semantic_view`,
                          tables: cat.semanticView?.hiveTables ?? [],
                          categoryName: cat.name,
                        })
                        setIsSemanticViewPreviewOpen(true)
                      }}
                    />
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-xs text-slate-400 italic">
                        No business modules found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      case "category":
        // Flatten Level 2 categories
        const subCategories = categories.flatMap(c => c.children?.map(child => ({...child, parentName: c.name, parentId: c.id})) || [])
        
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-slate-50 border-slate-100 bg-slate-50/50">
                    <TableHead className="w-[30%] pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                    <TableHead className="w-[20%] text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Module</TableHead>
                    <TableHead className="w-[30%] text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</TableHead>
                    <TableHead className="w-[10%] text-xs font-semibold text-slate-500 uppercase tracking-wider">Subcategories</TableHead>
                    <TableHead className="w-[10%] pr-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subCategories.map((category) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      level={0}
                      parentName={(category as any).parentName}
                      onEdit={(cat, isSub) => {
                        setCategorySheetMode("edit")
                        setCategoryToEdit(cat)
                        setIsEditingSubCategory(true) // Level 2/3 are considered subcategories in the sheet logic
                        setIsCategorySheetOpen(true)
                      }}
                      onCreateSub={(parent) => {
                        setCategorySheetMode("create")
                        setParentCategoryForCreate(parent)
                        setIsCategorySheetOpen(true)
                      }}
                      onDelete={(id) => onDeleteCategory?.(id)}
                      onViewSemanticView={() => {}}
                    />
                  ))}
                  {subCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-xs text-slate-400 italic">
                        No categories found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const getSectionHeader = () => {
    switch (activeSection) {
      case "metric":
        return {
          title: "Metric management",
          description: "Search existing metrics and register new ones.",
          addLabel: "New metric",
        }
      case "dimension":
        return {
          title: "Dimension management",
          description: "Manage dimension terms, values dictionary and bindings.",
          addLabel: "New dimension",
        }
      case "business_module":
        return {
          title: "Business Modules",
          description: "Manage top-level business domains and their semantic views.",
          addLabel: "New Module",
        }
      case "category":
        return {
          title: "Category Management",
          description: "Manage hierarchical categories for metrics and dimensions.",
          addLabel: "New Category",
        }
      default:
        return {
          title: "Management",
          description: "Administer metrics, dimensions, and datasources.",
          addLabel: "New",
        }
    }
  }

  const handleAddClick = () => {
    if (activeSection === "metric") {
      setMetricSheetMode("create")
      setMetricToEdit(null)
      setIsNewMetricSheetOpen(true)
    } else if (activeSection === "dimension") {
      setDimensionSheetMode("create")
      setDimensionToEdit(null)
      setIsNewDimensionSheetOpen(true)
    } else if (activeSection === "business_module") {
      setCategorySheetMode("create")
      setCategoryToEdit(null)
      setParentCategoryForCreate(null)
      setIsCategorySheetOpen(true)
    } else if (activeSection === "category") {
      setCategorySheetMode("create")
      setCategoryToEdit(null)
      setParentCategoryForCreate(null)
      setIsCategorySheetOpen(true)
    }
  }

  const header = getSectionHeader()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="border-slate-200 shadow-sm rounded-2xl h-fit">
          <CardContent className="space-y-1 p-3">
            <SidebarItem
              icon={LineChartIcon}
              label="Metrics"
              active={activeSection === "metric"}
              onClick={() => onChangeSection("metric")}
            />
            <SidebarItem
              icon={Layers}
              label="Dimensions"
              active={activeSection === "dimension"}
              onClick={() => onChangeSection("dimension")}
            />
            <SidebarItem
              icon={FolderKanban}
              label="Business Modules"
              active={activeSection === "business_module"}
              onClick={() => onChangeSection("business_module")}
            />
            <SidebarItem
              icon={Layers}
              label="Categories"
              active={activeSection === "category"}
              onClick={() => onChangeSection("category")}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-col gap-4 pb-4 border-b border-slate-100 bg-slate-50/40 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">{header.title}</CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-1">{header.description}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="inline-flex items-center gap-2 rounded-full h-9 px-4 text-xs font-medium bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md transition-all"
                onClick={handleAddClick}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>{header.addLabel}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">{renderSectionContent() as React.ReactNode}</CardContent>
        </Card>
      </div>

      <Dialog open={isSemanticViewPreviewOpen} onOpenChange={setIsSemanticViewPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {semanticViewPreview ? `${semanticViewPreview.categoryName} Semantic View` : "Semantic View"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Semantic View Name</p>
              <p className="text-sm font-semibold text-slate-900">{semanticViewPreview?.name ?? "-"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">CDM Topology</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-center gap-3">
                  {(semanticViewPreview?.tables ?? []).map((table, index, list) => (
                    <div key={`${table}-${index}`} className="flex flex-col items-center gap-2">
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm">
                        {table}
                      </div>
                      {index < list.length - 1 && (
                        <div className="flex flex-col items-center gap-1 text-slate-300">
                          <div className="h-4 w-px bg-slate-300"></div>
                          <span className="text-[10px]">▼</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {!semanticViewPreview?.tables?.length && (
                    <span className="text-slate-400 text-[11px]">No CDM tables</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsSemanticViewPreviewOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSemanticViewDialogOpen} onOpenChange={setIsSemanticViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {semanticViewCategory ? `${semanticViewCategory.name} Semantic View` : "Semantic View"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Semantic View Name</label>
              <Input
                className="h-8 text-xs"
                value={semanticViewName}
                onChange={(e) => setSemanticViewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">Hive CDM Tables</label>
              <div className="space-y-2">
                {semanticViewTables.map((table, index) => (
                  <div key={`${table}-${index}`} className="flex items-center gap-2">
                    <Input
                      className="h-8 text-xs"
                      value={table}
                      onChange={(e) => {
                        const next = [...semanticViewTables]
                        next[index] = e.target.value
                        setSemanticViewTables(next)
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => {
                        const next = semanticViewTables.filter((_, i) => i !== index)
                        setSemanticViewTables(next)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setSemanticViewTables([...semanticViewTables, "dwd_"])}
                >
                  + Add table
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsSemanticViewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  if (!semanticViewCategory) return
                  const cleaned = semanticViewTables.map((t) => t.trim()).filter(Boolean)
                  onUpdateCategory({
                    id: semanticViewCategory.id,
                    semanticView: {
                      name: semanticViewName.trim() || `${semanticViewCategory.name}_semantic_view`,
                      hiveTables: cleaned,
                    },
                  })
                  setIsSemanticViewDialogOpen(false)
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NewMetricSheet
        open={isNewMetricSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMetricToEdit(null)
            setMetricSheetMode("create")
          }
          setIsNewMetricSheetOpen(open)
        }}
        dimensions={dimensions}
        metrics={metrics}
        categories={categories}
        onRegisterMetric={onRegisterMetric}
        initialMetric={metricToEdit}
        mode={metricSheetMode}
        onUpdateMetric={onUpdateMetric}
        enableImportOption
      />

      <NewDimensionSheet
        open={isNewDimensionSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDimensionToEdit(null)
            setDimensionSheetMode("create")
          }
          setIsNewDimensionSheetOpen(open)
        }}
        categories={categories}
        onCreateDimension={onCreateDimension}
        initialDimension={dimensionToEdit}
        mode={dimensionSheetMode}
        onUpdateDimension={onUpdateDimension}
      />
      <NewCategorySheet
        open={isCategorySheetOpen}
        onOpenChange={setIsCategorySheetOpen}
        mode={categorySheetMode}
        initialCategory={categoryToEdit}
        parentCategory={parentCategoryForCreate}
        isSubCategory={isEditingSubCategory || activeSection === "category"}
        businessModules={categories} // Pass all Level 1 as options
        onCreateCategory={(payload) => {
          if (parentCategoryForCreate) {
            onCreateCategory({ ...payload, parentId: parentCategoryForCreate.id })
          } else if (payload.parentId) {
             // Handle selection from dropdown
             onCreateCategory({ ...payload })
          } else {
            onCreateCategory(payload)
          }
          setIsCategorySheetOpen(false)
        }}
        onUpdateCategory={(payload) => {
          onUpdateCategory(payload)
          setIsCategorySheetOpen(false)
        }}
      />
    </div>
  )
}

interface NewCategorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialCategory?: CategoryNode | null
  parentCategory?: CategoryNode | null
  isSubCategory?: boolean
  businessModules?: CategoryNode[]
  onCreateCategory: (payload: { id: string; name: string; description: string; semanticView?: { name: string; hiveTables: string[] }; parentId?: string }) => void
  onUpdateCategory: (payload: { id: string; name: string; description: string; semanticView?: { name: string; hiveTables: string[] } }) => void
}

function NewCategorySheet({
  open,
  onOpenChange,
  mode,
  initialCategory,
  parentCategory,
  isSubCategory = false,
  businessModules,
  onCreateCategory,
  onUpdateCategory,
}: NewCategorySheetProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [semanticViewName, setSemanticViewName] = useState("")
  const [semanticViewTables, setSemanticViewTables] = useState<string[]>([])
  const [selectedBusinessModule, setSelectedBusinessModule] = useState<string>("")

  // Only top-level categories can have semantic view configuration
  // If we are creating a sub-category (parentCategory exists) or editing a sub-category (isSubCategory is true), hide it.
  // Also hide if we are creating a "Category" (Level 2) which requires a parent module.
  const showSemanticViewConfig = !parentCategory && !isSubCategory && !businessModules
  const showParentSelector = !parentCategory && mode === "create" && !!businessModules

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialCategory) {
        setName(initialCategory.name)
        setDescription(initialCategory.description || "")
        setSemanticViewName(initialCategory.semanticView?.name || "")
        setSemanticViewTables(initialCategory.semanticView?.hiveTables || [])
        // If editing, we don't change parent
      } else {
        setName("")
        setDescription("")
        setSemanticViewName("")
        setSemanticViewTables([])
        setSelectedBusinessModule("")
      }
    }
  }, [open, mode, initialCategory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (showParentSelector && !selectedBusinessModule) {
      // Should show validation error, but for now just return
      return
    }

    let semanticView = undefined
    if (showSemanticViewConfig) {
      semanticView = {
        name: semanticViewName.trim() || (name.trim() ? `${name.trim()}_semantic_view` : ""),
        hiveTables: semanticViewTables.map(t => t.trim()).filter(Boolean),
      }
    }

    if (mode === "edit" && initialCategory) {
      onUpdateCategory({
        id: initialCategory.id,
        name: name.trim(),
        description: description.trim(),
        semanticView,
      })
    } else {
      onCreateCategory({
        id: `cat-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        semanticView,
        parentId: selectedBusinessModule || undefined,
      })
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b bg-slate-50/50">
            <SheetTitle className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Edit Category" : parentCategory ? `New Subcategory under ${parentCategory.name}` : "New Category"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {showParentSelector && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700">Business Module</label>
                    <Select value={selectedBusinessModule} onValueChange={setSelectedBusinessModule} required>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select Business Module" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessModules?.map((bm) => (
                          <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. User Growth"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this category..."
                    className="min-h-[100px] text-xs resize-none"
                  />
                </div>
              </div>

              {showSemanticViewConfig && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Semantic View Configuration</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700">View Name</label>
                    <Input
                      value={semanticViewName}
                      onChange={(e) => setSemanticViewName(e.target.value)}
                      placeholder="Optional view name"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700">Hive CDM Tables</label>
                    <div className="space-y-2">
                      {semanticViewTables.map((table, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={table}
                            onChange={(e) => {
                              const next = [...semanticViewTables]
                              next[index] = e.target.value
                              setSemanticViewTables(next)
                            }}
                            className="h-8 text-xs"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const next = semanticViewTables.filter((_, i) => i !== index)
                              setSemanticViewTables(next)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs border-dashed"
                        onClick={() => setSemanticViewTables([...semanticViewTables, ""])}
                      >
                        <PlusCircle className="mr-2 h-3.5 w-3.5" />
                        Add Table
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-6 border-t bg-slate-50/50 flex justify-end gap-3 absolute bottom-0 left-0 right-0">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {mode === "edit" ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function formatDate(value?: string): string {
  if (!value) return "-"
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return value
  return new Date(timestamp).toISOString().slice(0, 10)
}

interface SidebarItemProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

interface BusinessModuleRowProps {
  category: CategoryNode
  onEdit: (cat: CategoryNode) => void
  onDelete: (id: string) => void
  onViewSemanticView: (cat: CategoryNode) => void
}

function BusinessModuleRow({ category, onEdit, onDelete, onViewSemanticView }: BusinessModuleRowProps) {
  return (
    <TableRow className="hover:bg-slate-50/50 border-slate-100 transition-colors group">
      <TableCell className="py-3 pl-6">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-900">{category.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
        {category.description || "-"}
      </TableCell>
      <TableCell className="text-xs">
        {category.semanticView ? (
           <div className="flex items-center gap-1.5">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
             <span className="text-slate-700 font-medium">{category.semanticView.name}</span>
             <span className="text-slate-400">({category.semanticView.hiveTables.length} tables)</span>
           </div>
        ) : (
           <span className="text-slate-400 italic">-</span>
        )}
      </TableCell>
      <TableCell className="pr-6 text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onViewSemanticView(category)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(category)}>
            <Type className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" onClick={() => onDelete(category.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

interface CategoryRowProps {
  category: CategoryNode
  level: number
  parentName?: string
  onEdit: (cat: CategoryNode, isSub: boolean) => void
  onCreateSub: (parent: CategoryNode) => void
  onDelete: (id: string) => void
  onViewSemanticView: (cat: CategoryNode) => void
}

function CategoryRow({ category, level, parentName, onEdit, onCreateSub, onDelete, onViewSemanticView }: CategoryRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = category.children && category.children.length > 0

  return (
    <>
      <TableRow className="hover:bg-slate-50/50 border-slate-100 transition-colors group">
        <TableCell className="py-2.5">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-slate-200 text-slate-500"
              >
                {expanded ? <span className="text-[10px]">▼</span> : <span className="text-[10px]">▶</span>}
              </button>
            ) : (
              <div className="w-5" />
            )}
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-blue-500/70" />
              <span className="text-sm font-medium text-slate-900">{category.name}</span>
            </div>
          </div>
        </TableCell>
        {parentName && (
          <TableCell className="text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
              {parentName}
            </div>
          </TableCell>
        )}
        <TableCell className="text-xs text-slate-500 max-w-[200px] truncate" title={category.description}>
          {category.description || "-"}
        </TableCell>
        <TableCell className="text-xs">
          {category.semanticView ? (
             <div className="flex items-center gap-1.5">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
               <span className="text-slate-700 font-medium">{category.semanticView.name}</span>
               <span className="text-slate-400">({category.semanticView.hiveTables.length} tables)</span>
             </div>
          ) : (
             <span className="text-slate-400 italic">-</span>
          )}
        </TableCell>
        <TableCell className="text-xs text-slate-500">
          {hasChildren ? (
            <Badge variant="secondary" className="text-[10px] font-normal bg-slate-100 text-slate-600 hover:bg-slate-200">
              {category.children!.length} subcategories
            </Badge>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {level === 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                title="View CDM Topology"
                onClick={() => onViewSemanticView(category)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
              title="Add Subcategory"
              onClick={() => onCreateSub(category)}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
              title="Edit"
              onClick={() => onEdit(category, level > 0)}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
              title="Delete"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && hasChildren && category.children!.map((child) => (
        <CategoryRow
          key={child.id}
          category={child}
          level={level + 1}
          onEdit={onEdit}
          onCreateSub={onCreateSub}
          onDelete={onDelete}
          onViewSemanticView={onViewSemanticView}
        />
      ))}
    </>
  )
}

function SidebarItem({ icon: Icon, label, active, disabled, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
          : disabled
            ? "cursor-not-allowed text-slate-300"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`} />
      <span>{label}</span>
    </button>
  )
}

interface NewMetricSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dimensions: Dimension[]
  metrics: Metric[]
  categories: CategoryNode[]
  onRegisterMetric: (payload: NewMetricPayload) => void
  initialMetric?: Metric | null
  mode?: "create" | "edit"
  onUpdateMetric?: (fieldName: string, payload: NewMetricPayload) => void
  enableImportOption?: boolean
}

export function NewMetricSheet({
  open,
  onOpenChange,
  dimensions,
  metrics,
  categories,
  onRegisterMetric,
  initialMetric,
  mode = "create",
  onUpdateMetric,
  enableImportOption = false,
}: NewMetricSheetProps) {
  const isEditMode = mode === "edit" && initialMetric && onUpdateMetric
  const [createMode, setCreateMode] = useState<"manual" | "lark">("manual")

  useEffect(() => {
    if (!open) return
    setCreateMode("manual")
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b bg-slate-50/50">
            <SheetTitle className="text-lg font-semibold text-slate-900">
              {isEditMode ? "Edit Metric" : "Register New Metric"}
            </SheetTitle>
            <div className="text-sm text-slate-500">
              Define the business logic and technical implementation for a metric.
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {enableImportOption && !isEditMode && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Create Mode</span>
                <Select value={createMode} onValueChange={(value: "manual" | "lark") => setCreateMode(value)}>
                  <SelectTrigger className="h-8 text-xs w-[220px] bg-white">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual entry</SelectItem>
                    <SelectItem value="lark">Import from LarkSheet (batch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <MetricRegistrationView
              key={isEditMode && initialMetric ? initialMetric.id : "new"}
              dimensions={dimensions}
              metrics={metrics}
              categories={categories}
              initialMetric={isEditMode ? initialMetric ?? undefined : undefined}
              disableFieldNameEditing={Boolean(isEditMode)}
              showLarkImport={enableImportOption && !isEditMode && createMode === "lark"}
              onRegisterMetric={(payload) => {
                if (isEditMode && initialMetric && onUpdateMetric) {
                  onUpdateMetric(initialMetric.fieldName, payload)
                } else {
                  onRegisterMetric(payload)
                }
                onOpenChange(false)
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface NewDimensionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateDimension: (payload: {
    fieldName: string
    businessName: string
    owner: string
    technicalDefinition: string
    category: string
    categoryPath: string[]
    description: string
    sourceLink: string
    sourceDimensionField: string
    values: { code: string; label: string }[]
  }) => void
  categories: CategoryNode[]
  initialDimension?: Dimension | null
  mode?: "create" | "edit"
  onUpdateDimension?: (payload: {
    id: string
    businessName: string
    owner: string
    technicalDefinition: string
    category: string
    categoryPath: string[]
    description: string
    sourceLink: string
    sourceDimensionField: string
    values: { code: string; label: string }[]
  }) => void
}

export function NewDimensionSheet({
  open,
  onOpenChange,
  onCreateDimension,
  categories,
  initialDimension,
  mode = "create",
  onUpdateDimension,
}: NewDimensionSheetProps) {
  const [fieldName, setFieldName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [owner, setOwner] = useState("admin")
  const [technicalDefinition, setTechnicalDefinition] = useState("")
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [sourceLink, setSourceLink] = useState("")
  const [sourceDimensionField, setSourceDimensionField] = useState("")
  const [enumValues, setEnumValues] = useState<{ code: string; label: string }[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const isEditMode = mode === "edit" && initialDimension && onUpdateDimension

  useEffect(() => {
    if (!open) return

    if (isEditMode && initialDimension) {
      setFieldName(initialDimension.fieldName)
      setBusinessName(initialDimension.name)
      setOwner(initialDimension.owner ?? "")
      setTechnicalDefinition(initialDimension.technicalDefinition ?? "")
      setSelectedCategoryPath(
        initialDimension.categoryPath ??
          (initialDimension.category ? [initialDimension.category] : [])
      )
      setDescription(initialDimension.description)
      setSourceLink(initialDimension.sourceLink ?? "")
      setSourceDimensionField(initialDimension.sourceDimensionField ?? "")
      setEnumValues(initialDimension.values ?? [])
    } else {
      setFieldName("")
      setBusinessName("")
      setOwner("admin")
      setTechnicalDefinition("")
      setSelectedCategoryPath([])
      setDescription("")
      setSourceLink("")
      setSourceDimensionField("")
      setEnumValues([])
    }
    setMessage(null)
  }, [open, isEditMode, initialDimension])

  const availableTopCategories = categories

  useEffect(() => {
    if (!selectedCategoryPath.length) return
    const exists = availableTopCategories.some((c) => c.name === selectedCategoryPath[0])
    if (!exists) {
      setSelectedCategoryPath([])
    }
  }, [availableTopCategories, selectedCategoryPath])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedFieldName = fieldName.trim()
    const trimmedBusinessName = businessName.trim()
    const trimmedDescription = description.trim()
    const trimmedTechnicalDefinition = technicalDefinition.trim()
    const trimmedCategoryPath = selectedCategoryPath.filter(Boolean)
    if (
      !trimmedBusinessName ||
      !trimmedDescription ||
      (!isEditMode && !trimmedFieldName) ||
      trimmedCategoryPath.length === 0 ||
      !trimmedTechnicalDefinition ||
      !owner.trim()
    ) {
      setMessage("Business name, definition, owner, field name, expression, and category are required.")
      return
    }

    if (isEditMode && onUpdateDimension && initialDimension) {
      onUpdateDimension({
        id: initialDimension.id,
        businessName: trimmedBusinessName,
        owner: owner.trim(),
        technicalDefinition: trimmedTechnicalDefinition,
        category: trimmedCategoryPath.join(" / "),
        categoryPath: trimmedCategoryPath,
        description: trimmedDescription,
        sourceLink: sourceLink.trim(),
        sourceDimensionField: sourceDimensionField.trim(),
        values: enumValues,
      })
    } else {
      onCreateDimension({
        fieldName: trimmedFieldName,
        businessName: trimmedBusinessName,
        owner: owner.trim(),
        technicalDefinition: trimmedTechnicalDefinition,
        category: trimmedCategoryPath.join(" / "),
        categoryPath: trimmedCategoryPath,
        description: trimmedDescription,
        sourceLink: sourceLink.trim(),
        sourceDimensionField: sourceDimensionField.trim(),
        values: enumValues,
      })
    }
    setMessage(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b bg-slate-50/50">
            <SheetTitle className="text-lg font-semibold text-slate-900">
              {isEditMode ? "Edit Dimension" : "Create New Dimension"}
            </SheetTitle>
            <div className="text-sm text-slate-500">
              Define a dimension to slice and dice your metrics.
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form id="dimension-form" className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Category</p>
                  <p className="text-xs text-slate-500 mt-1">Choose category for this dimension.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500">Category</label>
                    <CategoryTreeSelect
                      categories={availableTopCategories}
                      value={selectedCategoryPath}
                      onChange={setSelectedCategoryPath}
                      placeholder="Select Category"
                    />
                  </div>
                </div>
              </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-900">Physical Info</p>
                <p className="text-xs text-slate-500 mt-1">Map to physical Hive table and field (Optional).</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Hive Table</label>
                  <Input
                    className="h-9 text-xs font-mono"
                    value={sourceLink}
                    onChange={(e) => setSourceLink(e.target.value)}
                    placeholder="db.table_name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Hive Field</label>
                  <Input
                    className="h-9 text-xs font-mono"
                    value={sourceDimensionField}
                    onChange={(e) => setSourceDimensionField(e.target.value)}
                    placeholder="field_name"
                  />
                </div>
              </div>
            </div>

              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Business definition</p>
                  <p className="text-xs text-slate-500 mt-1">Define the dimension in business terms.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Business Name</label>
                    <Input
                      className="h-9 text-xs"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Agency Tier"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Field name</label>
                    <Input
                      className="h-9 text-xs font-mono"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      placeholder="e.g. agency_tier"
                      disabled={Boolean(isEditMode)}
                    />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Owner</label>
                    <Input
                      className="h-9 text-xs"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder="Owner name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Business definition</label>
                  <Textarea
                    rows={3}
                    className="text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 min-h-[80px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of this dimension term."
                  />
                </div>
              </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-900">Technical definition</p>
                <p className="text-xs text-slate-500 mt-1">Define the expression or derivation logic.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Expression (SQL)</label>
                <Textarea
                  rows={4}
                  className="text-xs font-mono bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 min-h-[100px]"
                  value={technicalDefinition}
                  onChange={(e) => setTechnicalDefinition(e.target.value)}
                  placeholder="e.g. CASE WHEN agency_level = '1' THEN 'Top' ELSE 'Standard' END"
                />
              </div>
            </div>

              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Enum definition</p>
                  <p className="text-xs text-slate-500 mt-1">Manage enumerated values for this dimension.</p>
                </div>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-200">
                        <TableHead className="h-8 text-[10px] font-semibold text-slate-500 w-[120px]">Value Code</TableHead>
                        <TableHead className="h-8 text-[10px] font-semibold text-slate-500">Value Label</TableHead>
                        <TableHead className="h-8 text-[10px] font-semibold text-slate-500 w-[60px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enumValues.map((value, index) => (
                        <TableRow key={index} className="hover:bg-slate-50/50 border-slate-100">
                          <TableCell className="p-2">
                            <Input
                              className="h-7 text-xs font-mono border-slate-200 focus:border-blue-300"
                              placeholder="Code"
                              value={value.code}
                              onChange={(e) => {
                                const next = [...enumValues]
                                next[index] = { ...next[index], code: e.target.value }
                                setEnumValues(next)
                              }}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              className="h-7 text-xs border-slate-200 focus:border-blue-300"
                              placeholder="Label"
                              value={value.label}
                              onChange={(e) => {
                                const next = [...enumValues]
                                next[index] = { ...next[index], label: e.target.value }
                                setEnumValues(next)
                              }}
                            />
                          </TableCell>
                          <TableCell className="p-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setEnumValues(enumValues.filter((_, i) => i !== index))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {enumValues.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="py-4 text-center text-[10px] text-slate-400 italic">
                            No enum values defined.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                  onClick={() => setEnumValues([...enumValues, { code: "", label: "" }])}
                >
                  <PlusCircle className="mr-2 h-3.5 w-3.5" />
                  Add Value
                </Button>
              </div>

            </form>
          </div>

          <div className="p-6 border-t bg-white flex items-center justify-between">
            {message ? (
              <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-full">{message}</p>
            ) : (
              <div></div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" form="dimension-form" className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-100">
                {isEditMode ? "Save Changes" : "Create Dimension"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

