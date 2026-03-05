
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

import { NewMetricPayload, CategoryNode, Metric, Tenant, Dimension } from "@/types"
import { Calendar, Hash, Search, Type, Braces } from "lucide-react"

export interface MetricRegistrationViewProps {
  tenants: Tenant[]
  dimensions: Dimension[]
  onRegisterMetric: (payload: NewMetricPayload) => void
  initialMetric?: Metric
  disableFieldNameEditing?: boolean
  showLarkImport?: boolean
  defaultTenantId?: string | null
}

export function MetricRegistrationView({
  tenants,
  dimensions,
  onRegisterMetric,
  initialMetric,
  disableFieldNameEditing,
  showLarkImport = false,
  defaultTenantId,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName || !fieldName || !selectedTenantId || !selectedCategoryName) return

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
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Query binding</p>
                  <p className="text-xs text-slate-500 mt-1">Bind the metric to its query definition.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Query type</label>
                    <Select value={queryType} disabled>
                      <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-blue-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aeolus Visual Query">Aeolus Visual Query</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Source dataset</label>
                    <Input
                      placeholder="fabric_sgi_payout_daily"
                      value={querySource}
                      onChange={(e) => setQuerySource(e.target.value)}
                      className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono"
                    />
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
            <Button type="submit" className="h-9 px-6 text-xs font-medium bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 rounded-full">
              {initialMetric ? "Update Metric" : "Register Metric"}
            </Button>
            {submittedFieldName && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Metric <span className="font-mono font-bold">{submittedFieldName}</span> registered successfully!
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
