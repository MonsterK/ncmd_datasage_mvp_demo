import { useMemo, useState, useEffect } from "react"
import "./App.css"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Database, LayoutGrid, Plus, LineChart } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { HomeView } from "@/views/HomeView"
import { MetricsWorkspaceView } from "@/views/MetricsWorkspaceView"
import { DimensionsWorkspaceView } from "@/views/DimensionsWorkspaceView"
import { ManagementWorkspaceView } from "@/views/ManagementWorkspaceView"
import { MetricProfileView } from "@/views/MetricProfileView"
import { MetricSearchView } from "@/views/MetricSearchView"
import { MetricRegistrationView } from "@/views/MetricRegistrationView"
import { MetricLineageDag } from "@/views/MetricLineageDag"
import { MetricProfileSheet } from "@/views/MetricProfileSheet"
import { DerivedMetricSheet } from "@/views/DerivedMetricSheet"
import type { ManagementSection } from "@/views/ManagementWorkspaceView"
import { useDataSage } from "@/hooks/useDataSage"
import {
  Metric,
  MetricQueryDefinition,
  NewMetricPayload,
  DerivedMetricSpec,
  CategoryNode,
  Dimension,
  Tag,
  Domain
} from "@/types"

// ---- Types ----

type TopNav = "home" | "metrics" | "dimensions" | "management"

export type AppViewsRegistry =
  | typeof HomeView
  | typeof MetricsWorkspaceView
  | typeof DimensionsWorkspaceView
  | typeof ManagementWorkspaceView
  | typeof MetricProfileView
  | typeof MetricSearchView
  | typeof MetricRegistrationView
  | typeof MetricLineageDag
  | typeof MetricProfileSheet

const INITIAL_TAGS: Tag[] = [
  { id: "tag-global", name: "Global" },
  { id: "tag-us", name: "US" },
  { id: "tag-eu", name: "EU" },
  { id: "tag-apac", name: "APAC" },
]

// ---- Helpers ----

function createFlatTrend() {
  const base = 100
  const result = []
  for (let i = 1; i <= 10; i += 1) {
    result.push({
      date: `2026-01-${String(i).padStart(2, "0")}`,
      value: base + i * 2,
    })
  }
  return result
}

// ---- App ----

function App() {
  const {
    data,
    setData,
    metricSetsState,
    setMetricSetsState,
    loading,
    error,
  } = useDataSage()

  const [tags, setTags] = useState<Tag[]>(INITIAL_TAGS)
  const [activeTopNav, setActiveTopNav] = useState<TopNav>("home")
  const [activeManagementSection, setActiveManagementSection] = useState<ManagementSection>("metric")
  const [selectedMetricSlug, setSelectedMetricSlug] = useState<string | null>(null)
  const [isMetricProfileOpen, setIsMetricProfileOpen] = useState(false)
  const [activeGlobalDomainId, setActiveGlobalDomainId] = useState<string | null>(null)
  const [isDerivedMetricSheetOpen, setIsDerivedMetricSheetOpen] = useState(false)
  const [derivedMetricBaseSlug, setDerivedMetricBaseSlug] = useState<string | null>(null)

  const uniqueDomains = useMemo(() => {
    const map = new Map<string, Domain>()
    for (const domain of data.domains) {
      if (!map.has(domain.id)) {
        map.set(domain.id, domain)
      }
    }
    return Array.from(map.values())
  }, [data.domains])

  const permittedDomains = useMemo(
    () => uniqueDomains.filter((d) => d.permitted !== false),
    [uniqueDomains],
  )

  useEffect(() => {
    if (!uniqueDomains.length) return

    setActiveGlobalDomainId((current) => {
      if (current) return current
      const fallbackId = permittedDomains[0]?.id ?? uniqueDomains[0]?.id ?? null
      return fallbackId
    })
  }, [uniqueDomains, permittedDomains])

  const selectedMetric = useMemo(
    () => data.metrics.find((m) => m.slug === selectedMetricSlug) ?? null,
    [data.metrics, selectedMetricSlug],
  )

  const derivedBaseMetric = useMemo(
    () => (derivedMetricBaseSlug ? data.metrics.find((m) => m.slug === derivedMetricBaseSlug) ?? null : null),
    [data.metrics, derivedMetricBaseSlug],
  )

  const handleOpenMetricProfile = (slug: string) => {
    setSelectedMetricSlug(slug)
    setIsMetricProfileOpen(true)
  }

  const handleOpenDerivedMetricSheet = (metric: Metric) => {
    setDerivedMetricBaseSlug(metric.slug)
    setIsDerivedMetricSheetOpen(true)
  }

  const handleRegisterMetric = (payload: NewMetricPayload) => {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()
    const newMetric: Metric = {
      id: `m-${now}`,
      businessName: payload.businessName,
      slug: payload.slug,
      categoryPath: payload.categoryPath.length ? payload.categoryPath : ["Monetization"],
      businessDefinition: payload.businessDefinition,
      technicalDefinition: payload.technicalDefinition,
      status: "Draft",
      domain: payload.categoryPath[0] ?? "Monetization",
      owners: {
        businessOwner: "TBD",
        techOwner: "TBD",
      },
      larkSheetLink: payload.larkSheetLink?.trim() || undefined,
      queryDefinitions: [
        {
          id: `q-${now}`,
          type: payload.query.type,
          source: payload.query.source,
          originField: payload.query.originField,
          aggregate: payload.query.aggregate,
          businessDate: payload.query.businessDate,
          filters: payload.query.filters,
          analysisDimensions: payload.query.analysisDimensions,
          link: payload.query.link ?? undefined,
        },
      ],
      trend30d: createFlatTrend(),
      topDimensions: [],
      boundDimensionSlugs: payload.query.analysisDimensions,
      createdAt: nowIso,
      updatedAt: nowIso,
      heat: 0,
    }

    setData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, newMetric],
    }))
  }

  const handleCreateDerivedMetric = (spec: DerivedMetricSpec) => {
    if (!derivedMetricBaseSlug) return

    const base = data.metrics.find((m) => m.slug === derivedMetricBaseSlug)
    if (!base) return

    if (data.metrics.some((m) => m.slug === spec.slug)) {
      console.warn(`[mock] Metric slug "${spec.slug}" already exists. Skipping derived metric creation.`)
      return
    }

    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    let newMetric: Metric

    if (spec.mode === "filter") {
      const baseQuery = base.queryDefinitions[0]

      const filterClauses = spec.dimensionFilters
        .map(({ dimensionSlug, values }) => {
          const tokens = values
            .split(/,|\n/)
            .map((v) => v.trim())
            .filter(Boolean)
          if (!tokens.length) return null
          return `${dimensionSlug} IN (${tokens.join(", ")})`
        })
        .filter((clause): clause is string => clause !== null)

      const mergedFilters = [...(baseQuery?.filters ?? []), ...filterClauses]

      let technicalDefinition = base.technicalDefinition
      if (filterClauses.length) {
        const hasWhere = /where/i.test(base.technicalDefinition)
        const prefix = hasWhere ? "AND" : "WHERE"
        const whereLine = `${prefix} ${filterClauses.join(" AND ")}`
        technicalDefinition = `${base.technicalDefinition}\n${whereLine}`
      }

      const newQuery: MetricQueryDefinition =
        baseQuery != null
          ? {
              ...baseQuery,
              id: `q-${now}`,
              filters: mergedFilters,
            }
          : {
              id: `q-${now}`,
              type: "Computed expression",
              source: base.slug,
              originField: base.queryDefinitions[0]?.originField ?? "",
              aggregate: base.queryDefinitions[0]?.aggregate ?? "SUM",
              businessDate: base.queryDefinitions[0]?.businessDate ?? "",
              filters: mergedFilters,
              analysisDimensions: [],
            }

      const boundDimensionSlugs = Array.from(
        new Set([...base.boundDimensionSlugs, ...spec.dimensionFilters.map((f) => f.dimensionSlug)]),
      )

      const businessDefinition = spec.description?.trim()
        ? spec.description.trim()
        : `${base.businessDefinition} (derived with filters on ${spec.dimensionFilters
            .map((f) => f.dimensionSlug)
            .join(", ")})`

      newMetric = {
        id: `m-${now}`,
        businessName: spec.businessName,
        slug: spec.slug,
        categoryPath: base.categoryPath,
        businessDefinition,
        technicalDefinition,
        status: "Draft",
        domain: base.domain,
        owners: base.owners,
        queryDefinitions: [newQuery],
        trend30d: createFlatTrend(),
        topDimensions: base.topDimensions,
        boundDimensionSlugs,
        createdAt: nowIso,
        updatedAt: nowIso,
        heat: 0,
      }
    } else {
      const other = data.metrics.find((m) => m.slug === spec.otherMetricSlug && m.domain === base.domain)
      if (!other) return

      const opSymbol =
        spec.operator === "add" ? "+" : spec.operator === "sub" ? "-" : spec.operator === "mul" ? "*" : "/"

      const coefficient =
        typeof spec.coefficient === "number" && !Number.isNaN(spec.coefficient) ? spec.coefficient : 1

      const rhs = coefficient !== 1 ? `${other.slug} * ${coefficient}` : other.slug
      const expression = `${base.slug} ${opSymbol} ${rhs}`

      const technicalDefinition = [
        "-- Derived arithmetic metric",
        `-- Base: ${base.slug}`,
        `-- Other: ${other.slug}`,
        "SELECT",
        `  ${expression} AS ${spec.slug};`,
      ].join("\n")

      const query: MetricQueryDefinition = {
        id: `q-${now}`,
        type: "Computed expression",
        source: `${base.slug},${other.slug}`,
        originField: "derived_expression",
        aggregate: "NONE",
        businessDate: base.queryDefinitions[0]?.businessDate ?? "",
        filters: [],
        analysisDimensions: [],
      }

      const businessDefinition = spec.description?.trim()
        ? spec.description.trim()
        : `Derived metric: ${base.businessName} ${opSymbol} ${other.businessName}`

      const boundDimensionSlugs = Array.from(
        new Set([...base.boundDimensionSlugs, ...other.boundDimensionSlugs]),
      )

      newMetric = {
        id: `m-${now}`,
        businessName: spec.businessName,
        slug: spec.slug,
        categoryPath: base.categoryPath,
        businessDefinition,
        technicalDefinition,
        status: "Draft",
        domain: base.domain,
        owners: base.owners,
        queryDefinitions: [query],
        trend30d: createFlatTrend(),
        topDimensions: base.topDimensions,
        boundDimensionSlugs,
        createdAt: nowIso,
        updatedAt: nowIso,
        heat: 0,
      }
    }

    setData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, newMetric],
    }))
    setIsDerivedMetricSheetOpen(false)
    setIsMetricProfileOpen(false)
    setDerivedMetricBaseSlug(null)
  }

  const handleCreateDomain = (payload: {
    id: string
    name: string
    description: string
    sourceType: string
    sourceLink: string
  }) => {
    setData((prev) => ({
      ...prev,
      domains: [
        ...prev.domains,
        {
          id: payload.id,
          name: payload.name,
          description: payload.description,
          sourceType: payload.sourceType,
          sourceLink: payload.sourceLink,
          permitted: true,
        },
      ],
    }))
  }

  const handleCreateCategory = (payload: { id: string; name: string; description: string }) => {
    const newCategory: CategoryNode = {
      id: payload.id,
      name: payload.name,
    }

    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))
  }

  const handleCreateDimension = (payload: {
    id: string
    name: string
    description: string
    category: string
    sourceLink: string
  }) => {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    const newDimension: Dimension = {
      id: payload.id,
      name: payload.name,
      slug: payload.id,
      aliases: [],
      description: payload.description,
      domain: "General",
      version: "v1",
      scope: [],
      type: "enum",
      values: [],
      boundMetricSlugs: [],
      category: payload.category,
      sourceLink: payload.sourceLink,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    setData((prev) => ({
      ...prev,
      dimensions: [...prev.dimensions, newDimension],
    }))
  }

  const handleUpdateMetric = (slug: string, payload: NewMetricPayload) => {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    setData((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => {
        if (m.slug !== slug) return m
        return {
          ...m,
          businessName: payload.businessName,
          slug: payload.slug,
          categoryPath: payload.categoryPath.length ? payload.categoryPath : ["Monetization"],
          businessDefinition: payload.businessDefinition,
          technicalDefinition: payload.technicalDefinition,
          domain: payload.categoryPath[0] ?? m.domain,
          larkSheetLink: payload.larkSheetLink?.trim() || undefined,
          queryDefinitions: [
            {
              id: m.queryDefinitions[0]?.id ?? `q-${now}`,
              type: payload.query.type,
              source: payload.query.source,
              originField: payload.query.originField,
              aggregate: payload.query.aggregate,
              businessDate: payload.query.businessDate,
              filters: payload.query.filters,
              analysisDimensions: payload.query.analysisDimensions,
              link: payload.query.link ?? undefined,
            },
          ],
          boundDimensionSlugs: payload.query.analysisDimensions,
          updatedAt: nowIso,
        }
      }),
    }))
  }

  const handleDeleteMetric = (slug: string) => {
    setData((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.slug !== slug),
      dimensions: prev.dimensions.map((d) => ({
        ...d,
        boundMetricSlugs: d.boundMetricSlugs.filter((s) => s !== slug),
      })),
    }))

    setMetricSetsState((prevSets) =>
      prevSets.map((set) => ({
        ...set,
        metricSlugs: set.metricSlugs.filter((s) => s !== slug),
      })),
    )
  }

  const handleUpdateDimension = (payload: {
    id: string
    name: string
    description: string
    category: string
    sourceLink: string
  }) => {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    setData((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((d) =>
        d.id === payload.id
          ? {
              ...d,
              name: payload.name,
              description: payload.description,
              category: payload.category,
              sourceLink: payload.sourceLink,
              updatedAt: nowIso,
            }
          : d,
      ),
    }))
  }

  const handleDeleteDimension = (id: string) => {
    setData((prev) => ({
      ...prev,
      dimensions: prev.dimensions.filter((d) => d.id !== id),
    }))
  }

  const handleChangeTopNav = (nav: TopNav) => {
    setActiveTopNav(nav)
  }

  const domainSelectValue =
    activeGlobalDomainId ?? permittedDomains[0]?.id ?? uniqueDomains[0]?.id ?? ""

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <LineChart className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-lg font-bold tracking-tight text-zinc-900 leading-none">DataSage</span>
                 <span className="text-[10px] text-zinc-500 font-medium">Unified metric semantics</span>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4 border-l border-zinc-200 pl-4">
               <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Domain</span>
               {data.domains.length > 0 && (
                  <Select value={domainSelectValue} onValueChange={(value) => setActiveGlobalDomainId(value)}>
                    <SelectTrigger className="h-8 w-[140px] border-zinc-200 bg-zinc-50/50 text-sm rounded-full">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {(permittedDomains.length ? permittedDomains : uniqueDomains).map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
            </div>
          </div>

          <nav className="flex items-center bg-zinc-100 p-1 rounded-full">
              <TopNavButton
                label="Home"
                active={activeTopNav === "home"}
                onClick={() => handleChangeTopNav("home")}
              />
              <TopNavButton
                label="Metrics/Dimensions"
                active={activeTopNav === "metrics" || activeTopNav === "dimensions"}
                onClick={() => handleChangeTopNav("metrics")}
              />
              <TopNavButton
                label="Management"
                active={activeTopNav === "management"}
                onClick={() => handleChangeTopNav("management")}
              />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-zinc-100 bg-zinc-50 shadow-none">
                <CardHeader className="h-32" />
              </Card>
             ))}
          </div>
        )}

        {!loading && error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Failed to load data</CardTitle>
              <CardDescription className="text-red-600">{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {activeTopNav === "home" && (
              <HomeView
                metrics={data.metrics}
                dimensions={data.dimensions}
                metricSets={metricSetsState}
                onNavigateTopNav={setActiveTopNav}
              />
            )}

            {activeTopNav === "metrics" && (
              <MetricsWorkspaceView
                metrics={data.metrics}
                metricSets={metricSetsState}
                domains={data.domains}
                dimensionTree={data.dimensionTree}
                dimensions={data.dimensions}
                categories={data.categories}
                tags={tags}
                activeGlobalDomainId={activeGlobalDomainId}
                onOpenMetric={handleOpenMetricProfile}
                onRegisterMetric={handleRegisterMetric}
                onMetricSetsChange={setMetricSetsState}
                onCreateDimension={handleCreateDimension}
              />
            )}

            {activeTopNav === "dimensions" && (
              <DimensionsWorkspaceView
                dimensionTree={data.dimensionTree}
                dimensions={data.dimensions}
              />
            )}

            {activeTopNav === "management" && (
              <ManagementWorkspaceView
                activeSection={activeManagementSection}
                onChangeSection={setActiveManagementSection}
                metrics={data.metrics}
                metricSets={metricSetsState}
                setMetricSets={setMetricSetsState}
                tags={tags}
                dimensions={data.dimensions}
                categories={data.categories}
                domains={data.domains}
                onOpenMetricProfile={handleOpenMetricProfile}
                onRegisterMetric={handleRegisterMetric}
                onCreateDomain={handleCreateDomain}
                onCreateCategory={handleCreateCategory}
                onCreateDimension={handleCreateDimension}
                onUpdateMetric={handleUpdateMetric}
                onDeleteMetric={handleDeleteMetric}
                onUpdateDimension={handleUpdateDimension}
                onDeleteDimension={handleDeleteDimension}
                setTags={setTags}
              />
            )}
          </div>
        )}

        {selectedMetric && (
          <MetricProfileSheet
            metric={selectedMetric}
            dimensions={data.dimensions}
            open={isMetricProfileOpen}
            onOpenChange={setIsMetricProfileOpen}
            onDeriveMetric={handleOpenDerivedMetricSheet}
          />
        )}

        {derivedBaseMetric && (
          <DerivedMetricSheet
            baseMetric={derivedBaseMetric}
            metrics={data.metrics}
            dimensions={data.dimensions}
            open={isDerivedMetricSheetOpen}
            onOpenChange={(open) => {
              setIsDerivedMetricSheetOpen(open)
              if (!open) {
                setDerivedMetricBaseSlug(null)
              }
            }}
            onCreate={handleCreateDerivedMetric}
          />
        )}
      </main>
    </div>
  )
}

// ---- Layout components ----

interface TopNavButtonProps {
  label: string
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
}

function TopNavButton({ label, active, onClick, icon }: TopNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
        active
          ? "bg-zinc-900 text-white shadow-sm"
          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
      }`}
    >
      {label}
    </button>
  )
}

export default App
