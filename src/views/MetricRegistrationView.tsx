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
    <Card>
      <CardHeader>
        <CardTitle>Metric registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-zinc-800">Import from LarkSheet</p>
                <p className="text-[11px] text-zinc-500">
                  Paste a LarkSheet link to mock an import into the metric registration payload.
                </p>
              </div>
              {importMessage && <span className="text-[11px] text-emerald-600">{importMessage}</span>}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-medium text-zinc-700">LarkSheet link</label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={larkSheetLink}
                  onChange={(e) => {
                    setLarkSheetLink(e.target.value)
                    if (importMessage) setImportMessage(null)
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  size="sm"
                  className="text-xs"
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Category</label>
              <Select value={categoryPathStr} onValueChange={setCategoryPathStr}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category path" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Business name</label>
              <Input
                placeholder="SGI Payout"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-700">Business definition</label>
            <Textarea
              rows={3}
              placeholder="Describe what this metric means, how it is used and basic calculation rules in business language."
              value={businessDefinition}
              onChange={(e) => setBusinessDefinition(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Slug</label>
              <Input
                placeholder="sgi_payout"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={Boolean(disableSlugEditing)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Technical definition (pseudo SQL)</label>
              <Textarea
                rows={3}
                placeholder="SELECT biz_date, SUM(payout_amount) AS sgi_payout FROM …"
                value={technicalDefinition}
                onChange={(e) => setTechnicalDefinition(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Query type</label>
                <Select value={queryType} onValueChange={setQueryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aeolus Visual Query">Aeolus Visual Query</SelectItem>
                    <SelectItem value="Crux HTTP Query">Crux HTTP Query</SelectItem>
                    <SelectItem value="Hive SQL">Hive SQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Source dataset</label>
                <Input
                  placeholder="fabric_sgi_payout_daily"
                  value={querySource}
                  onChange={(e) => setQuerySource(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Origin field</label>
                <Input
                  placeholder="payout_amount"
                  value={originField}
                  onChange={(e) => setOriginField(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Aggregate</label>
                <Select value={aggregate} onValueChange={setAggregate}>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Business date field</label>
                <Input
                  placeholder="biz_date"
                  value={businessDate}
                  onChange={(e) => setBusinessDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Filters (comma or new line)</label>
                <Textarea
                  rows={3}
                  placeholder="market = 'US', product_line = 'Ads'"
                  value={filtersRaw}
                  onChange={(e) => setFiltersRaw(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">Analysis dimensions (comma-separated slugs)</label>
                <Textarea
                  rows={3}
                  placeholder="agency, region, platform"
                  value={analysisDimsRaw}
                  onChange={(e) => setAnalysisDimsRaw(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700">Aeolus query link</label>
              <Input
                type="url"
                placeholder="https://..."
                value={queryLink}
                onChange={(e) => setQueryLink(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" className="text-xs">
              Register metric (mock)
            </Button>
            {submittedSlug && (
              <p className="text-[11px] text-zinc-500">
                Mock: metric <span className="font-mono">{submittedSlug}</span> has been added to the in-memory
                registry and will appear in the search results.
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
