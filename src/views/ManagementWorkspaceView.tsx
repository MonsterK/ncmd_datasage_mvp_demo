
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
import { Home, ListTree, Layers, FolderKanban, LineChart as LineChartIcon, PlusCircle, Hash, Search, Type, Calendar, Braces } from "lucide-react"

import {
  Metric,
  Dimension,
  CategoryNode,
  Tenant,
  TenantCategory,
  NewMetricPayload,
  Album,
  Tag,
} from "@/types"
import { MetricRegistrationView } from "@/views/MetricRegistrationView"

export type ManagementSection = "metric" | "dimension" | "datasource"

export interface ManagementWorkspaceViewProps {
  activeSection: ManagementSection
  onChangeSection: (section: ManagementSection) => void
  metrics: Metric[]
  metricSets: Album[]
  setMetricSets: (sets: Album[]) => void
  dimensions: Dimension[]
  categories: CategoryNode[]
  tenants: Tenant[]
  activeTenantId: string | null
  onOpenMetricProfile: (fieldName: string) => void
  onRegisterMetric: (payload: NewMetricPayload) => void
  onUpdateMetric: (fieldName: string, payload: NewMetricPayload) => void
  onDeleteMetric: (fieldName: string) => void
  onCreateTenant?: (payload: {
    id: string
    name: string
    description: string
    categories: {
      name: string
      sourceType: string
      sourceLink: string
    }[]
  }) => void
  onCreateCategory: (payload: { id: string; name: string; description: string }) => void
  onUpdateTenant: (tenant: Tenant) => void
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
  onUpdateDimension: (payload: {
    id: string
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
  onDeleteDimension: (id: string) => void
  tags: Tag[]
  setTags: (tags: Tag[]) => void
}

export function ManagementWorkspaceView({
  activeSection,
  onChangeSection,
  metrics,
  metricSets,
  setMetricSets,
  dimensions,
  categories,
  tenants,
  activeTenantId,
  onOpenMetricProfile,
  onRegisterMetric,
  onUpdateMetric,
  onDeleteMetric,
  onCreateTenant,
  onCreateCategory,
  onUpdateTenant,
  onCreateDimension,
  onUpdateDimension,
  onDeleteDimension,
  tags,
  setTags,
}: ManagementWorkspaceViewProps) {
  const [isNewMetricSheetOpen, setIsNewMetricSheetOpen] = useState(false)
  const [isTenantCategoriesSheetOpen, setIsTenantCategoriesSheetOpen] = useState(false)
  const [tenantForCategories, setTenantForCategories] = useState<Tenant | null>(null)
  const [isNewDimensionSheetOpen, setIsNewDimensionSheetOpen] = useState(false)
  const [metricSheetMode, setMetricSheetMode] = useState<"create" | "edit">("create")
  const [metricToEdit, setMetricToEdit] = useState<Metric | null>(null)
  const [dimensionSheetMode, setDimensionSheetMode] = useState<"create" | "edit">("create")
  const [dimensionToEdit, setDimensionToEdit] = useState<Dimension | null>(null)

  const tagNameById = useMemo(() => {
    const map = new Map<string, string>()
    tags.forEach((tag) => {
      map.set(tag.id, tag.name)
    })
    return map
  }, [tags])

  const onManageTenantCategories = (tenant: Tenant) => {
    setTenantForCategories(tenant)
    setIsTenantCategoriesSheetOpen(true)
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case "metric":
        return (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-slate-50 border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Field Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Owners</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated at</TableHead>
                  <TableHead className="w-[1%] text-xs text-right font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m) => (
                  <TableRow key={m.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                    <TableCell className="text-sm font-medium text-slate-900">{m.businessName}</TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500">{m.fieldName}</TableCell>
                    <TableCell className="text-xs text-slate-700">{m.tenant}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className={`text-[10px] border-slate-200 ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-900">{m.owners.businessOwner}</span>
                        <span className="text-[11px] text-slate-500">{m.owners.techOwner}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-500">{formatDate(m.updatedAt)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-[11px] rounded-full border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:text-blue-600"
                          onClick={() => {
                            setMetricSheetMode("edit")
                            setMetricToEdit(m)
                            setIsNewMetricSheetOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-[11px] rounded-full border-slate-200 text-red-600 shadow-sm hover:bg-red-50 hover:shadow-md hover:border-red-200"
                          onClick={() => onDeleteMetric(m.fieldName)}
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-[11px] rounded-full border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:text-blue-600"
                          onClick={() => onOpenMetricProfile(m.fieldName)}
                        >
                          View
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
        )

      case "dimension":
        return (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-slate-50 border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Field Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bound metric count</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated at</TableHead>
                  <TableHead className="w-[1%] text-xs text-right font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dimensions.map((d) => (
                  <TableRow key={d.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                    <TableCell className="text-sm font-medium text-slate-900">{d.name}</TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500">{d.fieldName}</TableCell>
                    <TableCell className="text-xs text-slate-700">{d.tenant}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-600">
                        {d.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">{d.boundMetricFieldNames.length}</TableCell>
                    <TableCell className="text-[11px] text-slate-500">{formatDate(d.updatedAt)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-[11px] rounded-full border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:text-blue-600"
                          onClick={() => {
                            setDimensionSheetMode("edit")
                            setDimensionToEdit(d)
                            setIsNewDimensionSheetOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-[11px] rounded-full border-slate-200 text-red-600 shadow-sm hover:bg-red-50 hover:shadow-md hover:border-red-200"
                          onClick={() => onDeleteDimension(d.id)}
                        >
                          Delete
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
        )
      case "datasource":
        const activeTenant = tenants.find((t) => t.id === activeTenantId)
        return (
          <div className="space-y-4">
            {activeTenant ? (
              activeTenant.categories && activeTenant.categories.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="grid grid-cols-[minmax(0,1fr)_140px_minmax(0,1.2fr)] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50">
                    <span>Category</span>
                    <span>Source Type</span>
                    <span>Datasource Link</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {activeTenant.categories.map((cat, i) => (
                      <div key={i} className="grid grid-cols-[minmax(0,1fr)_140px_minmax(0,1.2fr)] gap-3 px-4 py-3 text-xs items-center">
                        <div className="font-semibold text-slate-900">{cat.name}</div>
                        <div className="text-slate-600">
                          {cat.dataSource?.type ?? "—"}
                        </div>
                        <div className="text-slate-500">
                          {cat.dataSource ? (
                            <a
                              href={cat.dataSource.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline truncate block max-w-full"
                            >
                              {cat.dataSource.link}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No datasource bound</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No categories defined yet.</p>
              )
            ) : (
              <p className="text-xs text-slate-500">No active tenant selected.</p>
            )}
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
      case "datasource":
        return {
          title: "Datasource management",
          description: "Manage categories and data sources for the current tenant.",
          addLabel: "Manage Categories & Datasources",
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
    } else if (activeSection === "datasource") {
      if (activeTenantId) {
        const tenant = tenants.find(t => t.id === activeTenantId)
        if (tenant) {
          setTenantForCategories(tenant)
          setIsTenantCategoriesSheetOpen(true)
        }
      }
    }
  }

  const header = getSectionHeader()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="border-slate-200 shadow-sm rounded-2xl h-fit">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-sm font-semibold text-slate-900">Areas</CardTitle>
            <CardDescription className="text-xs text-slate-500">Navigation modules</CardDescription>
          </CardHeader>
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
              icon={Home}
              label="Datasources"
              active={activeSection === "datasource"}
              onClick={() => onChangeSection("datasource")}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-col gap-4 pb-4 border-b border-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">{header.title}</CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-1">{header.description}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg transition-all"
                onClick={handleAddClick}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>{header.addLabel}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">{renderSectionContent()}</CardContent>
        </Card>
      </div>

      <NewMetricSheet
        open={isNewMetricSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMetricToEdit(null)
            setMetricSheetMode("create")
          }
          setIsNewMetricSheetOpen(open)
        }}
        tenants={tenants}
        dimensions={dimensions}
        onRegisterMetric={onRegisterMetric}
        defaultTenantId={activeTenantId}
        initialMetric={metricToEdit}
        mode={metricSheetMode}
        onUpdateMetric={onUpdateMetric}
        enableImportOption
      />

      {tenantForCategories && (
        <TenantCategoriesSheet
          open={isTenantCategoriesSheetOpen}
          onOpenChange={(open) => {
            setIsTenantCategoriesSheetOpen(open)
            if (!open) setTenantForCategories(null)
          }}
          tenant={tenantForCategories}
          onUpdateTenant={onUpdateTenant}
        />
      )}

      <NewDimensionSheet
        open={isNewDimensionSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDimensionToEdit(null)
            setDimensionSheetMode("create")
          }
          setIsNewDimensionSheetOpen(open)
        }}
        tenants={tenants}
        defaultTenantId={activeTenantId}
        onCreateDimension={onCreateDimension}
        initialDimension={dimensionToEdit}
        mode={dimensionSheetMode}
        onUpdateDimension={onUpdateDimension}
      />
    </div>
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
  tenants: Tenant[]
  dimensions: Dimension[]
  onRegisterMetric: (payload: NewMetricPayload) => void
  initialMetric?: Metric | null
  mode?: "create" | "edit"
  onUpdateMetric?: (fieldName: string, payload: NewMetricPayload) => void
  enableImportOption?: boolean
  defaultTenantId?: string | null
}

export function NewMetricSheet({
  open,
  onOpenChange,
  tenants,
  dimensions,
  onRegisterMetric,
  initialMetric,
  mode = "create",
  onUpdateMetric,
  enableImportOption = false,
  defaultTenantId,
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
              tenants={tenants}
              dimensions={dimensions}
              defaultTenantId={defaultTenantId}
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

interface NewMetricSetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metrics: Metric[]
  metricSets: Album[]
  onMetricSetsChange: (sets: Album[]) => void
  tenants: Tenant[]
  initialMetricFieldNames?: string[]
  initialTenantId?: string
  initialMetricSet?: Album | null
  mode?: "create" | "edit"
  tags: Tag[]
}

export function NewMetricSetSheet({
  open,
  onOpenChange,
  metrics,
  metricSets,
  onMetricSetsChange,
  tenants,
  initialMetricFieldNames,
  initialTenantId,
  initialMetricSet,
  mode = "create",
  tags,
}: NewMetricSetSheetProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"team" | "private">("team")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const uniqueTenants = useMemo(() => {
    const map = new Map<string, Tenant>()
    for (const tenant of tenants) {
      if (!map.has(tenant.id)) {
        map.set(tenant.id, tenant)
      }
    }
    return Array.from(map.values())
  }, [tenants])

  const [tenantId, setTenantId] = useState<string>(uniqueTenants[0]?.id ?? "")
  const [selectedMetricFieldName, setSelectedMetricFieldName] = useState<string>(metrics[0]?.fieldName ?? "")
  const [metricRefs, setMetricRefs] = useState<{ fieldName: string; version?: string }[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const isEditMode = mode === "edit" && initialMetricSet

  useEffect(() => {
    if (!open) return

    if (isEditMode && initialMetricSet) {
      setName(initialMetricSet.name)
      setDescription(initialMetricSet.description)
      setVisibility(initialMetricSet.visibility)
      setTenantId(initialMetricSet.tenant || uniqueTenants[0]?.id || "")
      setSelectedTagIds(initialMetricSet.tags ?? [])
      
      if (initialMetricSet.metricRefs && initialMetricSet.metricRefs.length > 0) {
        setMetricRefs(initialMetricSet.metricRefs)
      } else if (initialMetricSet.metricFieldNames) {
        setMetricRefs(initialMetricSet.metricFieldNames.map(fieldName => ({ fieldName, version: "latest" })))
      } else {
        setMetricRefs([])
      }

      const firstFieldName = initialMetricSet.metricRefs?.[0]?.fieldName ?? initialMetricSet.metricFieldNames?.[0] ?? metrics[0]?.fieldName ?? ""
      setSelectedMetricFieldName(firstFieldName)
    } else {
      setName("")
      setDescription("")
      setVisibility("team")
      setTenantId(initialTenantId || uniqueTenants[0]?.id || "")
      setSelectedTagIds([])
      
      if (initialMetricFieldNames) {
        setMetricRefs(initialMetricFieldNames.map(fieldName => ({ fieldName, version: "latest" })))
        setSelectedMetricFieldName(initialMetricFieldNames[0] ?? metrics[0]?.fieldName ?? "")
      } else {
        setMetricRefs([])
        setSelectedMetricFieldName(metrics[0]?.fieldName ?? "")
      }
    }

    setMessage(null)
  }, [
    open,
    isEditMode,
    initialMetricSet,
    initialMetricFieldNames,
    initialTenantId,
    metrics,
    uniqueTenants,
  ])

  const handleAddMetricRef = () => {
    if (!selectedMetricFieldName) return
    if (metricRefs.some(ref => ref.fieldName === selectedMetricFieldName)) {
      setMessage(`Metric "${selectedMetricFieldName}" is already added to this metric set.`)
      return
    }
    setMetricRefs((prev) => [...prev, { fieldName: selectedMetricFieldName, version: "latest" }])
    setMessage(null)
  }

  const handleRemoveMetricRef = (fieldNameToRemove: string) => {
    setMetricRefs((prev) => prev.filter((ref) => ref.fieldName !== fieldNameToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setMessage("Name is required.")
      return
    }
    const nameClash = metricSets.some(
      (set) => set.name === trimmedName && (!isEditMode || set.id !== initialMetricSet?.id),
    )
    if (nameClash) {
      setMessage(`Metric set with name "${trimmedName}" already exists.`)
      return
    }
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    const metricFieldNames = metricRefs.map(r => r.fieldName)

    if (isEditMode && initialMetricSet) {
      const updatedSet: Album = {
        ...initialMetricSet,
        name: trimmedName,
        description: description.trim(),
        visibility,
        tenant: tenantId || "Custom",
        metricFieldNames,
        metricRefs,
        tags: selectedTagIds,
        updatedAt: nowIso,
        history: [
          ...(initialMetricSet.history || []),
          {
            version: `v${(initialMetricSet.history?.length || 0) + 1}`,
            timestamp: nowIso,
            editor: "Current User",
            action: "update",
            comment: "Updated metric set configuration",
          }
        ]
      }
      onMetricSetsChange(
        metricSets.map((set) => (set.id === initialMetricSet.id ? updatedSet : set)),
      )
    } else {
      const newSet: Album = {
        id: `a-${now}`,
        name: trimmedName,
        description: description.trim(),
        scope: "",
        visibility,
        tenant: tenantId || "Custom",
        metricFieldNames,
        metricRefs,
        dimensionRefs: [],
        tags: selectedTagIds,
        createdAt: nowIso,
        updatedAt: nowIso,
        history: [
          {
            version: "v1",
            timestamp: nowIso,
            editor: "Current User",
            action: "create",
            comment: "Created metric set",
          }
        ]
      }
      onMetricSetsChange([...metricSets, newSet])
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b bg-slate-50/50">
            <SheetTitle className="text-lg font-semibold text-slate-900">
              {isEditMode ? "Edit Metric Set" : "Create Metric Set"}
            </SheetTitle>
            <div className="text-sm text-slate-500">
              Group related metrics together for better organization and discovery.
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form id="metric-set-form" className="space-y-8" onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                  Basic Information
                </h3>
                <div className="grid gap-5 pl-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Name</label>
                    <Input
                      className="h-9 text-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. 2025 Q1 Growth Metrics"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Description</label>
                    <Textarea
                      rows={3}
                      className="text-sm resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the purpose of this metric set..."
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Configuration */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-600 rounded-full"></span>
                  Configuration
                </h3>
                <div className="grid gap-5 pl-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Tenant</label>
                      <Select value={tenantId} onValueChange={(value) => setTenantId(value)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select a tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueTenants.map((d) => (
                             <SelectItem key={d.id} value={d.id}>
                               {d.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Visibility</label>
                      <Select value={visibility} onValueChange={(value: "team" | "private") => setVisibility(value)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="team">Team (Public)</SelectItem>
                          <SelectItem value="private">Private (Only You)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Tags</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg min-h-[48px]">
                      {tags.length > 0 ? (
                        tags.map((tag) => {
                          const isActive = selectedTagIds.includes(tag.id)
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() =>
                                setSelectedTagIds((prev) =>
                                  prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                                )
                              }
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                isActive
                                  ? "border-blue-600 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {tag.name}
                            </button>
                          )
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic">No tags available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Metrics Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-emerald-600 rounded-full"></span>
                  Included Metrics
                </h3>
                <div className="pl-3 space-y-3">
                  <div className="flex gap-2">
                    <Select value={selectedMetricFieldName} onValueChange={(value) => setSelectedMetricFieldName(value)}>
                      <SelectTrigger className="h-9 text-sm flex-1">
                        <SelectValue placeholder="Select metric to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {metrics.map((m) => (
                          <SelectItem key={m.id} value={m.fieldName}>
                            {m.businessName} <span className="text-slate-400 ml-1">({m.fieldName})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" size="sm" onClick={handleAddMetricRef} className="bg-slate-900 text-white hover:bg-slate-800">
                      Add
                    </Button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
                    {metricRefs.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {metricRefs.map((ref) => {
                          const metric = metrics.find((m) => m.fieldName === ref.fieldName)
                          return (
                            <div key={ref.fieldName} className="flex items-center justify-between p-3 hover:bg-white transition-colors">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-900">{metric?.businessName ?? ref.fieldName}</span>
                                  <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-slate-200 font-mono h-5 px-1.5">
                                    {ref.version ?? "latest"}
                                  </Badge>
                                </div>
                                <span className="text-xs font-mono text-slate-500">{ref.fieldName}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                onClick={() => handleRemoveMetricRef(ref.fieldName)}
                              >
                                <span className="sr-only">Remove</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500 italic">
                        No metrics added to this set yet.
                      </div>
                    )}
                  </div>
                </div>
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
              <Button type="submit" form="metric-set-form" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100">
                {isEditMode ? "Save Changes" : "Create Metric Set"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface TagManagementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  metricSets: Album[]
  onMetricSetsChange: (sets: Album[]) => void
}

function TagManagementSheet({
  open,
  onOpenChange,
  tags,
  onTagsChange,
  metricSets,
  onMetricSetsChange,
}: TagManagementSheetProps) {
  const [newTagName, setNewTagName] = useState("")
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setNewTagName("")
      setEditingTagId(null)
      setEditingName("")
      setMessage(null)
    }
  }, [open])

  const handleAddTag = () => {
    const trimmed = newTagName.trim()
    if (!trimmed) {
      setMessage("Tag name is required.")
      return
    }
    const exists = tags.some((t) => t.name.trim().toLowerCase() === trimmed.toLowerCase())
    if (exists) {
      setMessage(`Tag "${trimmed}" already exists.`)
      return
    }
    const now = Date.now()
    const newTag: Tag = {
      id: `tag-${now}`,
      name: trimmed,
    }
    onTagsChange([...tags, newTag])
    setNewTagName("")
    setMessage(null)
  }

  const handleStartRename = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditingName(tag.name)
    setMessage(null)
  }

  const handleSaveRename = () => {
    if (!editingTagId) return
    const trimmed = editingName.trim()
    if (!trimmed) {
      setMessage("Tag name is required.")
      return
    }
    const exists = tags.some(
      (t) => t.id !== editingTagId && t.name.trim().toLowerCase() === trimmed.toLowerCase(),
    )
    if (exists) {
      setMessage(`Tag "${trimmed}" already exists.`)
      return
    }
    const nextTags = tags.map((t) => (t.id === editingTagId ? { ...t, name: trimmed } : t))
    onTagsChange(nextTags)
    setEditingTagId(null)
    setEditingName("")
    setMessage(null)
  }

  const handleDeleteTag = (id: string) => {
    const nextTags = tags.filter((t) => t.id !== id)
    const nextMetricSets = metricSets.map((set) => ({
      ...set,
      tags: Array.isArray(set.tags) ? set.tags.filter((tagId) => tagId !== id) : [],
    }))
    onTagsChange(nextTags)
    onMetricSetsChange(nextMetricSets)
    if (editingTagId === id) {
      setEditingTagId(null)
      setEditingName("")
    }
    setMessage(null)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Tag management</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 pb-6 text-xs">
          <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-semibold text-zinc-800">Create new tag</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="h-8 text-xs"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. US, EU, APAC"
              />
              <Button type="button" size="sm" className="text-xs" onClick={handleAddTag}>
                Add tag
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-800">Existing tags</p>
            {tags.length > 0 ? (
              <ul className="space-y-2">
                {tags.map((tag) => (
                  <li key={tag.id} className="flex items-center gap-2">
                    {editingTagId === tag.id ? (
                      <>
                        <Input
                          className="h-8 text-xs"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={handleSaveRename}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            setEditingTagId(null)
                            setEditingName("")
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px]">
                          {tag.name}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">{tag.id}</span>
                        <div className="ml-auto flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => handleStartRename(tag)}
                          >
                            Rename
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteTag(tag.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-zinc-500">
                No tags yet. Create tags to group metric sets by region or usage.
              </p>
            )}
          </div>

          {message && <p className="text-[11px] text-red-600">{message}</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface NewTenantSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTenant: (payload: {
    id: string
    name: string
    description: string
    categories: {
      name: string
      sourceType: string
      sourceLink: string
    }[]
  }) => void
}

export function NewTenantSheet({ open, onOpenChange, onCreateTenant }: NewTenantSheetProps) {
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  
  const [categories, setCategories] = useState<{
    name: string
    sourceType: string
    sourceLink: string
  }[]>([
    {
      name: "",
      sourceType: "Fabric model",
      sourceLink: "https://aeolus-sg.tiktok-row.net/pages/dataQuery?appId=555138"
    }
  ])

  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setId("")
      setName("")
      setDescription("")
      setCategories([{
        name: "",
        sourceType: "Fabric model",
        sourceLink: "https://aeolus-sg.tiktok-row.net/pages/dataQuery?appId=555138"
      }])
      setMessage(null)
    }
  }, [open])

  const handleCategoryChange = (index: number, field: string, value: string) => {
    const newCategories = [...categories]
    newCategories[index] = { ...newCategories[index], [field]: value }
    setCategories(newCategories)
  }

  const handleAddCategory = () => {
    setCategories([...categories, {
      name: "",
      sourceType: "Fabric model",
      sourceLink: "https://aeolus-sg.tiktok-row.net/pages/dataQuery?appId=555138"
    }])
  }

  const handleRemoveCategory = (index: number) => {
    if (categories.length === 1) return
    const newCategories = [...categories]
    newCategories.splice(index, 1)
    setCategories(newCategories)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedId = id.trim()
    const trimmedName = name.trim()
    
    if (!trimmedId || !trimmedName) {
      setMessage("Tenant ID and Name are required.")
      return
    }

    const validCategories = categories.filter(c => c.name.trim() && c.sourceType.trim() && c.sourceLink.trim())
    
    if (validCategories.length === 0) {
      setMessage("At least one valid category (with Name, Type and Link) is required.")
      return
    }
    
    onCreateTenant({
      id: trimmedId,
      name: trimmedName,
      description: description.trim(),
      categories: validCategories.map(c => ({
        name: c.name.trim(),
        sourceType: c.sourceType.trim(),
        sourceLink: c.sourceLink.trim()
      }))
    })
    setMessage(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">New tenant</SheetTitle>
        </SheetHeader>
        <div className="mt-4 pb-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Tenant ID</label>
              <Input
                className="h-8 text-xs"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. strategy-data"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Name</label>
              <Input
                className="h-8 text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Strategy Data"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Description</label>
              <Textarea
                rows={3}
                className="text-xs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level description of this business tenant."
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
               <div className="flex items-center justify-between">
                 <label className="text-xs font-medium text-zinc-700">Categories</label>
                 <Button type="button" size="sm" variant="ghost" className="h-6 text-xs text-blue-600" onClick={handleAddCategory}>
                   + Add Category
                 </Button>
               </div>
               
               <div className="space-y-4">
                 {categories.map((cat, index) => (
                   <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3 relative group">
                     {categories.length > 1 && (
                       <button 
                         type="button"
                         className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                         onClick={() => handleRemoveCategory(index)}
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                     )}
                     
                     <div className="space-y-1">
                       <label className="text-[10px] font-medium text-zinc-500">Category Name</label>
                       <Input
                         className="h-7 text-xs bg-white"
                         value={cat.name}
                         onChange={(e) => handleCategoryChange(index, "name", e.target.value)}
                         placeholder="e.g. Core Metrics"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-zinc-500">Source Type</label>
                          <Input
                            className="h-7 text-xs bg-white"
                            value={cat.sourceType}
                            onChange={(e) => handleCategoryChange(index, "sourceType", e.target.value)}
                            placeholder="e.g. Hive"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-zinc-500">Source Link</label>
                          <Input
                            className="h-7 text-xs bg-white"
                            value={cat.sourceLink}
                            onChange={(e) => handleCategoryChange(index, "sourceLink", e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="submit" size="sm" className="text-xs">
                Create tenant (mock)
              </Button>
              {message && <p className="text-[11px] text-red-600">{message}</p>}
            </div>
          </form>
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
    businessOwner: string
    techOwner: string
    tenantId: string
    category: string
    description: string
    sourceLink: string
    sourceDimensionField: string
    values: { code: string; label: string }[]
  }) => void
  tenants?: Tenant[]
  defaultTenantId?: string | null
  initialDimension?: Dimension | null
  mode?: "create" | "edit"
  onUpdateDimension?: (payload: {
    id: string
    businessName: string
    businessOwner: string
    techOwner: string
    tenantId: string
    category: string
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
  tenants = [],
  defaultTenantId = null,
  initialDimension,
  mode = "create",
  onUpdateDimension,
}: NewDimensionSheetProps) {
  const [fieldName, setFieldName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessOwner, setBusinessOwner] = useState("")
  const [techOwner, setTechOwner] = useState("")
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")
  const [description, setDescription] = useState("")
  const [sourceLink, setSourceLink] = useState("")
  const [sourceDimensionField, setSourceDimensionField] = useState("")
  const [enumValues, setEnumValues] = useState<{ code: string; label: string }[]>([])
  const [isFieldsOpen, setIsFieldsOpen] = useState(false)
  const [fieldSearch, setFieldSearch] = useState("")
  const [fieldTab, setFieldTab] = useState("source")
  const [message, setMessage] = useState<string | null>(null)

  const isEditMode = mode === "edit" && initialDimension && onUpdateDimension

  useEffect(() => {
    if (!open) return

    if (isEditMode && initialDimension) {
      setFieldName(initialDimension.fieldName)
      setBusinessName(initialDimension.name)
      setBusinessOwner(initialDimension.owners?.businessOwner ?? "")
      setTechOwner(initialDimension.owners?.techOwner ?? "")
      setSelectedTenantId(initialDimension.tenant ?? "")
      setSelectedCategoryName(initialDimension.category ?? "")
      setDescription(initialDimension.description)
      setSourceLink(initialDimension.sourceLink ?? "")
      setSourceDimensionField(initialDimension.sourceDimensionField ?? "")
      setEnumValues(initialDimension.values ?? [])
    } else {
      setFieldName("")
      setBusinessName("")
      setBusinessOwner("")
      setTechOwner("")
      setSelectedTenantId(defaultTenantId ?? tenants[0]?.id ?? "")
      setSelectedCategoryName("")
      setDescription("")
      setSourceLink("")
      setSourceDimensionField("")
      setEnumValues([])
    }
    setFieldSearch("")
    setFieldTab("source")
    setIsFieldsOpen(false)
    setMessage(null)
  }, [open, isEditMode, initialDimension, defaultTenantId, tenants])

  const currentTenant = useMemo(
    () => tenants.find((t) => t.id === selectedTenantId) ?? null,
    [tenants, selectedTenantId],
  )

  const availableCategories = useMemo(
    () => currentTenant?.categories ?? [],
    [currentTenant],
  )

  useEffect(() => {
    if (!selectedCategoryName) return
    const exists = availableCategories.some((c) => c.name === selectedCategoryName)
    if (!exists) {
      setSelectedCategoryName("")
    }
  }, [availableCategories, selectedCategoryName])

  useEffect(() => {
    if (!currentTenant || !selectedCategoryName) return
    const category = currentTenant.categories?.find((c) => c.name === selectedCategoryName)
    if (category?.dataSource?.link && !sourceLink) {
      setSourceLink(category.dataSource.link)
    }
  }, [currentTenant, selectedCategoryName, sourceLink])

  const fieldGroups = useMemo(
    () => ({
      source: [
        { name: "p_date", type: "date" },
        { name: "data_dt", type: "date" },
        { name: "ad_id", type: "number" },
        { name: "rit", type: "number" },
        { name: "external_action", type: "string" },
        { name: "objective_type", type: "string" },
        { name: "pricing_type", type: "string" },
        { name: "smart_bid_type", type: "string" },
        { name: "advertiser_origin", type: "string" },
        { name: "advertiser_customer_type", type: "string" },
        { name: "advertiser_id", type: "number" },
        { name: "ad_ref_app_id", type: "number" },
      ],
      dataset: [
        { name: "campaign_id", type: "number" },
        { name: "campaign_name", type: "string" },
        { name: "adgroup_id", type: "number" },
        { name: "adgroup_name", type: "string" },
        { name: "creative_id", type: "number" },
        { name: "placement", type: "string" },
        { name: "country_code", type: "string" },
      ],
      params: [
        { name: "start_date", type: "param" },
        { name: "end_date", type: "param" },
        { name: "timezone", type: "param" },
      ],
    }),
    [],
  )

  const filteredFields = useMemo(() => {
    const list = fieldGroups[fieldTab as keyof typeof fieldGroups] ?? []
    const keyword = fieldSearch.trim().toLowerCase()
    if (!keyword) return list
    return list.filter((field) => field.name.toLowerCase().includes(keyword))
  }, [fieldGroups, fieldSearch, fieldTab])

  const fieldIconMap = {
    date: Calendar,
    number: Hash,
    string: Type,
    param: Braces,
  } as const

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedFieldName = fieldName.trim()
    const trimmedBusinessName = businessName.trim()
    if (!trimmedBusinessName || (!isEditMode && !trimmedFieldName) || !selectedTenantId || !selectedCategoryName) {
      setMessage("Field name, business name, tenant, and category are required.")
      return
    }

    if (isEditMode && onUpdateDimension && initialDimension) {
      onUpdateDimension({
        id: initialDimension.id,
        businessName: trimmedBusinessName,
        businessOwner: businessOwner.trim(),
        techOwner: techOwner.trim(),
        tenantId: selectedTenantId,
        category: selectedCategoryName,
        description: description.trim(),
        sourceLink: sourceLink.trim(),
        sourceDimensionField: sourceDimensionField.trim(),
        values: enumValues,
      })
    } else {
      onCreateDimension({
        fieldName: trimmedFieldName,
        businessName: trimmedBusinessName,
        businessOwner: businessOwner.trim(),
        techOwner: techOwner.trim(),
        tenantId: selectedTenantId,
        category: selectedCategoryName,
        description: description.trim(),
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
                  <p className="text-sm font-semibold text-slate-900">Tenant & Category</p>
                  <p className="text-xs text-slate-500 mt-1">Choose tenant and category for this dimension.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500">Tenant</label>
                    <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                      <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500">Category</label>
                    <Select value={selectedCategoryName} onValueChange={setSelectedCategoryName}>
                      <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.length > 0 ? (
                          availableCategories.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-[10px] text-slate-400 italic text-center">No categories for this tenant</div>
                        )}
                      </SelectContent>
                    </Select>
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
                    <label className="text-xs font-semibold text-slate-700">Business owner</label>
                    <Input
                      className="h-9 text-xs"
                      value={businessOwner}
                      onChange={(e) => setBusinessOwner(e.target.value)}
                      placeholder="Owner name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Tech owner</label>
                    <Input
                      className="h-9 text-xs"
                      value={techOwner}
                      onChange={(e) => setTechOwner(e.target.value)}
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
                  <p className="text-sm font-semibold text-slate-900">Enum definition</p>
                  <p className="text-xs text-slate-500 mt-1">Manage enumerated values for this dimension.</p>
                </div>
                <div className="space-y-3">
                  {enumValues.map((value, index) => (
                    <div key={`${value.code}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-center">
                      <Input
                        className="h-9 text-xs font-mono"
                        placeholder="Code"
                        value={value.code}
                        onChange={(e) => {
                          const next = [...enumValues]
                          next[index] = { ...next[index], code: e.target.value }
                          setEnumValues(next)
                        }}
                      />
                      <Input
                        className="h-9 text-xs"
                        placeholder="Label"
                        value={value.label}
                        onChange={(e) => {
                          const next = [...enumValues]
                          next[index] = { ...next[index], label: e.target.value }
                          setEnumValues(next)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs border-slate-200"
                        onClick={() => setEnumValues(enumValues.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs border-slate-200"
                    onClick={() => setEnumValues([...enumValues, { code: "", label: "" }])}
                  >
                    Add enum value
                  </Button>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Query binding</p>
                  <p className="text-xs text-slate-500 mt-1">Bind the dimension to a source dataset.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Source dataset link</label>
                    <Input
                      type="url"
                      className="h-9 text-xs"
                      value={sourceLink}
                      onChange={(e) => setSourceLink(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Source Dimension Field</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-[11px] border-slate-200 hover:bg-slate-50"
                        onClick={() => setIsFieldsOpen(true)}
                      >
                        Fields
                      </Button>
                    </div>
                    <Input
                      className="h-9 text-xs font-mono"
                      value={sourceDimensionField}
                      onChange={(e) => setSourceDimensionField(e.target.value)}
                      placeholder="e.g. dim_agency_tier"
                    />
                  </div>
                </div>
              </div>

              <Dialog open={isFieldsOpen} onOpenChange={setIsFieldsOpen}>
                <DialogContent className="max-w-md p-0">
                  <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle className="text-sm font-semibold text-slate-900">Fields</DialogTitle>
                  </DialogHeader>
                  <Tabs value={fieldTab} onValueChange={setFieldTab} className="w-full">
                    <div className="px-4 pb-2">
                      <TabsList className="h-7 bg-slate-100 p-0.5 rounded-lg">
                        <TabsTrigger value="source" className="h-6 text-[10px] rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                          Data source fields
                        </TabsTrigger>
                        <TabsTrigger value="dataset" className="h-6 text-[10px] rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                          Dataset fields
                        </TabsTrigger>
                        <TabsTrigger value="params" className="h-6 text-[10px] rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                          Params
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <div className="px-4 pb-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={fieldSearch}
                          onChange={(e) => setFieldSearch(e.target.value)}
                          placeholder="Search fields"
                          className="h-9 pl-8 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto px-2 pb-4">
                      <TabsContent value="source" className="mt-0">
                        <div className="space-y-1">
                          {filteredFields.map((field) => {
                            const Icon = fieldIconMap[field.type as keyof typeof fieldIconMap] ?? Hash
                            return (
                              <button
                                key={field.name}
                                type="button"
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50"
                                onDoubleClick={() => {
                                  setSourceDimensionField(field.name)
                                  setIsFieldsOpen(false)
                                }}
                              >
                                <Icon className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-mono text-slate-800">{field.name}</span>
                              </button>
                            )
                          })}
                          {filteredFields.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-6">No fields found.</p>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="dataset" className="mt-0">
                        <div className="space-y-1">
                          {filteredFields.map((field) => {
                            const Icon = fieldIconMap[field.type as keyof typeof fieldIconMap] ?? Hash
                            return (
                              <button
                                key={field.name}
                                type="button"
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50"
                                onDoubleClick={() => {
                                  setSourceDimensionField(field.name)
                                  setIsFieldsOpen(false)
                                }}
                              >
                                <Icon className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-mono text-slate-800">{field.name}</span>
                              </button>
                            )
                          })}
                          {filteredFields.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-6">No fields found.</p>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="params" className="mt-0">
                        <div className="space-y-1">
                          {filteredFields.map((field) => {
                            const Icon = fieldIconMap[field.type as keyof typeof fieldIconMap] ?? Braces
                            return (
                              <button
                                key={field.name}
                                type="button"
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50"
                                onDoubleClick={() => {
                                  setSourceDimensionField(`:${field.name}`)
                                  setIsFieldsOpen(false)
                                }}
                              >
                                <Icon className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-mono text-slate-800">{field.name}</span>
                              </button>
                            )
                          })}
                          {filteredFields.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-6">No params found.</p>
                          )}
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </DialogContent>
              </Dialog>
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

interface MetricSetDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metricSet: Album
  metrics: Metric[]
  dimensions: Dimension[]
}

function MetricSetDetailSheet({ open, onOpenChange, metricSet, metrics, dimensions }: MetricSetDetailSheetProps) {
  const metricsInSet = useMemo(() => {
    return metricSet.metricRefs.map((ref) => {
      const metric = metrics.find((m) => m.fieldName === ref.fieldName)
      return {
        ...metric,
        refVersion: ref.version,
        fieldName: ref.fieldName,
      }
    })
  }, [metrics, metricSet])

  const dimensionsInSet = useMemo(() => {
    return metricSet.dimensionRefs.map((ref) => {
      const dimension = dimensions.find((d) => d.fieldName === ref.fieldName)
      return {
        ...dimension,
        refVersion: ref.version,
        fieldName: ref.fieldName,
      }
    })
  }, [dimensions, metricSet])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Metric set details</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6 pb-6 text-xs">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900">{metricSet.name}</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <span>Tenant: {metricSet.tenant}</span>
              <span>Visibility: {metricSet.visibility}</span>
              {metricSet.updatedAt && <span>Updated: {formatDate(metricSet.updatedAt)}</span>}
            </div>
            {metricSet.description && (
              <p className="text-[11px] text-zinc-600">{metricSet.description}</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-800">
              Metrics ({metricsInSet.length})
            </p>
            {metricsInSet.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Field Name</TableHead>
                    <TableHead className="text-xs">Version</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricsInSet.map((m) => (
                    <TableRow key={m.fieldName} className="hover:bg-zinc-50">
                      <TableCell className="text-xs font-medium text-zinc-900">{m.businessName ?? "-"}</TableCell>
                      <TableCell className="font-mono text-[11px] text-zinc-500">{m.fieldName}</TableCell>
                      <TableCell className="text-xs text-zinc-700">
                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 font-mono">
                          {m.refVersion ?? "latest"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {m.status && (
                          <Badge variant="outline" className="text-[10px]">
                            {m.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-[11px] text-zinc-500">
                No metrics from the registry are currently mapped to this metric set.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-800">
              Dimensions ({dimensionsInSet.length})
            </p>
            {dimensionsInSet.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Field Name</TableHead>
                    <TableHead className="text-xs">Version</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dimensionsInSet.map((d) => (
                    <TableRow key={d.fieldName} className="hover:bg-zinc-50">
                      <TableCell className="text-xs font-medium text-zinc-900">{d.name ?? "-"}</TableCell>
                      <TableCell className="font-mono text-[11px] text-zinc-500">{d.fieldName}</TableCell>
                      <TableCell className="text-xs text-zinc-700">
                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 font-mono">
                          {d.refVersion ?? "latest"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.type && (
                          <Badge variant="outline" className="text-[10px]">
                            {d.type}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-[11px] text-zinc-500">
                No dimensions mapped to this metric set.
              </p>
            )}
          </div>

          {metricSet.history && metricSet.history.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <p className="text-xs font-semibold text-zinc-800">Version History</p>
              <div className="space-y-3">
                {metricSet.history.map((h, i) => (
                  <div key={i} className="flex gap-3 text-[11px]">
                    <div className="flex-none w-8 pt-0.5">
                      <Badge variant="outline" className="text-[10px] h-5 px-1 bg-slate-50 text-slate-500 font-mono border-slate-200">
                        {h.version}
                      </Badge>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>{h.editor}</span>
                        <span>{formatDate(h.timestamp)}</span>
                      </div>
                      <p className="text-slate-700">{h.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}


interface TenantCategoriesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant
  onUpdateTenant: (tenant: Tenant) => void
}

function TenantCategoriesSheet({ open, onOpenChange, tenant, onUpdateTenant }: TenantCategoriesSheetProps) {
  const [categories, setCategories] = useState<TenantCategory[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState(-1)

  // Form state
  const [name, setName] = useState("")
  const [dataSourceType, setDataSourceType] = useState("")
  const [dataSourceLink, setDataSourceLink] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && tenant) {
      setCategories(tenant.categories || [])
      resetForm()
    }
  }, [open, tenant])

  const resetForm = () => {
    setName("")
    setDataSourceType("")
    setDataSourceLink("")
    setIsEditing(false)
    setEditingIndex(-1)
    setError(null)
  }

  const handleEdit = (index: number) => {
    const cat = categories[index]
    setName(cat.name)
    setDataSourceType(cat.dataSource?.type || "")
    setDataSourceLink(cat.dataSource?.link || "")
    setIsEditing(true)
    setEditingIndex(index)
    setError(null)
  }

  const handleDelete = (index: number) => {
    const newCategories = [...categories]
    newCategories.splice(index, 1)
    setCategories(newCategories)
    onUpdateTenant({ ...tenant, categories: newCategories })
  }

  const handleSave = () => {
    if (!name.trim()) {
      setError("Category name is required")
      return
    }

    const newCategory: TenantCategory = {
      name: name.trim(),
      dataSource: dataSourceType || dataSourceLink ? {
        type: dataSourceType.trim(),
        link: dataSourceLink.trim()
      } : undefined
    }

    let newCategories = [...categories]
    if (isEditing && editingIndex >= 0) {
      newCategories[editingIndex] = newCategory
    } else {
      // Check for duplicate names
      if (categories.some(c => c.name === newCategory.name)) {
        setError("Category name already exists")
        return
      }
      newCategories.push(newCategory)
    }

    setCategories(newCategories)
    onUpdateTenant({ ...tenant, categories: newCategories })
    resetForm()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Manage Categories for {tenant.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
           {/* List of existing categories */}
           <div className="space-y-3">
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Existing Categories</h3>
             {categories.length > 0 ? (
               <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                 {categories.map((cat, idx) => (
                   <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                     <div>
                       <div className="text-sm font-medium text-slate-900">{cat.name}</div>
                       {cat.dataSource && (
                         <div className="text-xs text-slate-500 mt-0.5">
                           Bound to {cat.dataSource.type} (<a href={cat.dataSource.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{cat.dataSource.link}</a>)
                         </div>
                       )}
                     </div>
                     <div className="flex gap-2">
                       <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleEdit(idx)}>Edit</Button>
                       <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(idx)}>Delete</Button>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-xs text-slate-400 italic">No categories defined for this tenant.</p>
             )}
           </div>

           <div className="h-px bg-slate-100" />

           {/* Add/Edit Form */}
           <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="text-xs font-semibold text-slate-900">{isEditing ? "Edit Category" : "Add New Category"}</h3>
             <div className="space-y-3">
               <div className="space-y-1">
                 <label className="text-xs font-medium text-slate-700">Name</label>
                 <Input className="h-8 text-xs" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Delivery" />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-xs font-medium text-slate-700">Data Source Type</label>
                   <Input className="h-8 text-xs" value={dataSourceType} onChange={e => setDataSourceType(e.target.value)} placeholder="e.g. Hive" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-medium text-slate-700">Data Source Link</label>
                   <Input className="h-8 text-xs" value={dataSourceLink} onChange={e => setDataSourceLink(e.target.value)} placeholder="https://..." />
                 </div>
               </div>
             </div>
             <div className="flex justify-between items-center pt-2">
               {error ? <p className="text-xs text-red-600">{error}</p> : <div></div>}
               <div className="flex gap-2">
                 {isEditing && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetForm}>Cancel</Button>}
                 <Button size="sm" className="h-7 text-xs" onClick={handleSave}>{isEditing ? "Update" : "Add"}</Button>
               </div>
             </div>
           </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
