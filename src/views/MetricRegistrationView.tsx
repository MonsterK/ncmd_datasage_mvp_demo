import { useMemo, useState } from "react"

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
import { CategoryTreeSelect } from "@/components/CategoryTreeSelect"

import { NewMetricPayload, CategoryNode, Metric } from "@/types"
import { normalizeFilters, normalizeDimensions } from "@/lib/utils"

export interface MetricRegistrationViewProps {
  categories: CategoryNode[]
  onRegisterMetric: (payload: NewMetricPayload) => void
  initialMetric?: Metric
  disableSlugEditing?: boolean
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

export function MetricRegistrationView({ categories, onRegisterMetric, initialMetric, disableSlugEditing }: MetricRegistrationViewProps) {
  const baseQuery = initialMetric?.queryDefinitions?.[0]

  const [categoryPathStr, setCategoryPathStr] = useState<string | undefined>(
    initialMetric?.categoryPath.length ? initialMetric.categoryPath.join(" > ") : undefined,
  )
  const [businessName, setBusinessName] = useState(initialMetric?.businessName ?? "")
  const [businessDefinition, setBusinessDefinition] = useState(initialMetric?.businessDefinition ?? "")
  const [slug, setSlug] = useState(initialMetric?.slug ?? "")
  const [technicalDefinition, setTechnicalDefinition] = useState(initialMetric?.technicalDefinition ?? "")
  const [larkSheetLink, setLarkSheetLink] = useState(initialMetric?.larkSheetLink ?? "")
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const [queryType, setQueryType] = useState(baseQuery?.type ?? "Aeolus Visual Query")
  const [querySource, setQuerySource] = useState(baseQuery?.source ?? "")
  const [originField, setOriginField] = useState(baseQuery?.originField ?? "")
  const [aggregate, setAggregate] = useState(baseQuery?.aggregate ?? "SUM")
  const [businessDate, setBusinessDate] = useState(baseQuery?.businessDate ?? "")
  const [filtersRaw, setFiltersRaw] = useState(
    baseQuery?.filters && baseQuery.filters.length ? baseQuery.filters.join(", ") : "",
  )
  const [analysisDimsRaw, setAnalysisDimsRaw] = useState(
    baseQuery?.analysisDimensions && baseQuery.analysisDimensions.length
      ? baseQuery.analysisDimensions.join(", ")
      : "",
  )
  const [queryLink, setQueryLink] = useState(baseQuery?.link ?? "")

  const [submittedSlug, setSubmittedSlug] = useState<string | null>(null)

  const categoryOptions = useMemo(() => flattenCategoryPaths(categories), [categories])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName || !slug) return

    const payload: NewMetricPayload = {
      businessName,
      businessDefinition,
      slug,
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
    setSubmittedSlug(slug)
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
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <CategoryTreeSelect
                categories={categories}
                value={categoryPathStr ? categoryPathStr.split(" > ") : []}
                onChange={(path: string[]) => setCategoryPathStr(path.join(" > "))}
                placeholder="Select a category path"
              />
            </div>
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
              <label className="text-xs font-semibold text-slate-700">Slug</label>
              <Input
                placeholder="sgi_payout"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={Boolean(disableSlugEditing)}
                className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Technical definition (pseudo SQL)</label>
              <Textarea
                rows={3}
                placeholder="SELECT biz_date, SUM(payout_amount) AS sgi_payout FROM …"
                value={technicalDefinition}
                onChange={(e) => setTechnicalDefinition(e.target.value)}
                className="text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono min-h-[80px]"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Query type</label>
                <Select value={queryType} onValueChange={setQueryType}>
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-blue-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aeolus Visual Query">Aeolus Visual Query</SelectItem>
                    <SelectItem value="Crux HTTP Query">Crux HTTP Query</SelectItem>
                    <SelectItem value="Hive SQL">Hive SQL</SelectItem>
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

            <div className="grid gap-6 md:grid-cols-3">
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
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Business date field</label>
                <Input
                  placeholder="biz_date"
                  value={businessDate}
                  onChange={(e) => setBusinessDate(e.target.value)}
                  className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono"
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
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Analysis dimensions (comma-separated slugs)</label>
                <Textarea
                  rows={3}
                  placeholder="agency, region, platform"
                  value={analysisDimsRaw}
                  onChange={(e) => setAnalysisDimsRaw(e.target.value)}
                  className="text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100 font-mono min-h-[80px]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Aeolus query link</label>
              <Input
                type="url"
                placeholder="https://..."
                value={queryLink}
                onChange={(e) => setQueryLink(e.target.value)}
                className="h-9 text-xs bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button type="submit" className="h-9 px-6 text-xs font-medium bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 rounded-full">
              {initialMetric ? "Update Metric" : "Register Metric"}
            </Button>
            {submittedSlug && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Metric <span className="font-mono font-bold">{submittedSlug}</span> registered successfully!
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
