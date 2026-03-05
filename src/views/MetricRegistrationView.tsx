
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
import { mockResolveCdm, CdmFieldRecommendation } from "@/mocks/cdm"
import { mockValidateDispatch, CdmBindingItem, DispatchValidationResult } from "@/mocks/production"
import { Calendar, Hash, Search, Type, Braces } from "lucide-react"

export interface MetricRegistrationViewProps {
  tenants: Tenant[]
  dimensions: Dimension[]
  metrics: Metric[]
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

  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(
    initialMetric?.categoryPath?.[0] ?? ""
  )
  
  const [linkedDataSource, setLinkedDataSource] = useState<{ type: string; link: string } | null>(null)

  // Update available categories when tenant changes
  const currentTenant = useMemo(() => {
    return tenants.find(t => t.id === selectedTenantId)
  }, [tenants, selectedTenantId])

  const availableCategories = useMemo(() => {
    return currentTenant?.categories ?? []
  }, [currentTenant])

  useEffect(() => {
    if (initialMetric?.tenant) return
    if (defaultTenantId && !selectedTenantId) {
      setSelectedTenantId(defaultTenantId)
    }
  }, [defaultTenantId, initialMetric?.tenant, selectedTenantId])

  useEffect(() => {
    if (!currentTenant || !selectedCategoryName) return
    const exists = currentTenant.categories?.some((c) => c.name === selectedCategoryName)
    if (!exists) {
      setSelectedCategoryName("")
    }
  }, [currentTenant, selectedCategoryName])

  useEffect(() => {
    if (!selectedCategoryName || !currentTenant) {
      setLinkedDataSource(null)
      setQuerySource("")
      return
    }
    const cat = currentTenant.categories?.find(c => c.name === selectedCategoryName)
    if (cat && cat.dataSource) {
      setLinkedDataSource(cat.dataSource)
      const isOriginalCategory = initialMetric?.categoryPath?.[0] === selectedCategoryName
      if (!initialMetric || !baseQuery?.source || !isOriginalCategory) {
        setQuerySource(cat.dataSource.link ?? "")
      }
    } else {
      setLinkedDataSource(null)
      setQuerySource("")
    }
  }, [selectedCategoryName, currentTenant, initialMetric, baseQuery?.source])

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
  const [currentStep, setCurrentStep] = useState(0)
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
  const isStepFlowEnabled = !isEditMode && !showLarkImport

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
    if (!selectedCategoryName) errors.push("Category is required.")
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

  const handleUpdateBinding = (fieldName: string, updates: Partial<CdmBindingItem>) => {
    setCdmBindings((prev) =>
      prev.map((binding) =>
        binding.fieldName === fieldName
          ? {
              ...binding,
              tableName: updates.tableName ?? binding.tableName,
              isCertifiedCDM: updates.isCertifiedCDM ?? binding.isCertifiedCDM,
              notFound: updates.notFound ?? binding.notFound,
            }
          : binding,
      ),
    )
  }

  const handleNextFromDefinition = () => {
    if (!validateDefinition()) return
    setCurrentStep(1)
  }

  const handleNextFromCdm = () => {
    if (!cdmBindings.length) {
      setCdmError("Run smart analysis to generate CDM bindings.")
      return
    }
    const hasMissing = cdmBindings.some((binding) => !binding.notFound && !binding.tableName.trim())
    if (hasMissing) {
      setCdmError("Please select a table for all parsed fields or mark them as not found.")
      return
    }
    setCdmError(null)
    setCurrentStep(2)
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
            setCurrentStep(3)
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
          setCurrentStep(3)
          const payload: NewMetricPayload = {
            businessName: businessName.trim(),
            businessDefinition: businessDefinition.trim(),
            fieldName: fieldName.trim(),
            technicalDefinition: technicalDefinition.trim(),
            businessOwner: businessOwner.trim(),
            techOwner: techOwner.trim(),
            categoryPath: [selectedCategoryName],
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
    if (isStepFlowEnabled) return
    if (!validateDefinition()) return

    const payload: NewMetricPayload = {
      businessName,
      businessDefinition,
      fieldName,
      technicalDefinition,
      businessOwner,
      techOwner,
      categoryPath: [selectedCategoryName], // Flat category
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
            </div>
          )}

          {!showLarkImport && (
            <>
              {isStepFlowEnabled && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Step</span>
                    <span className="text-xs font-semibold text-slate-900">
                      {currentStep + 1} / 4
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className={currentStep === 0 ? "text-slate-900 font-semibold" : ""}>Definition</span>
                    <span>•</span>
                    <span className={currentStep === 1 ? "text-slate-900 font-semibold" : ""}>CDM binding</span>
                    <span>•</span>
                    <span className={currentStep === 2 ? "text-slate-900 font-semibold" : ""}>Production</span>
                    <span>•</span>
                    <span className={currentStep === 3 ? "text-slate-900 font-semibold" : ""}>Result</span>
                  </div>
                </div>
              )}

              {definitionErrors.length > 0 && (currentStep === 0 || !isStepFlowEnabled) && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  <div className="font-semibold text-red-800">Please resolve the following issues:</div>
                  <ul className="mt-2 space-y-1">
                    {definitionErrors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(!isStepFlowEnabled || currentStep === 0) && (
                <>
                <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Tenant & Category</p>
                  <p className="text-xs text-slate-500 mt-1">Choose tenant and category to bind the default source dataset.</p>
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
                    <Select value={selectedCategoryName} onValueChange={setSelectedCategoryName}>
                      <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.length > 0 ? (
                          availableCategories.map(c => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-[10px] text-slate-400 italic text-center">No categories for this tenant</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {linkedDataSource && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-blue-50/50 p-2 rounded border border-blue-100">
                    <Badge variant="outline" className="text-[10px] bg-white text-blue-700 border-blue-200 h-5">
                      {linkedDataSource.type}
                    </Badge>
                    <span>
                      Source dataset defaulted to{" "}
                      <a href={linkedDataSource.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {linkedDataSource.link}
                      </a>
                    </span>
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Expression (SQL)</label>
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
                  <div className="relative">
                    <Textarea
                      rows={4}
                      placeholder="e.g. SUM(payout_amount) WHERE market = 'US'"
                      value={expression}
                      onChange={(e) => setExpression(e.target.value)}
                      ref={expressionRef}
                      className="text-xs font-mono bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 min-h-[100px]"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[10px]">SQL</Badge>
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}

              {isStepFlowEnabled && currentStep === 1 && (
                <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Smart CDM recommendation</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Parse Expression to suggest CDM tables for each field.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs bg-blue-600 text-white hover:bg-blue-700"
                      onClick={handleRunCdm}
                      disabled={cdmLoading}
                    >
                      {cdmLoading ? "Analyzing..." : "Run analysis"}
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
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{binding.fieldName}</div>
                              <div className="text-[11px] text-slate-500">
                                Recommended: {binding.recommendedTableName}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${binding.isCertifiedCDM ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"}`}
                            >
                              {binding.isCertifiedCDM ? "Certified CDM" : "Non-certified"}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_140px]">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-medium text-slate-500">CDM table</label>
                              <Select
                                value={binding.tableName}
                                onValueChange={(value) =>
                                  handleUpdateBinding(binding.fieldName, {
                                    tableName: value,
                                    isCertifiedCDM: value.startsWith("cdm_"),
                                    notFound: false,
                                  })
                                }
                                disabled={binding.notFound}
                              >
                                <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                  <SelectValue placeholder="Select table" />
                                </SelectTrigger>
                                <SelectContent>
                                  {binding.candidateTableNames.map((name) => (
                                    <SelectItem key={name} value={name}>
                                      {name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant={binding.notFound ? "default" : "outline"}
                                size="sm"
                                className={`h-8 text-xs w-full ${binding.notFound ? "bg-slate-900 text-white" : ""}`}
                                onClick={() =>
                                  handleUpdateBinding(binding.fieldName, {
                                    notFound: !binding.notFound,
                                  })
                                }
                              >
                                {binding.notFound ? "Marked as not found" : "Not found"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-xs text-slate-500">
                      Run analysis to generate CDM recommendations.
                    </div>
                  )}
                </div>
              )}

              {isStepFlowEnabled && currentStep === 2 && (
                <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Production dispatch</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure target and run preflight validation before dispatch.
                    </p>
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
                          <SelectItem value="Aeolus Dataset">风神数据集</SelectItem>
                          <SelectItem value="Hive Table">Hive 表</SelectItem>
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
                      {dispatchRunning ? "Dispatching..." : "Validate & Dispatch"}
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
              )}

              {isStepFlowEnabled && currentStep === 3 && dispatchResult && (
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
                        setCurrentStep(2)
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
                          setCurrentStep(2)
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

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {isStepFlowEnabled && currentStep > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isStepFlowEnabled && (
                <Button
                  type="submit"
                  className="h-9 px-6 text-xs font-medium bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 rounded-full"
                >
                  {initialMetric ? "Update Metric" : "Register Metric"}
                </Button>
              )}
              {isStepFlowEnabled && currentStep === 0 && (
                <Button
                  type="button"
                  className="h-9 px-6 text-xs font-medium bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 rounded-full"
                  onClick={handleNextFromDefinition}
                >
                  Continue to CDM
                </Button>
              )}
              {isStepFlowEnabled && currentStep === 1 && (
                <Button
                  type="button"
                  className="h-9 px-6 text-xs font-medium bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 rounded-full"
                  onClick={handleNextFromCdm}
                >
                  Continue to Production
                </Button>
              )}
              {isStepFlowEnabled && currentStep === 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setCurrentStep(0)
                    setCdmBindings([])
                    setDispatchValidation(null)
                    setDispatchResult(null)
                    setDispatchProgress(0)
                    setDispatchSteps([])
                    setDispatchErrors([])
                  }}
                >
                  Create another metric
                </Button>
              )}
              {submittedFieldName && !isStepFlowEnabled && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Metric <span className="font-mono font-bold">{submittedFieldName}</span> registered successfully!
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
