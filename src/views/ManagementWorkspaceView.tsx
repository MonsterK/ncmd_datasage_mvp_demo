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
import { Home, ListTree, Layers, FolderKanban, LineChart as LineChartIcon, PlusCircle } from "lucide-react"

import {
  Metric,
  Dimension,
  CategoryNode,
  Domain,
  NewMetricPayload,
  Album,
  Tag,
} from "@/types"
import { MetricRegistrationView } from "@/views/MetricRegistrationView"

export type ManagementSection = "metric" | "metricSet" | "dimension" | "category" | "domain"

export interface ManagementWorkspaceViewProps {
  activeSection: ManagementSection
  onChangeSection: (section: ManagementSection) => void
  metrics: Metric[]
  metricSets: Album[]
  setMetricSets: (sets: Album[]) => void
  dimensions: Dimension[]
  categories: CategoryNode[]
  domains: Domain[]
  onOpenMetricProfile: (slug: string) => void
  onRegisterMetric: (payload: NewMetricPayload) => void
  onUpdateMetric: (slug: string, payload: NewMetricPayload) => void
  onDeleteMetric: (slug: string) => void
  onCreateDomain: (payload: {
    id: string
    name: string
    description: string
    sourceType: string
    sourceLink: string
  }) => void
  onCreateCategory: (payload: { id: string; name: string; description: string }) => void
  onCreateDimension: (payload: {
    id: string
    name: string
    description: string
    category: string
    sourceLink: string
  }) => void
  onUpdateDimension: (payload: {
    id: string
    name: string
    description: string
    category: string
    sourceLink: string
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
  domains,
  onOpenMetricProfile,
  onRegisterMetric,
  onUpdateMetric,
  onDeleteMetric,
  onCreateDomain,
  onCreateCategory,
  onCreateDimension,
  onUpdateDimension,
  onDeleteDimension,
  tags,
  setTags,
}: ManagementWorkspaceViewProps) {
  const [isNewMetricSheetOpen, setIsNewMetricSheetOpen] = useState(false)
  const [isNewMetricSetSheetOpen, setIsNewMetricSetSheetOpen] = useState(false)
  const [isNewDomainSheetOpen, setIsNewDomainSheetOpen] = useState(false)
  const [isNewCategorySheetOpen, setIsNewCategorySheetOpen] = useState(false)
  const [isNewDimensionSheetOpen, setIsNewDimensionSheetOpen] = useState(false)
  const [metricSheetMode, setMetricSheetMode] = useState<"create" | "edit">("create")
  const [metricToEdit, setMetricToEdit] = useState<Metric | null>(null)
  const [metricSetSheetMode, setMetricSetSheetMode] = useState<"create" | "edit">("create")
  const [metricSetToEdit, setMetricSetToEdit] = useState<Album | null>(null)
  const [dimensionSheetMode, setDimensionSheetMode] = useState<"create" | "edit">("create")
  const [dimensionToEdit, setDimensionToEdit] = useState<Dimension | null>(null)
  const [metricSetToView, setMetricSetToView] = useState<Album | null>(null)
  const [isMetricSetDetailSheetOpen, setIsMetricSetDetailSheetOpen] = useState(false)
  const [isTagManagementSheetOpen, setIsTagManagementSheetOpen] = useState(false)

  const tagNameById = useMemo(() => {
    const map = new Map<string, string>()
    tags.forEach((tag) => {
      map.set(tag.id, tag.name)
    })
    return map
  }, [tags])

  const renderSectionContent = () => {
    switch (activeSection) {
      case "metric":
        return (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Slug</TableHead>
                  <TableHead className="text-xs">Domain</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Owners</TableHead>
                  <TableHead className="text-xs">Updated at</TableHead>
                  <TableHead className="w-[1%] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m) => (
                  <TableRow key={m.id} className="hover:bg-zinc-50">
                    <TableCell className="text-sm font-medium text-zinc-900">{m.businessName}</TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-500">{m.slug}</TableCell>
                    <TableCell className="text-xs text-zinc-700">{m.domain}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span>{m.owners.businessOwner}</span>
                        <span className="text-[11px] text-zinc-500">{m.owners.techOwner}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-zinc-500">{formatDate(m.updatedAt)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] shadow-sm hover:shadow-md"
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
                          className="h-7 px-2 text-[11px] text-red-600 shadow-sm hover:bg-red-50 hover:shadow-md"
                          onClick={() => onDeleteMetric(m.slug)}
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] shadow-sm hover:shadow-md"
                          onClick={() => onOpenMetricProfile(m.slug)}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {metrics.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-xs text-zinc-500">
                      No metrics in the registry yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )
      case "metricSet":
        return (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Domain</TableHead>
                  <TableHead className="text-xs">Visibility</TableHead>
+                  <TableHead className="text-xs">Tags</TableHead>
                  <TableHead className="text-xs">Metric count</TableHead>
                  <TableHead className="text-xs">Updated at</TableHead>
                  <TableHead className="w-[1%] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricSets.map((set) => (
                  <TableRow key={set.id} className="hover:bg-zinc-50">
                    <TableCell className="text-sm font-medium text-zinc-900">{set.name}</TableCell>
                    <TableCell className="text-xs text-zinc-700">{set.domain}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {set.visibility}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {set.tags && set.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {set.tags.map((tagId) => (
                            <Badge key={tagId} variant="outline" className="text-[10px]">
                              {tagNameById.get(tagId) ?? tagId}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-700">{set.metricSlugs.length}</TableCell>
                    <TableCell className="text-[11px] text-zinc-500">{formatDate(set.updatedAt)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] shadow-sm hover:shadow-md"
                          onClick={() => {
                            setMetricSetSheetMode("edit")
                            setMetricSetToEdit(set)
                            setIsNewMetricSetSheetOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-red-600 shadow-sm hover:bg-red-50 hover:shadow-md"
                          onClick={() => setMetricSets(metricSets.filter((s) => s.id !== set.id))}
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] shadow-sm hover:shadow-md"
                          onClick={() => {
                            setMetricSetToView(set)
                            setIsMetricSetDetailSheetOpen(true)
                          }}
                        >
                          Open
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {metricSets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-xs text-zinc-500">
                      No metric sets in the registry yet.
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
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Slug</TableHead>
                  <TableHead className="text-xs">Domain</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Bound metric count</TableHead>
                  <TableHead className="text-xs">Updated at</TableHead>
                  <TableHead className="w-[1%] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dimensions.map((d) => (
                  <TableRow key={d.id} className="hover:bg-zinc-50">
                    <TableCell className="text-sm font-medium text-zinc-900">{d.name}</TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-500">{d.slug}</TableCell>
                    <TableCell className="text-xs text-zinc-700">{d.domain}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {d.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-700">{d.boundMetricSlugs.length}</TableCell>
                    <TableCell className="text-[11px] text-zinc-500">{formatDate(d.updatedAt)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] shadow-sm hover:shadow-md"
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
                          className="h-7 px-2 text-[11px] text-red-600 shadow-sm hover:bg-red-50 hover:shadow-md"
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
                    <TableCell colSpan={7} className="py-6 text-center text-xs text-zinc-500">
                      No dimensions in the registry yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )
      case "category":
        return <CategoryManagementView categories={categories} metrics={metrics} />
      case "domain":
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Domain management (mock)</CardTitle>
              <CardDescription className="text-xs">
                Simple overview of domains available in the demo. In a full product this would manage ownership and
                permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {domains.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Data source type</TableHead>
                      <TableHead className="text-xs">Data source link</TableHead>
                      <TableHead className="text-xs">Permitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((d) => (
                      <TableRow key={d.id} className="hover:bg-zinc-50">
                         <TableCell className="text-[11px] font-mono text-zinc-600">{d.id}</TableCell>
                        <TableCell className="text-xs">{d.name}</TableCell>
                        <TableCell className="text-xs text-zinc-600">{d.description}</TableCell>
                        <TableCell className="text-xs text-zinc-600">{d.sourceType ?? "-"}</TableCell>
                        <TableCell className="text-xs text-zinc-600">
                          {d.sourceLink ? (
                            <a
                              href={d.sourceLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-indigo-600 underline"
                            >
                              {d.sourceLink}
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-600">{d.permitted === false ? "No" : "Yes"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-zinc-500">No domains configured in the mock data.</p>
              )}
            </CardContent>
          </Card>
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
      case "metricSet":
        return {
          title: "Metric set management",
          description: "Maintain metric sets used for SGI, QBR and creator monitoring.",
          addLabel: "New metric set",
        }
      case "dimension":
        return {
          title: "Dimension management",
          description: "Manage dimension terms, values dictionary and bindings.",
          addLabel: "New dimension",
        }
      case "category":
        return {
          title: "Category management",
          description: "Maintain the metric category tree for the registry.",
          addLabel: "New category",
        }
      case "domain":
        return {
          title: "Domain management",
          description: "Configure business domains and high-level permissions.",
          addLabel: "New domain",
        }
      default:
        return {
          title: "Management",
          description: "Administer metrics, metric sets, dimensions, categories and domains.",
          addLabel: "New",
        }
    }
  }

  const handleAddClick = () => {
    if (activeSection === "metric") {
      setMetricSheetMode("create")
      setMetricToEdit(null)
      setIsNewMetricSheetOpen(true)
    } else if (activeSection === "metricSet") {
      setMetricSetSheetMode("create")
      setMetricSetToEdit(null)
      setIsNewMetricSetSheetOpen(true)
    } else if (activeSection === "dimension") {
      setDimensionSheetMode("create")
      setDimensionToEdit(null)
      setIsNewDimensionSheetOpen(true)
    } else if (activeSection === "category") {
      setIsNewCategorySheetOpen(true)
    } else if (activeSection === "domain") {
      setIsNewDomainSheetOpen(true)
    }
  }

  const header = getSectionHeader()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Management</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Areas</CardTitle>
            <CardDescription className="text-xs">Navigation across the main management modules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <SidebarItem
              icon={LineChartIcon}
              label="Metric management"
              active={activeSection === "metric"}
              onClick={() => onChangeSection("metric")}
            />
            <SidebarItem
              icon={FolderKanban}
              label="Metric set management"
              active={activeSection === "metricSet"}
              onClick={() => onChangeSection("metricSet")}
            />
            <SidebarItem
              icon={Layers}
              label="Dimension management"
              active={activeSection === "dimension"}
              onClick={() => onChangeSection("dimension")}
            />
            <SidebarItem
              icon={ListTree}
              label="Category management"
              active={activeSection === "category"}
              onClick={() => onChangeSection("category")}
            />
            <SidebarItem
              icon={Home}
              label="Domain management"
              active={activeSection === "domain"}
              onClick={() => onChangeSection("domain")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm">{header.title}</CardTitle>
              <CardDescription className="text-xs">{header.description}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1 rounded-full text-xs shadow-sm transition hover:shadow-md"
                onClick={handleAddClick}
              >
                <PlusCircle className="h-3 w-3" />
                <span>{header.addLabel}</span>
              </Button>
              {activeSection === "metricSet" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-1 rounded-full text-xs shadow-sm transition hover:shadow-md"
                  onClick={() => setIsTagManagementSheetOpen(true)}
                >
                  Manage tags
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>{renderSectionContent()}</CardContent>
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
        categories={categories}
        onRegisterMetric={onRegisterMetric}
        initialMetric={metricToEdit}
        mode={metricSheetMode}
        onUpdateMetric={onUpdateMetric}
      />

      <NewMetricSetSheet
        open={isNewMetricSetSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMetricSetToEdit(null)
            setMetricSetSheetMode("create")
          }
          setIsNewMetricSetSheetOpen(open)
        }}
        metrics={metrics}
        metricSets={metricSets}
        onMetricSetsChange={setMetricSets}
        domains={domains}
        mode={metricSetSheetMode}
        initialMetricSet={metricSetToEdit}
        tags={tags}
      />

      <NewDomainSheet
        open={isNewDomainSheetOpen}
        onOpenChange={setIsNewDomainSheetOpen}
        onCreateDomain={onCreateDomain}
      />

      <NewCategorySheet
        open={isNewCategorySheetOpen}
        onOpenChange={setIsNewCategorySheetOpen}
        onCreateCategory={onCreateCategory}
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
        onCreateDimension={onCreateDimension}
        initialDimension={dimensionToEdit}
        mode={dimensionSheetMode}
        onUpdateDimension={onUpdateDimension}
      />

      {metricSetToView && (
        <MetricSetDetailSheet
          open={isMetricSetDetailSheetOpen}
          onOpenChange={(open) => {
            setIsMetricSetDetailSheetOpen(open)
            if (!open) {
              setMetricSetToView(null)
            }
          }}
          metricSet={metricSetToView}
          metrics={metrics}
        />
      )}

      <TagManagementSheet
        open={isTagManagementSheetOpen}
        onOpenChange={setIsTagManagementSheetOpen}
        tags={tags}
        onTagsChange={setTags}
        metricSets={metricSets}
        onMetricSetsChange={setMetricSets}
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
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
        active
          ? "bg-zinc-900 text-white"
          : disabled
            ? "cursor-not-allowed text-zinc-300"
            : "text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )
}

interface NewMetricSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategoryNode[]
  onRegisterMetric: (payload: NewMetricPayload) => void
  initialMetric?: Metric | null
  mode?: "create" | "edit"
  onUpdateMetric?: (slug: string, payload: NewMetricPayload) => void
}

export function NewMetricSheet({
  open,
  onOpenChange,
  categories,
  onRegisterMetric,
  initialMetric,
  mode = "create",
  onUpdateMetric,
}: NewMetricSheetProps) {
  const isEditMode = mode === "edit" && initialMetric && onUpdateMetric

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">
            {isEditMode ? "Edit metric" : "New metric"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 pb-6">
          <MetricRegistrationView
            key={isEditMode && initialMetric ? initialMetric.id : "new"}
            categories={categories}
            initialMetric={isEditMode ? initialMetric ?? undefined : undefined}
            disableSlugEditing={Boolean(isEditMode)}
            onRegisterMetric={(payload) => {
              if (isEditMode && initialMetric && onUpdateMetric) {
                onUpdateMetric(initialMetric.slug, payload)
              } else {
                onRegisterMetric(payload)
              }
              onOpenChange(false)
            }}
          />
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
  domains: Domain[]
  initialMetricSlugs?: string[]
  initialDomainId?: string
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
  domains,
  initialMetricSlugs,
  initialDomainId,
  initialMetricSet,
  mode = "create",
  tags,
}: NewMetricSetSheetProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"team" | "private">("team")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const uniqueDomains = useMemo(() => {
    const map = new Map<string, Domain>()
    for (const domain of domains) {
      if (!map.has(domain.id)) {
        map.set(domain.id, domain)
      }
    }
    return Array.from(map.values())
  }, [domains])

  const [domainId, setDomainId] = useState<string>(uniqueDomains[0]?.id ?? "")
  const [selectedMetricSlug, setSelectedMetricSlug] = useState<string>(metrics[0]?.slug ?? "")
  const [metricSlugs, setMetricSlugs] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const isEditMode = mode === "edit" && initialMetricSet

  useEffect(() => {
    if (!open) return

    if (isEditMode && initialMetricSet) {
      setName(initialMetricSet.name)
      setDescription(initialMetricSet.description)
      setVisibility(initialMetricSet.visibility)
      setDomainId(initialMetricSet.domain || uniqueDomains[0]?.id || "")
      setSelectedTagIds(initialMetricSet.tags ?? [])
      const initial = initialMetricSet.metricSlugs ?? []
      setMetricSlugs(initial)
      const firstSlug = initial[0] ?? metrics[0]?.slug ?? ""
      setSelectedMetricSlug(firstSlug)
    } else {
      setName("")
      setDescription("")
      setVisibility("team")
      setDomainId(initialDomainId || uniqueDomains[0]?.id || "")
      setSelectedTagIds([])
      const initial = initialMetricSlugs ?? []
      setMetricSlugs(initial)
      const firstSlug = initial[0] ?? metrics[0]?.slug ?? ""
      setSelectedMetricSlug(firstSlug)
    }

    setMessage(null)
  }, [
    open,
    isEditMode,
    initialMetricSet,
    initialMetricSlugs,
    initialDomainId,
    metrics,
    uniqueDomains,
  ])

  const handleAddMetricRef = () => {
    if (!selectedMetricSlug) return
    if (metricSlugs.includes(selectedMetricSlug)) {
      setMessage(`Metric "${selectedMetricSlug}" is already added to this metric set (mock).`)
      return
    }
    setMetricSlugs((prev) => [...prev, selectedMetricSlug])
    setMessage(null)
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
      setMessage(`Metric set with name "${trimmedName}" already exists (mock uniqueness validation).`)
      return
    }
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    if (isEditMode && initialMetricSet) {
      const updatedSet: Album = {
        ...initialMetricSet,
        name: trimmedName,
        description: description.trim(),
        visibility,
        domain: domainId || "Custom",
        metricSlugs,
        tags: selectedTagIds,
        updatedAt: nowIso,
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
        domain: domainId || "Custom",
        metricSlugs,
        tags: selectedTagIds,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
      onMetricSetsChange([...metricSets, newSet])
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">
            {isEditMode ? "Edit metric set" : "New metric set"}
          </SheetTitle>
         </SheetHeader>
        <div className="mt-4 pb-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
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
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Tags</label>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => {
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
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                          isActive
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500">No tags configured yet.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Domain</label>
              <Select value={domainId} onValueChange={(value) => setDomainId(value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueDomains.map((d) => (
                     <SelectItem key={d.id} value={d.id}>
                       {d.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-800">Metric references</p>
                <span className="text-[11px] text-zinc-500">Add metrics to include in this metric set.</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={selectedMetricSlug} onValueChange={(value) => setSelectedMetricSlug(value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics.map((m) => (
                      <SelectItem key={m.id} value={m.slug}>
                        {m.businessName} ({m.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" className="text-xs" onClick={handleAddMetricRef}>
                  Add metric
                </Button>
              </div>
              {metricSlugs.length > 0 ? (
                <ul className="space-y-1 text-[11px] text-zinc-700">
                  {metricSlugs.map((slug) => {
                    const metric = metrics.find((m) => m.slug === slug)
                    return (
                      <li key={slug} className="flex items-center justify-between gap-2">
                        <span>{metric?.businessName ?? slug}</span>
                        <span className="font-mono text-[11px] text-zinc-500">{slug}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-[11px] text-zinc-500">No metrics added yet.</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Button type="submit" size="sm" className="text-xs">
                {isEditMode ? "Save changes" : "Create metric set (mock)"}
              </Button>
              {message && <p className="text-[11px] text-zinc-600">{message}</p>}
            </div>
          </form>
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

interface NewDomainSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateDomain: (payload: { id: string; name: string; description: string; sourceType: string; sourceLink: string }) => void
}

export function NewDomainSheet({ open, onOpenChange, onCreateDomain }: NewDomainSheetProps) {
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sourceType, setSourceType] = useState("Fabric table")
  const [sourceLink, setSourceLink] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setId("")
      setName("")
      setDescription("")
      setSourceType("Fabric table")
      setSourceLink("")
      setMessage(null)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedId = id.trim()
    const trimmedName = name.trim()
    const trimmedSourceType = sourceType.trim()
    const trimmedSourceLink = sourceLink.trim()
    if (!trimmedId || !trimmedName || !trimmedSourceType || !trimmedSourceLink) {
      setMessage("ID, name, data source type and data source link are required.")
      return
    }
    if (!/^\d+$/.test(trimmedId)) {
      setMessage("Domain ID must be digits only.")
      return
    }
    onCreateDomain({
      id: trimmedId,
      name: trimmedName,
      description: description.trim(),
      sourceType: trimmedSourceType,
      sourceLink: trimmedSourceLink,
    })
    setMessage(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">New domain</SheetTitle>
        </SheetHeader>
        <div className="mt-4 pb-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Domain ID</label>
              <Input
                type="number"
                inputMode="numeric"
                pattern="\d*"
                className="h-8 text-xs"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. 1001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Name</label>
              <Input
                className="h-8 text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Strategic Goal Incentive"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Description</label>
              <Textarea
                rows={3}
                className="text-xs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level description of this business domain."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Data source type</label>
              <Input
                className="h-8 text-xs"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                placeholder="e.g. Hive table / Aeolus dataset"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Data source link</label>
              <Input
                type="url"
                className="h-8 text-xs"
                value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Button type="submit" size="sm" className="text-xs">
                Create domain (mock)
              </Button>
              {message && <p className="text-[11px] text-zinc-600">{message}</p>}
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface NewCategorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCategory: (payload: { id: string; name: string; description: string }) => void
}

export function NewCategorySheet({ open, onOpenChange, onCreateCategory }: NewCategorySheetProps) {
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedId = id.trim()
    const trimmedName = name.trim()
    if (!trimmedId || !trimmedName) {
      setMessage("ID and name are required.")
      return
    }
    onCreateCategory({ id: trimmedId, name: trimmedName, description: description.trim() })
    setMessage(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">New category</SheetTitle>
        </SheetHeader>
        <div className="mt-4 pb-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Category ID</label>
              <Input
                className="h-8 text-xs"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. c2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Name</label>
              <Input
                className="h-8 text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New category name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Description</label>
              <Textarea
                rows={3}
                className="text-xs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for this category node."
              />
            </div>
            <div className="flex items-center justify-between">
              <Button type="submit" size="sm" className="text-xs">
                Create category (mock)
              </Button>
              {message && <p className="text-[11px] text-zinc-600">{message}</p>}
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
    id: string
    name: string
    description: string
    category: string
    sourceLink: string
  }) => void
  initialDimension?: Dimension | null
  mode?: "create" | "edit"
  onUpdateDimension?: (payload: {
    id: string
    name: string
    description: string
    category: string
    sourceLink: string
  }) => void
}

export function NewDimensionSheet({
  open,
  onOpenChange,
  onCreateDimension,
  initialDimension,
  mode = "create",
  onUpdateDimension,
}: NewDimensionSheetProps) {
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [sourceLink, setSourceLink] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const isEditMode = mode === "edit" && initialDimension && onUpdateDimension

  useEffect(() => {
    if (!open) return

    if (isEditMode && initialDimension) {
      setId(initialDimension.id)
      setName(initialDimension.name)
      setDescription(initialDimension.description)
      setCategory(initialDimension.category ?? "")
      setSourceLink(initialDimension.sourceLink ?? "")
    } else {
      setId("")
      setName("")
      setDescription("")
      setCategory("")
      setSourceLink("")
    }
    setMessage(null)
  }, [open, isEditMode, initialDimension])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedId = id.trim()
    const trimmedName = name.trim()
    if (!trimmedName || (!isEditMode && !trimmedId)) {
      setMessage("ID and name are required.")
      return
    }

    const payload = {
      id: isEditMode && initialDimension ? initialDimension.id : trimmedId,
      name: trimmedName,
      description: description.trim(),
      category: category.trim(),
      sourceLink: sourceLink.trim(),
    }

    if (isEditMode && onUpdateDimension && initialDimension) {
      onUpdateDimension(payload)
    } else {
      onCreateDimension(payload)
    }
    setMessage(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">
            {isEditMode ? "Edit dimension" : "New dimension"}
          </SheetTitle>
         </SheetHeader>
        <div className="mt-4 pb-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Dimension ID (slug)</label>
              <Input
                 className="h-8 text-xs"
                 value={id}
                 onChange={(e) => setId(e.target.value)}
                 placeholder="e.g. agency_tier"
                disabled={Boolean(isEditMode)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Name</label>
              <Input
                className="h-8 text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agency tier"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Description</label>
              <Textarea
                rows={3}
                className="text-xs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of this dimension term."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Category</label>
              <Input
                className="h-8 text-xs"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Monetization entities"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Source link</label>
              <Input
                type="url"
                className="h-8 text-xs"
                value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Button type="submit" size="sm" className="text-xs">
                Create dimension (mock)
              </Button>
              {message && <p className="text-[11px] text-zinc-600">{message}</p>}
            </div>
          </form>
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
}

function MetricSetDetailSheet({ open, onOpenChange, metricSet, metrics }: MetricSetDetailSheetProps) {
  const metricsInSet = useMemo(
    () => metrics.filter((m) => metricSet.metricSlugs.includes(m.slug)),
    [metrics, metricSet],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Metric set details</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 pb-6 text-xs">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900">{metricSet.name}</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <span>Domain: {metricSet.domain}</span>
              <span>Visibility: {metricSet.visibility}</span>
              {metricSet.updatedAt && <span>Updated: {formatDate(metricSet.updatedAt)}</span>}
            </div>
            {metricSet.description && (
              <p className="text-[11px] text-zinc-600">{metricSet.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-800">
              Metrics in this set ({metricSet.metricSlugs.length})
            </p>
            {metricsInSet.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Slug</TableHead>
                    <TableHead className="text-xs">Domain</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricsInSet.map((m) => (
                    <TableRow key={m.id} className="hover:bg-zinc-50">
                      <TableCell className="text-xs font-medium text-zinc-900">{m.businessName}</TableCell>
                      <TableCell className="font-mono text-[11px] text-zinc-500">{m.slug}</TableCell>
                      <TableCell className="text-xs text-zinc-700">{m.domain}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {m.status}
                        </Badge>
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
        </div>
      </SheetContent>
    </Sheet>
  )
}


interface CategoryManagementViewProps {
  categories: CategoryNode[]
  metrics: Metric[]
}

function CategoryManagementView({ categories, metrics }: CategoryManagementViewProps) {
  const [sourceId, setSourceId] = useState("")
  const [targetId, setTargetId] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const countMetricsInCategory = (nodes: CategoryNode[], id: string): number => {
    const root = findCategoryById(nodes, id)
    if (!root) return 0

    const countNode = (node: CategoryNode): number => {
      let total = node.metricSlugs?.length ?? 0
      if (node.children) {
        for (const child of node.children) {
          total += countNode(child)
        }
      }
      return total
    }

    return countNode(root)
  }

  const handleBulkMove = () => {
    if (!sourceId || !targetId) return
    if (sourceId === targetId) {
      setMessage("Source and target categories are the same. Nothing to move.")
      return
    }
    const movedCount = countMetricsInCategory(categories, sourceId)
    if (movedCount === 0) {
      setMessage("No metrics found under the given source category in the mock tree.")
      return
    }
    const sourceNode = findCategoryById(categories, sourceId)
    const targetNode = findCategoryById(categories, targetId)
    setMessage(
      `Mock: would move ${movedCount} metrics from "${sourceNode?.name ?? sourceId}" to "${
        targetNode?.name ?? targetId
      }". The actual tree is not mutated in this demo.`,
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Category management</CardTitle>
          <CardDescription>
            Tree-based management of metric categories with a mock bulk move operation.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Category tree</CardTitle>
            <CardDescription className="text-xs">
              Static category tree from mock JSON (Monetization &gt; Revenue &gt; SGI / QBR, Supply &gt; Creators).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryTree nodes={categories} metrics={metrics} depth={0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bulk move (mock)</CardTitle>
            <CardDescription className="text-xs">
              Simulate a bulk move of metrics from one category node to another without changing underlying data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Source category id</label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. c1-1-1 for SGI"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Target category id</label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. c1-1-2 for QBR"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              />
            </div>
            <Button type="button" size="sm" className="text-xs" onClick={handleBulkMove}>
              Simulate bulk move
            </Button>
            {message && <p className="text-[11px] text-zinc-600">{message}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface CategoryTreeProps {
  nodes: CategoryNode[]
  metrics: Metric[]
  depth: number
}

function CategoryTree({ nodes, metrics, depth }: CategoryTreeProps) {
  return (
    <ul className="space-y-1 text-xs">
      {nodes.map((node) => {
        const metricNames = (node.metricSlugs ?? []).map(
          (slug) => metrics.find((m) => m.slug === slug)?.businessName ?? slug,
        )
        return (
          <li key={node.id}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-500">{node.id}</span>
              <span className="font-semibold" style={{ marginLeft: depth * 8 }}>
                {node.name}
              </span>
              {metricNames.length > 0 && (
                <span className="text-[11px] text-zinc-500">
                  ({metricNames.length} metric{metricNames.length > 1 ? "s" : ""})
                </span>
              )}
            </div>
            {metricNames.length > 0 && (
              <div className="ml-5 text-[11px] text-zinc-600">{metricNames.join(", ")}</div>
            )}
            {node.children && node.children.length > 0 && (
              <CategoryTree nodes={node.children} metrics={metrics} depth={depth + 1} />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function findCategoryById(nodes: CategoryNode[], id: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findCategoryById(node.children, id)
      if (found) return found
    }
  }
  return undefined
}
