
import { useMemo, useState, useEffect, useRef } from "react"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

import { NewMetricPayload, CategoryNode, Metric, Tenant, Dimension, DispatchHistory, DispatchTargetType } from "@/types"
import { CategoryTreeSelect } from "@/components/CategoryTreeSelect"
import { mockResolveCdm, CdmFieldRecommendation } from "@/mocks/cdm"
import { mockValidateDispatch, CdmBindingItem, DispatchValidationResult } from "@/mocks/production"
import { Calendar, Hash, Search, Type, Braces, Trash2 } from "lucide-react"

export interface MetricRegistrationViewProps {
  tenants: Tenant[]
  dimensions: Dimension[]
  metrics: Metric[]
  categories: CategoryNode[]
  onRegisterMetric: (payload: NewMetricPayload) => void
  initialMetric?: Metric
  disableFieldNameEditing?: boolean
  showLarkImport?: boolean
  defaultTenantId?: string | null
  onExpressionChange?: (expression: string) => void
}

export function MetricRegistrationView({
  tenants,
  dimensions,
  metrics,
  categories,
  onRegisterMetric,
  initialMetric,
  disableFieldNameEditing,
  showLarkImport = false,
  defaultTenantId,
  onExpressionChange,
}: MetricRegistrationViewProps) {
  const baseQuery = initialMetric?.queryDefinitions?.[0]

  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    initialMetric?.tenant ?? defaultTenantId ?? (tenants.length > 0 ? tenants[0].id : "")
  )

  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>(
    initialMetric?.categoryPath ?? []
  )

  // Update available categories when tenant changes
  const currentTenant = useMemo(() => {
    return tenants.find(t => t.id === selectedTenantId)
  }, [tenants, selectedTenantId])

  const availableTopCategories = useMemo(() => {
    const permitted = currentTenant?.categories?.map((c) => c.name) ?? []
    if (permitted.length === 0) return categories
    return categories.filter((category) => permitted.includes(category.name))
  }, [categories, currentTenant])

  const selectedTopCategory = useMemo(() => {
    if (!selectedCategoryPath.length) return null
    return availableTopCategories.find((category) => category.name === selectedCategoryPath[0]) ?? null
  }, [availableTopCategories, selectedCategoryPath])

  const semanticView = selectedTopCategory?.semanticView ?? null

  useEffect(() => {
    if (initialMetric?.tenant) return
    if (defaultTenantId && !selectedTenantId) {
      setSelectedTenantId(defaultTenantId)
    }
  }, [defaultTenantId, initialMetric?.tenant, selectedTenantId])

  useEffect(() => {
    if (!selectedCategoryPath.length) return
    const exists = availableTopCategories.some((c) => c.name === selectedCategoryPath[0])
    if (!exists) {
      setSelectedCategoryPath([])
    }
  }, [availableTopCategories, selectedCategoryPath])

  useEffect(() => {
    if (!semanticView) {
      setQuerySource("")
      return
    }
    setQuerySource(semanticView.name)
  }, [semanticView])

  const [businessName, setBusinessName] = useState(initialMetric?.businessName ?? "")
  const [businessDefinition, setBusinessDefinition] = useState(initialMetric?.businessDefinition ?? "")
  const [businessOwner, setBusinessOwner] = useState(initialMetric?.owners?.businessOwner ?? "")
  const [fieldName, setFieldName] = useState(initialMetric?.fieldName ?? "")
  const [dataType, setDataType] = useState(initialMetric?.dataType ?? "decimal")
  const [unit, setUnit] = useState(initialMetric?.unit ?? "")
  const [technicalDefinition, setTechnicalDefinition] = useState(initialMetric?.technicalDefinition ?? "")
  const [techOwner, setTechOwner] = useState(initialMetric?.owners?.techOwner ?? "")
  const [larkSheetLink, setLarkSheetLink] = useState(initialMetric?.larkSheetLink ?? "")
  const [importMessage, setImportMessage] = useState<string | null>(null)

  // 3. Query Type defaults to Aeolus Visual Query, not allowed to change
  const [queryType] = useState("Aeolus Visual Query")
  const [querySource, setQuerySource] = useState(baseQuery?.source ?? "")
  const [expression, setExpression] = useState(baseQuery?.expression ?? "")
  const expressionRef = useRef<HTMLTextAreaElement | null>(null)
  const [isFieldsOpen, setIsFieldsOpen] = useState(false)
  const [fieldSearch, setFieldSearch] = useState("")
  const [fieldTab, setFieldTab] = useState("source")
  
  // 4. Business date field defaults to partition, user doesn't fill
  const [businessDate] = useState("partition")
  
  const [selectedDimensionFieldNames, setSelectedDimensionFieldNames] = useState<string[]>(
    baseQuery?.analysisDimensions ?? []
  )
  
  const [createInDatasets, setCreateInDatasets] = useState<string[]>(
    baseQuery?.relatedDatasets ?? []
  )

  const [submittedFieldName, setSubmittedFieldName] = useState<string | null>(null)
  const [definitionErrors, setDefinitionErrors] = useState<string[]>([])
  const [cdmBindings, setCdmBindings] = useState<
    Array<CdmFieldRecommendation & { tableName: string; notFound: boolean }>
  >([])
  const [cdmLoading, setCdmLoading] = useState(false)
  const [cdmError, setCdmError] = useState<string | null>(null)
  const [dispatchTargetType, setDispatchTargetType] = useState<DispatchTargetType>("Aeolus Dataset")
  const [dispatchTargetId, setDispatchTargetId] = useState("")
  const [dispatchValidation, setDispatchValidation] = useState<DispatchValidationResult | null>(null)
  const [dispatchSteps, setDispatchSteps] = useState<
    Array<{ id: string; label: string; status: "pending" | "running" | "success" | "failed" }>
  >([])
  const [dispatchProgress, setDispatchProgress] = useState(0)
  const [dispatchRunning, setDispatchRunning] = useState(false)
  const [dispatchResult, setDispatchResult] = useState<DispatchHistory | null>(null)
  const [dispatchErrors, setDispatchErrors] = useState<string[]>([])

  const dispatchFieldErrorMap = useMemo(() => {
    if (!dispatchValidation) return new Map<string, string[]>()
    const map = new Map<string, string[]>()
    dispatchValidation.errors.forEach((err) => {
      if (!err.fieldName) return
      const list = map.get(err.fieldName) ?? []
      list.push(err.message)
      map.set(err.fieldName, list)
    })
    return map
  }, [dispatchValidation])

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

  const handleInsertField = (name: string) => {
    const textarea = expressionRef.current
    const current = expression
    const start = textarea?.selectionStart ?? current.length
    const end = textarea?.selectionEnd ?? current.length
    const nextValue = `${current.slice(0, start)}${name}${current.slice(end)}`
    setExpression(nextValue)
    requestAnimationFrame(() => {
      if (!expressionRef.current) return
      const position = start + name.length
      expressionRef.current.focus()
      expressionRef.current.setSelectionRange(position, position)
    })
  }

  const fieldIconMap = {
    date: Calendar,
    number: Hash,
    string: Type,
    param: Braces,
  } as const

  const isEditMode = Boolean(initialMetric)

  useEffect(() => {
    if (!onExpressionChange) return
    onExpressionChange(expression)
  }, [expression, onExpressionChange])

  const validateDefinition = () => {
    const errors: string[] = []
    const trimmedFieldName = fieldName.trim()
    const trimmedBusinessName = businessName.trim()
    const trimmedDefinition = businessDefinition.trim()
    const trimmedExpression = expression.trim()
    const trimmedBusinessOwner = businessOwner.trim()
    const trimmedTechOwner = techOwner.trim()
    const isDuplicate =
      Boolean(trimmedFieldName) &&
      metrics.some((m) => m.fieldName === trimmedFieldName && m.fieldName !== initialMetric?.fieldName)

    if (!selectedTenantId) errors.push("Tenant is required.")
    if (!selectedCategoryPath.length) errors.push("Category is required.")
    if (!trimmedBusinessName) errors.push("Business name is required.")
    if (!trimmedDefinition) errors.push("Business definition is required.")
    if (!trimmedBusinessOwner) errors.push("Business owner is required.")
    if (!trimmedFieldName) errors.push("Field name is required.")
    if (!trimmedExpression) errors.push("Expression is required.")
    if (!trimmedTechOwner) errors.push("Tech owner is required.")
    if (isDuplicate) errors.push(`Field name "${trimmedFieldName}" already exists.`)

    setDefinitionErrors(errors)
    return errors.length === 0
  }

  const handleRunCdm = async () => {
    setCdmError(null)
    if (!expression.trim()) {
      setCdmError("Please fill Expression before running CDM analysis.")
      return
    }
    setCdmLoading(true)
    const result = await mockResolveCdm(expression)
    setCdmLoading(false)
    if (!result.length) {
      setCdmError("No fields parsed from Expression.")
      setCdmBindings([])
      return
    }
    setCdmBindings(
      result.map((item) => ({
        ...item,
        tableName: item.recommendedTableName,
        notFound: false,
      })),
    )
  }

  const handleUpdateBinding = (fieldName: string, updates: Partial<CdmBindingItem> & { recommendedTableName?: string }) => {
    setCdmBindings((prev) =>
      prev.map((binding) =>
        binding.fieldName === fieldName
          ? {
              ...binding,
              tableName: updates.tableName ?? binding.tableName,
              isCertifiedCDM: updates.isCertifiedCDM ?? binding.isCertifiedCDM,
              notFound: updates.notFound ?? binding.notFound,
              recommendedTableName: updates.recommendedTableName ?? binding.recommendedTableName,
            }
          : binding,
      ),
    )
  }

  const runDispatchSimulation = (bindings: CdmBindingItem[]) => {
    const steps =
      dispatchTargetType === "Aeolus Dataset"
        ? [
            { id: "queue", label: "Queue release request", status: "pending" as const },
            { id: "apply", label: "Create or update metric fields", status: "pending" as const },
            { id: "publish", label: "Publish dataset metadata", status: "pending" as const },
          ]
        : [
            { id: "queue", label: "Queue Dorado task", status: "pending" as const },
            { id: "build", label: "Generate or update Dorado job", status: "pending" as const },
            { id: "publish", label: "Publish Hive task", status: "pending" as const },
          ]

    setDispatchSteps(steps)
    setDispatchProgress(0)
    setDispatchRunning(true)
    setDispatchErrors([])
    const shouldFail = dispatchTargetId.toLowerCase().includes("fail")

    steps.forEach((step, index) => {
      setTimeout(() => {
        setDispatchSteps((prev) =>
          prev.map((item) =>
            item.id === step.id ? { ...item, status: "running" } : item,
          ),
        )
      }, 200 + index * 800)
      setTimeout(() => {
        setDispatchSteps((prev) =>
          prev.map((item) =>
            item.id === step.id ? { ...item, status: "success" } : item,
          ),
        )
        setDispatchProgress(Math.round(((index + 1) / steps.length) * 100))
        if (index === steps.length - 1) {
          if (shouldFail) {
            setDispatchSteps((prev) =>
              prev.map((item) =>
                item.id === step.id ? { ...item, status: "failed" } : item,
              ),
            )
            setDispatchRunning(false)
            setDispatchErrors(["Execution failed during pipeline run."])
            const nowIso = new Date().toISOString()
            setDispatchResult({
              targetType: dispatchTargetType,
              target: dispatchTargetId.trim(),
              status: "failed",
              dispatchedAt: nowIso,
              fieldCount: bindings.length,
            })
            return
          }
          setDispatchRunning(false)
          const nowIso = new Date().toISOString()
          const summary: DispatchHistory = {
            targetType: dispatchTargetType,
            target: dispatchTargetId.trim(),
            status: "success",
            dispatchedAt: nowIso,
            fieldCount: bindings.length,
          }
          setDispatchResult(summary)
          const payload: NewMetricPayload = {
            businessName: businessName.trim(),
            businessDefinition: businessDefinition.trim(),
            fieldName: fieldName.trim(),
            technicalDefinition: technicalDefinition.trim(),
            businessOwner: businessOwner.trim(),
            techOwner: techOwner.trim(),
            categoryPath: selectedCategoryPath,
            tenantId: selectedTenantId,
            larkSheetLink: larkSheetLink.trim() || undefined,
            dispatchSummary: summary,
            query: {
              type: queryType,
              source: querySource,
              expression,
              businessDate,
              analysisDimensions: selectedDimensionFieldNames,
              dataType,
              unit,
              relatedDatasets: createInDatasets,
            },
          }
          onRegisterMetric(payload)
          setSubmittedFieldName(fieldName.trim())
        }
      }, 800 + index * 800)
    })
  }

  const handleValidateAndDispatch = async () => {
    setDispatchErrors([])
    const bindings: CdmBindingItem[] = cdmBindings.map((binding) => ({
      fieldName: binding.fieldName,
      tableName: binding.notFound ? "" : binding.tableName,
      isCertifiedCDM: binding.isCertifiedCDM,
      notFound: binding.notFound,
    }))
    const result = await mockValidateDispatch({
      bindings,
      targetType: dispatchTargetType,
      targetId: dispatchTargetId,
    })
    setDispatchValidation(result)
    if (!result.ok) {
      setDispatchErrors(result.errors.map((err) => err.message))
      return
    }
    runDispatchSimulation(bindings.filter((binding) => !binding.notFound))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateDefinition()) return

    const payload: NewMetricPayload = {
      businessName,
      businessDefinition,
      fieldName,
      technicalDefinition,
      businessOwner,
      techOwner,
      categoryPath: selectedCategoryPath,
      tenantId: selectedTenantId,
      larkSheetLink: larkSheetLink.trim() || undefined,
      query: {
        type: queryType,
        source: querySource,
        expression,
        businessDate,
        analysisDimensions: selectedDimensionFieldNames,
        dataType,
        unit,
        relatedDatasets: createInDatasets,
      },
    }
    onRegisterMetric(payload)
    setSubmittedFieldName(fieldName)
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">Metric Registration</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {showLarkImport && (
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Import from LarkSheet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Paste a LarkSheet link to mock a batch import into the registration payload.
                  </p>
                </div>
                {importMessage && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {importMessage}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">LarkSheet link</label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={larkSheetLink}
                    onChange={(e) => {
                      setLarkSheetLink(e.target.value)
                      if (importMessage) setImportMessage(null)
                    }}
                    className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 shadow-sm"
                    onClick={() => {
                      const trimmed = larkSheetLink.trim()
                      if (!trimmed) {
                        setImportMessage("Paste a LarkSheet link first (mock).")
                        return
                      }
                      setImportMessage("Imported (mock)")
                    }}
                  >
                    Import
                  </Button>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Field configuration</p>
                  <p className="text-xs text-slate-500 mt-1">Configure data type, units, and analysis dimensions.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Data type</label>
                    <Select value={dataType} onValueChange={setDataType}>
                      <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-blue-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="decimal">Decimal</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="integer">Integer</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="string">String</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Unit</label>
                    <Input
                      placeholder="USD, %, etc."
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Analysis dimensions</label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-[150px] overflow-y-auto">
                    {dimensions.map((dim) => (
                      <div key={dim.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`dim-${dim.id}`}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedDimensionFieldNames.includes(dim.fieldName)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDimensionFieldNames([...selectedDimensionFieldNames, dim.fieldName])
                            } else {
                              setSelectedDimensionFieldNames(selectedDimensionFieldNames.filter(d => d !== dim.fieldName))
                            }
                          }}
                        />
                        <label htmlFor={`dim-${dim.id}`} className="text-xs text-slate-700 select-none cursor-pointer">
                          {dim.name} <span className="text-slate-400 text-[10px]">({dim.fieldName})</span>
                        </label>
                      </div>
                    ))}
                    {dimensions.length === 0 && <p className="text-xs text-slate-400 col-span-2">No dimensions available.</p>}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/50">
                  <label className="text-xs font-semibold text-slate-700">Create in datasets</label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: "dataset A", label: "Dataset A" },
                      { id: "dataset B", label: "Dataset B" },
                    ].map((dataset) => (
                      <div key={dataset.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`dataset-${dataset.id}`}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={createInDatasets.includes(dataset.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateInDatasets([...createInDatasets, dataset.id])
                            } else {
                              setCreateInDatasets(createInDatasets.filter(d => d !== dataset.id))
                            }
                          }}
                        />
                        <label htmlFor={`dataset-${dataset.id}`} className="text-xs text-slate-700 select-none cursor-pointer">
                          {dataset.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showLarkImport && (
            <>
              {definitionErrors.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  <div className="font-semibold text-red-800">Please resolve the following issues:</div>
                  <ul className="mt-2 space-y-1">
                    {definitionErrors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Tenant & Category</p>
                  <p className="text-xs text-slate-500 mt-1">Choose tenant and category path (up to 3 levels).</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500">Tenant</label>
                    <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                      <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                {semanticView && (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Semantic View</span>
                      <Badge variant="outline" className="text-[10px] bg-white text-blue-700 border-blue-200 h-5">
                        {semanticView.name}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {semanticView.hiveTables.map((table) => (
                        <span key={table} className="px-2 py-0.5 rounded-full border border-slate-200 bg-white text-[10px]">
                          {table}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Business information</p>
                  <p className="text-xs text-slate-500 mt-1">Describe the metric in business terms.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Business name</label>
                    <Input
                      placeholder="e.g. Auto Ads Revenue"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Business owner</label>
                    <Input
                      placeholder="Owner name"
                      value={businessOwner}
                      onChange={(e) => setBusinessOwner(e.target.value)}
                      className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Business definition</label>
                  <Textarea
                    rows={3}
                    placeholder="Describe what this metric means, how it is used and basic calculation rules in business language."
                    value={businessDefinition}
                    onChange={(e) => setBusinessDefinition(e.target.value)}
                    className="text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 min-h-[80px]"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Technical information</p>
                  <p className="text-xs text-slate-500 mt-1">Define the technical metadata for the metric.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Field name</label>
                    <Input
                      placeholder="e.g. auto_ads_revenue"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      disabled={Boolean(disableFieldNameEditing)}
                      className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Tech owner</label>
                    <Input
                      placeholder="Owner name"
                      value={techOwner}
                      onChange={(e) => setTechOwner(e.target.value)}
                      className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tech definition (SQL)</label>
                  <div className="relative">
                    <Textarea
                      rows={5}
                      placeholder="e.g. CASE WHEN l3_product_tag='Auto Ads' THEN dollar_revenue_real ELSE 0 END"
                      value={technicalDefinition}
                      onChange={(e) => setTechnicalDefinition(e.target.value)}
                      className="text-xs font-mono bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 min-h-[120px]"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[10px]">SQL</Badge>
                    </div>
                  </div>
                </div>
                <div className="hidden">
                  <label className="text-xs font-semibold text-slate-700">Expression (SQL)</label>
                  {/* Expression module hidden */}
                  <Textarea
                    rows={4}
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    ref={expressionRef}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Source Info</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Map fields to source CDM tables.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs bg-blue-600 text-white hover:bg-blue-700"
                      onClick={handleRunCdm}
                      disabled={cdmLoading}
                    >
                      {cdmLoading ? "Analyzing..." : "Refresh Source Info"}
                    </Button>
                  </div>
                  {cdmError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {cdmError}
                    </div>
                  )}
                  {cdmBindings.length > 0 ? (
                    <div className="space-y-3">
                      {cdmBindings.map((binding) => (
                        <div
                          key={binding.fieldName}
                          className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-900">Field: {binding.fieldName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">Source Table:</span>
                                <Input
                                  value={binding.recommendedTableName}
                                  onChange={(e) => handleUpdateBinding(binding.fieldName, { recommendedTableName: e.target.value })}
                                  className="h-7 text-xs bg-white border-slate-200 w-[200px]"
                                />
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${binding.isCertifiedCDM ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"}`}
                            >
                              {binding.isCertifiedCDM ? "Certified CDM" : "Non-certified"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                      No source info available.
                    </div>
                  )}
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Delivery Scenario</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Configure target and run preflight validation before delivery.
                        </p>
                      </div>
                      {(dispatchTargetId || dispatchValidation) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            setDispatchTargetId("")
                            setDispatchValidation(null)
                            setDispatchResult(null)
                            setDispatchErrors([])
                            setDispatchSteps([])
                          }}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete Scenario
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Target type</label>
                      <Select
                        value={dispatchTargetType}
                        onValueChange={(value: DispatchTargetType) => setDispatchTargetType(value)}
                      >
                        <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aeolus Dataset">Aeolus Dataset</SelectItem>
                          <SelectItem value="Hive Table">Hive Table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        {dispatchTargetType === "Aeolus Dataset" ? "Dataset ID / Link" : "Hive db.table"}
                      </label>
                      <Input
                        placeholder={dispatchTargetType === "Aeolus Dataset" ? "dataset_123 or https://..." : "db.table"}
                        value={dispatchTargetId}
                        onChange={(e) => setDispatchTargetId(e.target.value)}
                        className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      className="h-9 text-xs bg-blue-600 text-white hover:bg-blue-700"
                      onClick={handleValidateAndDispatch}
                      disabled={dispatchRunning}
                    >
                      {dispatchRunning ? "Delivering..." : "Validate & Deliver"}
                    </Button>
                    {dispatchValidation && dispatchValidation.ok && (
                      <span className="text-xs text-emerald-600">Validation passed</span>
                    )}
                  </div>
                  {dispatchErrors.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 space-y-1">
                      {dispatchErrors.map((err) => (
                        <div key={err}>{err}</div>
                      ))}
                    </div>
                  )}
                  {dispatchValidation && dispatchValidation.errors.length > 0 && (
                    <div className="space-y-2">
                      {cdmBindings.map((binding) => (
                        <div
                          key={binding.fieldName}
                          className={`rounded-xl border px-3 py-2 text-xs ${
                            dispatchFieldErrorMap.has(binding.fieldName)
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-slate-200 bg-slate-50/40 text-slate-600"
                          }`}
                        >
                          <div className="font-semibold">{binding.fieldName}</div>
                          {dispatchFieldErrorMap.get(binding.fieldName)?.map((msg) => (
                            <div key={msg}>{msg}</div>
                          ))}
                        </div>
                      ))}
                      {dispatchValidation.errors.some((err) => !err.fieldName) && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          Target configuration needs attention.
                        </div>
                      )}
                    </div>
                  )}
                  {dispatchRunning && (
                    <div className="space-y-3">
                      <Progress value={dispatchProgress} />
                      <div className="space-y-2">
                        {dispatchSteps.map((step) => (
                          <div key={step.id} className="flex items-center justify-between text-xs text-slate-600">
                            <span>{step.label}</span>
                            <span
                              className={
                                step.status === "success"
                                  ? "text-emerald-600"
                                  : step.status === "running"
                                  ? "text-blue-600"
                                  : "text-slate-400"
                              }
                            >
                              {step.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              {dispatchResult && (
                <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Dispatch result</p>
                      <p className="text-xs text-slate-500 mt-1">Summary of the production release.</p>
                    </div>
                    <Badge
                      className={
                        dispatchResult.status === "success"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }
                      variant="outline"
                    >
                      {dispatchResult.status === "success" ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-500">Target</span>
                      <div className="font-semibold text-slate-900">{dispatchResult.target}</div>
                      <div className="text-[11px] text-slate-500">{dispatchResult.targetType}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500">Fields</span>
                      <div className="font-semibold text-slate-900">{dispatchResult.fieldCount}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(dispatchResult.dispatchedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {dispatchResult.status === "failed" && dispatchErrors.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {dispatchErrors.map((err) => (
                        <div key={err}>{err}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setDispatchResult(null)
                        setDispatchSteps([])
                        setDispatchProgress(0)
                        setDispatchErrors([])
                      }}
                    >
                      Modify configuration
                    </Button>
                    {dispatchResult.status === "failed" && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => {
                          setDispatchResult(null)
                          setDispatchSteps([])
                          setDispatchProgress(0)
                          setDispatchErrors([])
                        }}
                      >
                        Retry dispatch
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div></div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                className="h-9 px-6 text-xs font-medium bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 rounded-full"
              >
                {initialMetric ? "Update Metric" : "Register Metric"}
              </Button>
              {submittedFieldName && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Metric <span className="font-mono font-bold">{submittedFieldName}</span> registered successfully!
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>

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
                          handleInsertField(field.name)
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
                          handleInsertField(field.name)
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
                          handleInsertField(`:${field.name}`)
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
    </Card>
  )
}
