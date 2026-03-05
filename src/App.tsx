
import { useMemo, useState, useEffect } from "react"
import "./App.css"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { WorkspaceChatView } from "@/views/WorkspaceChatView"
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
  Tenant
} from "@/types"

// ---- Types ----

type AppTopNav = "home" | "metrics" | "dimensions" | "workspace" | "management"

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
  const [activeTopNav, setActiveTopNav] = useState<AppTopNav>("home")
  const [activeManagementSection, setActiveManagementSection] = useState<ManagementSection>("metric")
  const [selectedMetricFieldName, setSelectedMetricFieldName] = useState<string | null>(null)
  const [isMetricProfileOpen, setIsMetricProfileOpen] = useState(false)
  const [activeGlobalTenantId, setActiveGlobalTenantId] = useState<string | null>(null)
  const [isDerivedMetricSheetOpen, setIsDerivedMetricSheetOpen] = useState(false)
  const [derivedMetricBaseFieldName, setDerivedMetricBaseFieldName] = useState<string | null>(null)
  const [favoriteMetricFieldNames, setFavoriteMetricFieldNames] = useState<string[]>([])
  const [recentMetricFieldNames, setRecentMetricFieldNames] = useState<string[]>([])

  const uniqueTenants = useMemo(() => {
    const map = new Map<string, Tenant>()
    for (const tenant of data.tenants) {
      if (!map.has(tenant.id)) {
        map.set(tenant.id, tenant)
      }
    }
    return Array.from(map.values())
  }, [data.tenants])

  const permittedTenants = useMemo(
    () => uniqueTenants.filter((d) => d.permitted !== false),
    [uniqueTenants],
  )

  useEffect(() => {
    if (!uniqueTenants.length) return

    setActiveGlobalTenantId((current) => {
      if (current) return current
      const fallbackId = permittedTenants[0]?.id ?? uniqueTenants[0]?.id ?? null
      return fallbackId
    })
  }, [uniqueTenants, permittedTenants])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedFavorites = window.localStorage.getItem("datasage.favoriteMetrics")
    const storedRecent = window.localStorage.getItem("datasage.recentMetrics")
    if (storedFavorites) {
      try {
        const parsed = JSON.parse(storedFavorites)
        if (Array.isArray(parsed)) {
          setFavoriteMetricFieldNames(parsed.filter((v) => typeof v === "string"))
        }
      } catch {
        setFavoriteMetricFieldNames([])
      }
    }
    if (storedRecent) {
      try {
        const parsed = JSON.parse(storedRecent)
        if (Array.isArray(parsed)) {
          setRecentMetricFieldNames(parsed.filter((v) => typeof v === "string"))
        }
      } catch {
        setRecentMetricFieldNames([])
      }
    }
  }, [])

  useEffect(() => {
    setFavoriteMetricFieldNames((prev) => prev.filter((fieldName) => data.metrics.some((m) => m.fieldName === fieldName)))
    setRecentMetricFieldNames((prev) => prev.filter((fieldName) => data.metrics.some((m) => m.fieldName === fieldName)))
  }, [data.metrics])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("datasage.favoriteMetrics", JSON.stringify(favoriteMetricFieldNames))
  }, [favoriteMetricFieldNames])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("datasage.recentMetrics", JSON.stringify(recentMetricFieldNames))
  }, [recentMetricFieldNames])

  const selectedMetric = useMemo(
    () => data.metrics.find((m) => m.fieldName === selectedMetricFieldName) ?? null,
    [data.metrics, selectedMetricFieldName],
  )

  const favoriteMetrics = useMemo(
    () =>
      favoriteMetricFieldNames
        .map((fieldName) => data.metrics.find((m) => m.fieldName === fieldName))
        .filter((m): m is Metric => Boolean(m)),
    [data.metrics, favoriteMetricFieldNames],
  )

  const recentMetrics = useMemo(
    () =>
      recentMetricFieldNames
        .map((fieldName) => data.metrics.find((m) => m.fieldName === fieldName))
        .filter((m): m is Metric => Boolean(m)),
    [data.metrics, recentMetricFieldNames],
  )

  const derivedBaseMetric = useMemo(
    () => (derivedMetricBaseFieldName ? data.metrics.find((m) => m.fieldName === derivedMetricBaseFieldName) ?? null : null),
    [data.metrics, derivedMetricBaseFieldName],
  )

  const handleOpenMetricProfile = (fieldName: string) => {
    setSelectedMetricFieldName(fieldName)
    setRecentMetricFieldNames((prev) => {
      const next = [fieldName, ...prev.filter((name) => name !== fieldName)]
      return next.slice(0, 6)
    })
    setIsMetricProfileOpen(true)
  }

  const handleToggleFavoriteMetric = (fieldName: string) => {
    setFavoriteMetricFieldNames((prev) => {
      if (prev.includes(fieldName)) {
        return prev.filter((name) => name !== fieldName)
      }
      return [fieldName, ...prev]
    })
  }

  const handleOpenDerivedMetricSheet = (metric: Metric) => {
    setDerivedMetricBaseFieldName(metric.fieldName)
    setIsDerivedMetricSheetOpen(true)
  }

  const handleRegisterMetric = (payload: NewMetricPayload) => {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()
    const dispatchHistory = payload.dispatchSummary ? [payload.dispatchSummary] : []
    const newMetric: Metric = {
      id: `m-${now}`,
      businessName: payload.businessName,
      fieldName: payload.fieldName,
      categoryPath: payload.categoryPath.length ? payload.categoryPath : ["performance"],
      businessDefinition: payload.businessDefinition,
      technicalDefinition: payload.technicalDefinition,
      status: "Offline",
      tenant: payload.tenantId ?? payload.categoryPath[0] ?? "M10N Data",
      dataType: payload.query.dataType,
      unit: payload.query.unit,
      owners: {
        businessOwner: payload.businessOwner?.trim() || "TBD",
        techOwner: payload.techOwner?.trim() || "TBD",
      },
      larkSheetLink: payload.larkSheetLink?.trim() || undefined,
      queryDefinitions: [
        {
          id: `q-${now}`,
          type: payload.query.type,
          source: payload.query.source,
          expression: payload.query.expression,
          businessDate: payload.query.businessDate,
          analysisDimensions: payload.query.analysisDimensions,
          createInDownstream: payload.query.createInDownstream,
          relatedDatasets: payload.query.relatedDatasets,
        },
      ],
      trend30d: createFlatTrend(),
      topDimensions: [],
      boundDimensionFieldNames: payload.query.analysisDimensions,
      createdAt: nowIso,
      updatedAt: nowIso,
      heat: 0,
      dispatchHistory,
      lastDispatchAt: payload.dispatchSummary?.dispatchedAt,
      history: [
        {
          version: "v1",
          editor: "Current User",
          timestamp: nowIso,
          action: "create",
          comment: "Initial registration via UI",
        },
      ],
    }

    setData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, newMetric],
    }))
  }

  const handleCreateDerivedMetric = (spec: DerivedMetricSpec) => {
    if (!derivedMetricBaseFieldName) return

    const base = data.metrics.find((m) => m.fieldName === derivedMetricBaseFieldName)
    if (!base) return

    if (data.metrics.some((m) => m.fieldName === spec.fieldName)) {
      console.warn(`[mock] Metric fieldName "${spec.fieldName}" already exists. Skipping derived metric creation.`)
      return
    }

    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    let newMetric: Metric

    if (spec.mode === "filter") {
      const baseQuery = base.queryDefinitions[0]

      const filterClauses = spec.dimensionFilters
        .map(({ dimensionFieldName, values }) => {
          const tokens = values
            .split(/,|\n/)
            .map((v) => v.trim())
            .filter(Boolean)
          if (!tokens.length) return null
          return `${dimensionFieldName} IN (${tokens.join(", ")})`
        })
        .filter((clause): clause is string => clause !== null)

      const mergedFilters = [...filterClauses]
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
              // Note: filters were removed from MetricQueryDefinition
              // If we need to support filters for derived metrics, we might need to update the type or handle it differently
              // For now, we'll append the filter condition to the technical definition
              expression: baseQuery.expression || `SUM(${base.fieldName})`,
            }
          : {
              id: `q-${now}`,
              type: "Computed expression",
              source: base.fieldName,
              expression: `SUM(${base.queryDefinitions[0]?.expression ?? ""})`, // Basic fallback
              businessDate: base.queryDefinitions[0]?.businessDate ?? "",
              analysisDimensions: [],
            }

      const boundDimensionFieldNames = Array.from(
        new Set([...base.boundDimensionFieldNames, ...spec.dimensionFilters.map((f) => f.dimensionFieldName)]),
      )

      const businessDefinition = spec.description?.trim()
        ? spec.description.trim()
        : `${base.businessDefinition} (derived with filters on ${spec.dimensionFilters
            .map((f) => f.dimensionFieldName)
            .join(", ")})`

      newMetric = {
        id: `m-${now}`,
        businessName: spec.businessName,
        fieldName: spec.fieldName,
        categoryPath: base.categoryPath,
        businessDefinition,
        technicalDefinition,
        status: "Offline",
        tenant: base.tenant,
        owners: base.owners,
        queryDefinitions: [newQuery],
        trend30d: createFlatTrend(),
        topDimensions: base.topDimensions,
        boundDimensionFieldNames,
        createdAt: nowIso,
        updatedAt: nowIso,
        heat: 0,
        history: [
          {
            version: "v1",
            editor: "Current User",
            timestamp: nowIso,
            action: "create",
            comment: "Derived metric creation",
          },
        ],
      }
    } else {
      const other = data.metrics.find((m) => m.fieldName === spec.otherMetricFieldName && m.tenant === base.tenant)
      if (!other) return

      const opSymbol =
        spec.operator === "add" ? "+" : spec.operator === "sub" ? "-" : spec.operator === "mul" ? "*" : "/"

      const coefficient =
        typeof spec.coefficient === "number" && !Number.isNaN(spec.coefficient) ? spec.coefficient : 1

      const rhs = coefficient !== 1 ? `${other.fieldName} * ${coefficient}` : other.fieldName
      const expression = `${base.fieldName} ${opSymbol} ${rhs}`

      const technicalDefinition = [
        "-- Derived arithmetic metric",
        `-- Base: ${base.fieldName}`,
        `-- Other: ${other.fieldName}`,
        "SELECT",
        `  ${expression} AS ${spec.fieldName};`,
      ].join("\n")

      const query: MetricQueryDefinition = {
        id: `q-${now}`,
        type: "Computed expression",
        source: `${base.fieldName},${other.fieldName}`,
        expression: "derived_expression",
        businessDate: base.queryDefinitions[0]?.businessDate ?? "",
        analysisDimensions: [],
      }

      const businessDefinition = spec.description?.trim()
        ? spec.description.trim()
        : `Derived metric: ${base.businessName} ${opSymbol} ${other.businessName}`

      const boundDimensionFieldNames = Array.from(
        new Set([...base.boundDimensionFieldNames, ...other.boundDimensionFieldNames]),
      )

      newMetric = {
        id: `m-${now}`,
        businessName: spec.businessName,
        fieldName: spec.fieldName,
        categoryPath: base.categoryPath,
        businessDefinition,
        technicalDefinition,
        status: "Offline",
        tenant: base.tenant,
        owners: base.owners,
        queryDefinitions: [query],
        trend30d: createFlatTrend(),
        topDimensions: base.topDimensions,
        boundDimensionFieldNames,
        createdAt: nowIso,
        updatedAt: nowIso,
        heat: 0,
        history: [
          {
            version: "v1",
            editor: "Current User",
            timestamp: nowIso,
            action: "create",
            comment: "Derived metric creation",
          },
        ],
      }
    }

    setData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, newMetric],
    }))
    setIsDerivedMetricSheetOpen(false)
    setIsMetricProfileOpen(false)
    setDerivedMetricBaseFieldName(null)
  }

  const handleCreateTenant = (payload: {
    id: string
    name: string
    description: string
    categories: {
      name: string
    }[]
  }) => {
    setData((prev) => ({
      ...prev,
      tenants: [
        ...prev.tenants,
        {
          id: payload.id,
          name: payload.name,
          description: payload.description,
          permitted: true,
        categories: payload.categories.map((c) => ({
          name: c.name,
        })),
        },
      ],
    }))
  }

  const handleUpdateTenant = (tenant: Tenant) => {
    setData((prev) => ({
      ...prev,
      tenants: prev.tenants.map((t) => (t.id === tenant.id ? tenant : t)),
    }))
  }

  const handleCreateCategory = (payload: { id: string; name: string; description: string; parentId?: string }) => {
    const newCategory: CategoryNode = {
      id: payload.id,
      name: payload.name,
      description: payload.description,
      children: [],
    }

    if (payload.parentId) {
      setData((prev) => {
        const updateCategories = (categories: CategoryNode[]): CategoryNode[] => {
          return categories.map((cat) => {
            if (cat.id === payload.parentId) {
              return {
                ...cat,
                children: [...(cat.children || []), newCategory],
              }
            }
            if (cat.children) {
              return {
                ...cat,
                children: updateCategories(cat.children),
              }
            }
            return cat
          })
        }
        return {
          ...prev,
          categories: updateCategories(prev.categories),
        }
      })
    } else {
      setData((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory],
      }))
    }
  }

  const handleUpdateCategory = (payload: {
    id: string
    semanticView?: { name: string; hiveTables: string[] }
    name?: string
    description?: string
  }) => {
    setData((prev) => {
      const updateCategories = (categories: CategoryNode[]): CategoryNode[] => {
        return categories.map((cat) => {
          if (cat.id === payload.id) {
            return {
              ...cat,
              ...(payload.semanticView ? { semanticView: payload.semanticView } : {}),
              ...(payload.name ? { name: payload.name } : {}),
              ...(payload.description ? { description: payload.description } : {}),
            }
          }
          if (cat.children) {
            return {
              ...cat,
              children: updateCategories(cat.children),
            }
          }
          return cat
        })
      }
      return {
        ...prev,
        categories: updateCategories(prev.categories),
      }
    })
  }

  const handleDeleteCategory = (id: string) => {
    setData((prev) => {
      const deleteCategory = (categories: CategoryNode[]): CategoryNode[] => {
        return categories
          .filter((cat) => cat.id !== id)
          .map((cat) => {
            if (cat.children) {
              return {
                ...cat,
                children: deleteCategory(cat.children),
              }
            }
            return cat
          })
      }
      return {
        ...prev,
        categories: deleteCategory(prev.categories),
      }
    })
  }

  const handleCreateDimension = (payload: {
    fieldName: string
    businessName: string
    businessOwner: string
    techOwner: string
    technicalDefinition: string
    description: string
    category: string
    categoryPath: string[]
    tenantId: string
    sourceLink: string
    sourceDimensionField: string
    values: { code: string; label: string }[]
  }) => {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    const newDimension: Dimension = {
      id: payload.fieldName,
      name: payload.businessName,
      fieldName: payload.fieldName,
      aliases: [],
      description: payload.description,
      tenant: payload.tenantId || "M10N Data",
      version: "v1",
      scope: [],
      type: "enum",
      values: payload.values ?? [],
      boundMetricFieldNames: [],
      owners: {
        businessOwner: payload.businessOwner || "TBD",
        techOwner: payload.techOwner || "TBD",
      },
      technicalDefinition: payload.technicalDefinition,
      category: payload.category,
      categoryPath: payload.categoryPath,
      sourceLink: payload.sourceLink,
      sourceDimensionField: payload.sourceDimensionField,
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [
        {
          version: "v1",
          editor: "Current User",
          timestamp: nowIso,
          action: "create",
          comment: "Initial creation via UI",
        },
      ],
    }

    setData((prev) => ({
      ...prev,
      dimensions: [...prev.dimensions, newDimension],
    }))
  }

  const handleUpdateMetric = (fieldName: string, payload: NewMetricPayload) => {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    setData((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => {
        if (m.fieldName !== fieldName) return m
        const nextDispatchHistory = payload.dispatchSummary
          ? [...(m.dispatchHistory ?? []), payload.dispatchSummary]
          : m.dispatchHistory
        return {
          ...m,
          businessName: payload.businessName,
          fieldName: payload.fieldName,
          categoryPath: payload.categoryPath.length ? payload.categoryPath : ["performance"],
          businessDefinition: payload.businessDefinition,
          technicalDefinition: payload.technicalDefinition,
          tenant: payload.tenantId ?? payload.categoryPath[0] ?? m.tenant,
          owners: {
            businessOwner: payload.businessOwner?.trim() || m.owners.businessOwner,
            techOwner: payload.techOwner?.trim() || m.owners.techOwner,
          },
          larkSheetLink: payload.larkSheetLink?.trim() || undefined,
          dataType: payload.query.dataType,
          unit: payload.query.unit,
          queryDefinitions: [
            {
              id: m.queryDefinitions[0]?.id ?? `q-${now}`,
              type: payload.query.type,
              source: payload.query.source,
              expression: payload.query.expression,
              businessDate: payload.query.businessDate,
              analysisDimensions: payload.query.analysisDimensions,
              createInDownstream: payload.query.createInDownstream,
              relatedDatasets: payload.query.relatedDatasets,
            },
          ],
          boundDimensionFieldNames: payload.query.analysisDimensions,
          dispatchHistory: nextDispatchHistory,
          lastDispatchAt: payload.dispatchSummary?.dispatchedAt ?? m.lastDispatchAt,
          updatedAt: nowIso,
          history: [
            ...(m.history ?? []),
            {
              version: `v${(m.history?.length ?? 0) + 1}`,
              editor: "Current User",
              timestamp: nowIso,
              action: "update",
              comment: "Update via UI",
            },
          ],
        }
      }),
    }))
  }

  const handleDeleteMetric = (fieldName: string) => {
    setData((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.fieldName !== fieldName),
      dimensions: prev.dimensions.map((d) => ({
        ...d,
        boundMetricFieldNames: d.boundMetricFieldNames.filter((s) => s !== fieldName),
      })),
    }))

    setMetricSetsState((prevSets) =>
      prevSets.map((set) => ({
        ...set,
        metricRefs: set.metricRefs.filter((ref) => ref.fieldName !== fieldName),
        metricFieldNames: set.metricFieldNames ? set.metricFieldNames.filter((s) => s !== fieldName) : [],
      })),
    )
  }

  const handleUpdateDimension = (payload: {
    id: string
    businessName: string
    businessOwner: string
    techOwner: string
    technicalDefinition: string
    description: string
    category: string
    categoryPath: string[]
    tenantId: string
    sourceLink: string
    sourceDimensionField: string
    values: { code: string; label: string }[]
  }) => {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    setData((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((d) =>
        d.id === payload.id
          ? {
              ...d,
              name: payload.businessName,
              description: payload.description,
              technicalDefinition: payload.technicalDefinition,
              category: payload.category,
              categoryPath: payload.categoryPath,
              tenant: payload.tenantId || d.tenant,
              sourceLink: payload.sourceLink,
              sourceDimensionField: payload.sourceDimensionField,
              values: payload.values ?? d.values,
              owners: {
                businessOwner: payload.businessOwner || d.owners?.businessOwner || "TBD",
                techOwner: payload.techOwner || d.owners?.techOwner || "TBD",
              },
              updatedAt: nowIso,
              history: [
                ...(d.history ?? []),
                {
                  version: `v${(d.history?.length ?? 0) + 1}`,
                  editor: "Current User",
                  timestamp: nowIso,
                  action: "update",
                  comment: "Update via UI",
                },
              ],
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

  const handleChangeTopNav = (nav: AppTopNav) => {
    setActiveTopNav(nav)
  }

  const tenantSelectValue =
    activeGlobalTenantId ?? permittedTenants[0]?.id ?? uniqueTenants[0]?.id ?? ""
  const isWorkspace = activeTopNav === "workspace"

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header
        className={`sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 shadow-sm ${
          isWorkspace ? "hidden" : ""
        }`}
      >
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200/50 ring-1 ring-blue-500/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">DataSage</span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wide">Unified Metric Semantics</span>
                </div>
              </div>

              <div className="hidden">
                {/* Tenant selection hidden */}
              </div>
            </div>

            <nav className="flex items-center bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60">
              <TopNavButton
                label="Home"
                active={activeTopNav === "home"}
                onClick={() => handleChangeTopNav("home")}
              />
              <TopNavButton
                label="Metrics & Dimensions"
                active={activeTopNav === "metrics" || activeTopNav === "dimensions"}
                onClick={() => handleChangeTopNav("metrics")}
              />
              <TopNavButton
                label="Workspace"
                active={activeTopNav === "workspace"}
                onClick={() => handleChangeTopNav("workspace")}
              />
              <TopNavButton
                label="Management"
                active={activeTopNav === "management"}
                onClick={() => handleChangeTopNav("management")}
              />
            </nav>
          </div>
        </header>

      {isWorkspace ? (
        <div className="fixed inset-0 bg-slate-50">
          <WorkspaceChatView
            metrics={data.metrics}
            tenants={data.tenants}
            categories={data.categories}
            onBack={() => setActiveTopNav("home")}
            fullScreen
          />
        </div>
      ) : (
        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
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
                favoriteMetrics={favoriteMetrics}
                recentMetrics={recentMetrics}
                onNavigateTopNav={setActiveTopNav}
                onOpenMetric={handleOpenMetricProfile}
              />
            )}

            {activeTopNav === "metrics" && (
              <MetricsWorkspaceView
                metrics={data.metrics}
                metricSets={metricSetsState}
                tenants={data.tenants}
                dimensionTree={data.dimensionTree}
                dimensions={data.dimensions}
                categories={data.categories}
                tags={tags}
                activeGlobalTenantId={activeGlobalTenantId}
                onOpenMetric={handleOpenMetricProfile}
                onRegisterMetric={handleRegisterMetric}
                onMetricSetsChange={setMetricSetsState}
                onCreateDimension={handleCreateDimension}
                favoriteMetricFieldNames={favoriteMetricFieldNames}
                onToggleFavoriteMetric={handleToggleFavoriteMetric}
                onNavigateWorkspace={() => setActiveTopNav("workspace")}
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
                tenants={data.tenants}
                activeTenantId={activeGlobalTenantId}
                onOpenMetricProfile={handleOpenMetricProfile}
                onRegisterMetric={handleRegisterMetric}
                onCreateTenant={handleCreateTenant}
                onUpdateTenant={handleUpdateTenant}
                onCreateCategory={handleCreateCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onCreateDimension={handleCreateDimension}
                onUpdateMetric={handleUpdateMetric}
                onDeleteMetric={handleDeleteMetric}
                onUpdateDimension={handleUpdateDimension}
                onDeleteDimension={handleDeleteDimension}
                setTags={setTags}
                onNavigateWorkspace={() => setActiveTopNav("workspace")}
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
            isFavorite={favoriteMetricFieldNames.includes(selectedMetric.fieldName)}
            onToggleFavorite={handleToggleFavoriteMetric}
            onNavigateWorkspace={() => setActiveTopNav("workspace")}
          />
        )}
      </main>
      )}
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
      className={`relative px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
        active
          ? "bg-white text-blue-600 shadow-sm shadow-blue-100 ring-1 ring-blue-100"
          : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
      }`}
    >
      {label}
    </button>
  )
}

export default App
