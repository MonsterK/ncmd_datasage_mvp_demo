import { useMemo, useState } from "react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type { Metric, Dimension } from "@/App"

export interface DimensionManagementViewProps {
  metrics: Metric[]
  dimensions: Dimension[]
}

export function DimensionManagementView({ metrics, dimensions }: DimensionManagementViewProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(dimensions[0]?.slug ?? null)
  const [validationMetricSlug, setValidationMetricSlug] = useState("")
  const [validationResult, setValidationResult] = useState<string | null>(null)

  const selected = useMemo(
    () => dimensions.find((d) => d.slug === selectedSlug) ?? null,
    [dimensions, selectedSlug],
  )

  const boundMetricsForSelected = useMemo(() => {
    if (!selected) return []
    return metrics.filter((m) => selected.boundMetricSlugs.includes(m.slug))
  }, [metrics, selected])

  const handleValidateBinding = () => {
    const slug = validationMetricSlug.trim()
    if (!slug || !selected) {
      setValidationResult("Enter a metric slug and select a dimension first.")
      return
    }
    const metric = metrics.find((m) => m.slug === slug)
    if (!metric) {
      setValidationResult(`Metric slug "${slug}" does not exist in the registry.`)
      return
    }
    if (selected.boundMetricSlugs.includes(slug)) {
      setValidationResult(
        `Binding is valid: metric "${slug}" is declared to use dimension "${selected.slug}".`,
      )
    } else {
      setValidationResult(
        `Binding is missing: metric "${slug}" does not reference dimension "${selected.slug}" in the mock data.`,
      )
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dimension management</CardTitle>
          <CardDescription>
            Separate registry for analysis dimensions: terms, values dictionary, version & scope, bindings and
            validation.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dimension terms</CardTitle>
            <CardDescription className="text-xs">
              Each term represents a reusable analysis dimension shared by multiple metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-80">
              <div className="divide-y border-t border-zinc-100">
                {dimensions.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedSlug(d.slug)}
                    className={`flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-xs ${
                      selectedSlug === d.slug ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="font-mono text-[10px] opacity-80">{d.slug}</div>
                    </div>
                    <div className="text-[10px] opacity-80">{d.domain}</div>
                  </button>
                ))}
                {dimensions.length === 0 && (
                  <div className="px-3 py-2 text-xs text-zinc-500">No dimensions in mock data.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dimension details</CardTitle>
            <CardDescription className="text-xs">
              Term definition, values dictionary, version and binding back to metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{selected.name}</span>
                    <span className="font-mono text-[11px] text-zinc-500">{selected.slug}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {selected.type}
                    </Badge>
                  </div>
                  <p className="text-zinc-700">{selected.description}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
                    <span>Domain: {selected.domain}</span>
                    <span>Version: {selected.version}</span>
                    <span>Scope: {selected.scope.join(", ")}</span>
                  </div>
                  {selected.category && (
                    <div className="text-[11px] text-zinc-500">Category: {selected.category}</div>
                  )}
                  {selected.sourceLink && (
                    <div className="text-[11px] text-zinc-500">
                      Source link:{" "}
                      <a
                        href={selected.sourceLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline"
                      >
                        {selected.sourceLink}
                      </a>
                    </div>
                  )}
                  {selected.aliases.length > 0 && (
                    <div className="text-[11px] text-zinc-500">Aliases: {selected.aliases.join(", ")}</div>
                  )}
                </div>

                <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold text-zinc-800">Values dictionary</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Code</TableHead>
                        <TableHead className="text-xs">Label</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.values.map((v) => (
                        <TableRow key={v.code}>
                          <TableCell className="font-mono text-[11px]">{v.code}</TableCell>
                          <TableCell className="text-xs">{v.label}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-semibold text-zinc-800">Bound metrics (from registry)</p>
                  {boundMetricsForSelected.length > 0 ? (
                    <ul className="space-y-1 text-xs">
                      {boundMetricsForSelected.map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-2">
                          <span>{m.businessName}</span>
                          <span className="font-mono text-[11px] text-zinc-500">{m.slug}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-500">No metrics are bound to this dimension in the mock data.</p>
                  )}
                </div>

                <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold text-zinc-800">Binding validation (mock)</p>
                  <p className="text-[11px] text-zinc-500">
                    Enter a metric slug to validate if the registry states that it uses this dimension. This simulates
                    binding validation in the real platform.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      className="h-8 text-xs"
                      placeholder="e.g. sgi_payout"
                      value={validationMetricSlug}
                      onChange={(e) => setValidationMetricSlug(e.target.value)}
                    />
                    <Button type="button" size="sm" className="text-xs" onClick={handleValidateBinding}>
                      Validate binding
                    </Button>
                  </div>
                  {validationResult && (
                    <p className="text-[11px] text-zinc-600">{validationResult}</p>
                  )}
                </div>

                <p className="text-[11px] text-zinc-500">
                  In the metric profile, Top dimension distributions use these curated dimension values instead of raw
                  codes, ensuring consistent semantics across reports.
                </p>
              </>
            ) : (
              <p className="text-xs text-zinc-500">Select a dimension term from the list on the left.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
