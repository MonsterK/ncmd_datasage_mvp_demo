
import { useMemo, useState, useEffect } from "react"

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

import { NewMetricPayload, CategoryNode, Metric, Tenant, Dimension } from "@/types"

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
  
  // 4. Business date field defaults to partition, user doesn't fill
  const [businessDate] = useState("partition")
  
  const [selectedDimensionFieldNames, setSelectedDimensionFieldNames] = useState<string[]>(
    baseQuery?.analysisDimensions ?? []
  )
  
  const [createInDownstream, setCreateInDownstream] = useState<string[]>(
    baseQuery?.createInDownstream ?? []
  )

  const [submittedFieldName, setSubmittedFieldName] = useState<string | null>(null)

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
        createInDownstream,
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
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
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
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
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
                        <SelectValue placeholder="Select category" />
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

              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Business information</p>
                  <p className="text-xs text-slate-500 mt-1">Describe the metric in business terms.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Business name</label>
                    <Input
                      placeholder="SGI Payout"
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

              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Technical information</p>
                  <p className="text-xs text-slate-500 mt-1">Define the technical metadata for the metric.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Field name</label>
                    <Input
                      placeholder="sgi_payout"
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

              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
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
                    <div className="flex gap-2">
                      <Input
                        placeholder="fabric_sgi_payout_daily"
                        value={querySource}
                        onChange={(e) => setQuerySource(e.target.value)}
                        className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 px-3 text-xs border-slate-200 hover:bg-slate-50"
                        onClick={() => alert("Reference existing fields in dataset (Mock)")}
                      >
                        Fields
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Expression (SQL)</label>
                  <div className="relative">
                    <Textarea
                      rows={4}
                      placeholder="e.g. SUM(payout_amount) WHERE market = 'US'"
                      value={expression}
                      onChange={(e) => setExpression(e.target.value)}
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
                  <label className="text-xs font-semibold text-slate-700">Auto-create in downstream topics</label>
                  <div className="flex flex-wrap gap-4">
                    {["downstream topic 1", "downstream topic 2"].map((topic) => (
                      <div key={topic} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`topic-${topic}`}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          checked={createInDownstream.includes(topic)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateInDownstream([...createInDownstream, topic])
                            } else {
                              setCreateInDownstream(createInDownstream.filter(t => t !== topic))
                            }
                          }}
                        />
                        <label htmlFor={`topic-${topic}`} className="text-xs text-slate-700 select-none cursor-pointer capitalize">
                          {topic}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

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
