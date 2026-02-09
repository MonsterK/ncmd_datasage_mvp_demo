
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
import { CategoryTreeSelect } from "@/components/CategoryTreeSelect"

import { NewMetricPayload, CategoryNode, Metric, Tenant } from "@/types"
import { normalizeFilters, normalizeDimensions } from "@/lib/utils"

export interface MetricRegistrationViewProps {
  categories: CategoryNode[]
  tenants: Tenant[]
  onRegisterMetric: (payload: NewMetricPayload) => void
  initialMetric?: Metric
  disableFieldNameEditing?: boolean
}

function flattenCategoryPaths(nodes: CategoryNode[], prefix: string[] = []): string[] {
  const paths: string[] = []
  nodes.forEach((node) => {
    const currentPath = [...prefix, node.name]
    if (node.children && node.children.length > 0) {
      paths.push(...flattenCategoryPaths(node.children, currentPath))
    } else {
      paths.push(currentPath.join(" > "))
    }
  })
  return paths
}

export function MetricRegistrationView({ categories, tenants, onRegisterMetric, initialMetric, disableFieldNameEditing }: MetricRegistrationViewProps) {
  const baseQuery = initialMetric?.queryDefinitions?.[0]

  const [categoryPathStr, setCategoryPathStr] = useState<string | undefined>(
    initialMetric?.categoryPath.length ? initialMetric.categoryPath.join(" > ") : undefined,
  )
  const [linkedDataSource, setLinkedDataSource] = useState<{ type: string; link: string } | null>(null)

  useEffect(() => {
    if (!categoryPathStr || !tenants) {
      setLinkedDataSource(null)
      return
    }
    // Find the tenant category that matches the path
    let foundSource = null
    for (const tenant of tenants) {
      if (tenant.categories) {
        const cat = tenant.categories.find((c) => c.name === categoryPathStr)
        if (cat && cat.dataSource) {
          foundSource = cat.dataSource
          break
        }
      }
    }
    setLinkedDataSource(foundSource)
  }, [categoryPathStr, tenants])

  const [businessName, setBusinessName] = useState(initialMetric?.businessName ?? "")
  const [businessDefinition, setBusinessDefinition] = useState(initialMetric?.businessDefinition ?? "")
  const [fieldName, setFieldName] = useState(initialMetric?.fieldName ?? "")
  const [dataType, setDataType] = useState(initialMetric?.dataType ?? "decimal")
  const [unit, setUnit] = useState(initialMetric?.unit ?? "")
  const [technicalDefinition, setTechnicalDefinition] = useState(initialMetric?.technicalDefinition ?? "")
  const [larkSheetLink, setLarkSheetLink] = useState(initialMetric?.larkSheetLink ?? "")
  const [importMessage, setImportMessage] = useState<string | null>(null)

  // 3. Query Type defaults to Aeolus Visual Query, not allowed to change
  const [queryType] = useState("Aeolus Visual Query")
  const [querySource, setQuerySource] = useState(baseQuery?.source ?? "")
  const [originField, setOriginField] = useState(baseQuery?.originField ?? "")
  const [aggregate, setAggregate] = useState(baseQuery?.aggregate ?? "SUM")
  
  // 4. Business date field defaults to partition, user doesn't fill
  const [businessDate] = useState("partition")
  
  const [filtersRaw, setFiltersRaw] = useState(
    baseQuery?.filters && baseQuery.filters.length ? baseQuery.filters.join(", ") : "",
  )
  
  // 5. Analysis dimensions parsed from Aeolus query (link)
  // We'll calculate this dynamically or update state when link changes
  const [analysisDimsRaw, setAnalysisDimsRaw] = useState(
    baseQuery?.analysisDimensions && baseQuery.analysisDimensions.length
      ? baseQuery.analysisDimensions.join(", ")
      : "",
  )
  
  const [queryLink, setQueryLink] = useState(baseQuery?.link ?? "")

  const [submittedFieldName, setSubmittedFieldName] = useState<string | null>(null)

  // Effect to parse dims from query link (Mock implementation)
  useEffect(() => {
    if (!queryLink) return
    try {
        // Mock parsing logic: look for "dims=a,b,c" or similar
        // Or just extract some mock data if it matches a pattern
        const url = new URL(queryLink)
        const dimsParam = url.searchParams.get("dims") || url.searchParams.get("dimensions")
        if (dimsParam) {
            setAnalysisDimsRaw(dimsParam.split(",").join(", "))
        }
    } catch (e) {
        // ignore invalid url
    }
  }, [queryLink])

  const categoryOptions = useMemo(() => flattenCategoryPaths(categories), [categories])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName || !fieldName) return

    const payload: NewMetricPayload = {
      businessName,
      businessDefinition,
      fieldName,
      dataType,
      unit,
      technicalDefinition,
      categoryPath: categoryPathStr ? categoryPathStr.split(" > ") : [],
      larkSheetLink: larkSheetLink.trim() || undefined,
      query: {
        type: queryType,
        source: querySource,
        originField,
        aggregate,
        businessDate,
        filters: normalizeFilters(filtersRaw),
        analysisDimensions: normalizeDimensions(analysisDimsRaw),
        link: queryLink.trim() || undefined,
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
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Import from LarkSheet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Paste a LarkSheet link to mock an import into the metric registration payload.
                </p>
              </div>
              {importMessage && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{importMessage}</span>}
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

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Data Type</label>
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

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Field Name</label>
              <Input
                placeholder="sgi_payout"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                disabled={Boolean(disableFieldNameEditing)}
                className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Technical definition (pseudo SQL)</label>
              <div className="relative">
                <Textarea
                  rows={5}
                  placeholder="e.g. CASE WHEN l3_product_tag='Auto Ads' THEN dollar_revenue_real ELSE 0 END"
                  value={technicalDefinition}
                  onChange={(e) => setTechnicalDefinition(e.target.value)}
                  className="text-xs font-mono bg-slate-900 text-slate-50 border-slate-800 focus:border-blue-500 focus:ring-blue-900 min-h-[120px]"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 text-[10px]">SQL</Badge>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Define calculation logic using standard SQL syntax. Support parameters like :start_date, :end_date.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Category (Determines Data Source)</label>
                {linkedDataSource && (
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                    Bound to {linkedDataSource.type}
                  </Badge>
                )}
              </div>
              <CategoryTreeSelect
                categories={categories}
                value={categoryPathStr ? categoryPathStr.split(" > ") : []}
                onChange={(path: string[]) => setCategoryPathStr(path.join(" > "))}
                placeholder="Select a category path"
              />
              {linkedDataSource && (
                <p className="text-[10px] text-slate-500">
                  Source Link: <a href={linkedDataSource.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{linkedDataSource.link}</a>
                </p>
              )}
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

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Origin field</label>
                <Input
                  placeholder="payout_amount"
                  value={originField}
                  onChange={(e) => setOriginField(e.target.value)}
                  className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Aggregate</label>
                <Select value={aggregate} onValueChange={setAggregate}>
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-blue-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUM">SUM</SelectItem>
                    <SelectItem value="COUNT">COUNT</SelectItem>
                    <SelectItem value="DISTINCT_COUNT">DISTINCT_COUNT</SelectItem>
                    <SelectItem value="AVG">AVG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Business date field is hidden/removed as per requirement */}
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Aeolus query link</label>
                <Input
                  type="url"
                  placeholder="https://... (Analysis dimensions parsed from here)"
                  value={queryLink}
                  onChange={(e) => setQueryLink(e.target.value)}
                  className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Filters (comma or new line)</label>
                <Textarea
                  rows={3}
                  placeholder="market = 'US', product_line = 'Ads'"
                  value={filtersRaw}
                  onChange={(e) => setFiltersRaw(e.target.value)}
                  className="text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono min-h-[80px]"
                />
              </div>
              {/* Analysis dimensions hidden/read-only */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Analysis dimensions (Parsed from query)</label>
                <div className="text-xs bg-slate-100 p-2 rounded min-h-[80px] text-slate-600 font-mono">
                  {analysisDimsRaw || "(No dimensions parsed)"}
                </div>
              </div>
            </div>
          </div>

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
