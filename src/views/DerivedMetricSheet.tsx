import { useEffect, useMemo, useState } from "react"

import {
  Metric,
  Dimension,
  DerivedMetricSpec,
  FilterBasedDerivedDimensionFilter,
} from "@/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface DerivedMetricSheetProps {
  baseMetric: Metric
  metrics: Metric[]
  dimensions: Dimension[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (spec: DerivedMetricSpec) => void
}

export function DerivedMetricSheet({
  baseMetric,
  metrics,
  dimensions,
  open,
  onOpenChange,
  onCreate,
}: DerivedMetricSheetProps) {
  const [mode, setMode] = useState<"filter" | "arithmetic">("filter")
  const [businessName, setBusinessName] = useState("")
  const [fieldName, setFieldName] = useState("")
  const [description, setDescription] = useState("")

  const [dimensionFilters, setDimensionFilters] = useState<FilterBasedDerivedDimensionFilter[]>([])

  const [otherMetricFieldName, setOtherMetricFieldName] = useState<string>("")
  const [operator, setOperator] = useState<"add" | "sub" | "mul" | "div">("add")
  const [coefficient, setCoefficient] = useState<string>("1")

  const [message, setMessage] = useState<string | null>(null)

  const metricsInTenant = useMemo(
    () => metrics.filter((m) => m.fieldName !== baseMetric.fieldName),
    [metrics, baseMetric.fieldName],
  )

  const dimensionsForBase = useMemo(
    () => dimensions,
    [dimensions],
  )

  useEffect(() => {
    if (!open) return

    setMode("filter")
    setBusinessName(`${baseMetric.businessName} (derived)`)
    setFieldName(`${baseMetric.fieldName}_derived`)
    setDescription("")
    setDimensionFilters([])
    setOtherMetricFieldName("")
    setOperator("add")
    setCoefficient("1")
    setMessage(null)
  }, [open, baseMetric.businessName, baseMetric.fieldName])

  const handleAddFilterRow = () => {
    const fallbackFieldName =
      baseMetric.boundDimensionFieldNames[0] ?? dimensionsForBase[0]?.fieldName ?? (dimensions[0]?.fieldName ?? "")
    setDimensionFilters((prev) => [
      ...prev,
      {
        dimensionFieldName: fallbackFieldName,
        values: "",
      },
    ])
  }

  const handleUpdateFilter = (index: number, patch: Partial<FilterBasedDerivedDimensionFilter>) => {
    setDimensionFilters((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const handleRemoveFilterRow = (index: number) => {
    setDimensionFilters((prev) => prev.filter((_, i) => i !== index))
  }

  const validateCommonFields = (): boolean => {
    const trimmedName = businessName.trim()
    const trimmedFieldName = fieldName.trim()
    if (!trimmedName || !trimmedFieldName) {
      setMessage("Business name and field name are required.")
      return false
    }
    const fieldNameClash = metrics.some((m) => m.fieldName === trimmedFieldName)
    if (fieldNameClash) {
      setMessage(`Metric field name "${trimmedFieldName}" already exists in this demo.`)
      return false
    }
    return true
  }

  const handleSubmitFilter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateCommonFields()) return

    const trimmedFilters = dimensionFilters
      .map((f) => ({
        dimensionFieldName: f.dimensionFieldName.trim(),
        values: f.values.trim(),
      }))
      .filter((f) => f.dimensionFieldName && f.values)

    if (trimmedFilters.length === 0) {
      setMessage("Add at least one dimension filter with values.")
      return
    }

    const spec: DerivedMetricSpec = {
      mode: "filter",
      businessName: businessName.trim(),
      fieldName: fieldName.trim(),
      description: description.trim() || undefined,
      dimensionFilters: trimmedFilters,
    }

    onCreate(spec)
  }

  const handleSubmitArithmetic = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateCommonFields()) return

    const trimmedFieldName = otherMetricFieldName.trim()
    if (!trimmedFieldName) {
      setMessage("Select another metric to combine with.")
      return
    }
    const otherMetric = metricsInTenant.find((m) => m.fieldName === trimmedFieldName)
    if (!otherMetric) {
      setMessage("The selected metric is not available in the same tenant.")
      return
    }

    const parsedCoeff = Number(coefficient.trim() || "1")
    const spec: DerivedMetricSpec = {
      mode: "arithmetic",
      businessName: businessName.trim(),
      fieldName: fieldName.trim(),
      description: description.trim() || undefined,
      otherMetricFieldName: trimmedFieldName,
      operator,
      coefficient: Number.isNaN(parsedCoeff) ? undefined : parsedCoeff,
    }

    onCreate(spec)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Derive metric</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 pb-6 text-xs">
          <div className="space-y-1">
            <p className="text-[11px] text-zinc-600">Base metric</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-700">
              <span className="font-medium text-zinc-900">{baseMetric.businessName}</span>
              <span className="font-mono text-[11px] text-zinc-500">{baseMetric.fieldName}</span>
              <Badge variant="outline" className="text-[10px]">
                {baseMetric.status}
              </Badge>
            </div>
          </div>

          <Tabs
            value={mode}
            onValueChange={(value) => {
              if (value === "filter" || value === "arithmetic") {
                setMode(value)
                setMessage(null)
              }
            }}
          >
            <TabsList className="mb-3">
              <TabsTrigger value="filter" className="text-xs">
                Filter-based
              </TabsTrigger>
              <TabsTrigger value="arithmetic" className="text-xs">
                Arithmetic
              </TabsTrigger>
            </TabsList>

            <TabsContent value="filter" className="space-y-4">
              <form className="space-y-4" onSubmit={handleSubmitFilter}>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-700">Business name</label>
                  <Input
                    className="h-8 text-xs"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. SGI payout (US agencies only)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-700">Field Name</label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="sgi_payout_us"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-700">Description (optional)</label>
                  <Textarea
                    rows={3}
                    className="text-xs"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="How this derived metric is used, and how it relates to the base metric."
                  />
                </div>

                <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-zinc-800">Dimension filters</p>
                    <Button type="button" size="sm" className="h-7 px-2 text-[11px]" onClick={handleAddFilterRow}>
                      Add filter
                    </Button>
                  </div>
                  {dimensionFilters.length > 0 ? (
                    <div className="space-y-2">
                      {dimensionFilters.map((filter, index) => (
                        <div key={index} className="grid gap-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_auto]">
                          <Select
                            value={filter.dimensionFieldName}
                            onValueChange={(value) =>
                              handleUpdateFilter(index, {
                                dimensionFieldName: value,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Dimension" />
                            </SelectTrigger>
                            <SelectContent>
                              {dimensionsForBase.map((d) => (
                                <SelectItem key={d.fieldName} value={d.fieldName}>
                                  {d.name} ({d.fieldName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Textarea
                            rows={2}
                            className="text-[11px]"
                            placeholder="Values for this dimension, comma or new line separated."
                            value={filter.values}
                            onChange={(e) =>
                              handleUpdateFilter(index, {
                                values: e.target.value,
                              })
                            }
                          />
                          <div className="flex items-start justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px] text-red-600"
                              onClick={() => handleRemoveFilterRow(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      No filters configured yet. Add at least one dimension filter to derive a segmented metric.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Button type="submit" size="sm" className="text-xs">
                    Create derived metric
                  </Button>
                  {message && <p className="text-[11px] text-red-600">{message}</p>}
                </div>
              </form>
            </TabsContent>

            <TabsContent value="arithmetic" className="space-y-4">
              <form className="space-y-4" onSubmit={handleSubmitArithmetic}>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-700">Business name</label>
                  <Input
                    className="h-8 text-xs"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. SGI payout margin"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-700">Field Name</label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="sgi_payout_margin"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-700">Description (optional)</label>
                  <Textarea
                    rows={3}
                    className="text-xs"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="How this arithmetic derived metric is used."
                  />
                </div>

                <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold text-zinc-800">Expression</p>
                  <div className="grid gap-2 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-700">Other metric (same tenant)</label>
                      <Select value={otherMetricFieldName} onValueChange={setOtherMetricFieldName}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                          {metricsInTenant.map((m) => (
                            <SelectItem key={m.fieldName} value={m.fieldName}>
                              {m.businessName} ({m.fieldName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-700">Operator</label>
                      <Select
                        value={operator}
                        onValueChange={(value: "add" | "sub" | "mul" | "div") => setOperator(value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add">+</SelectItem>
                          <SelectItem value="sub">-</SelectItem>
                          <SelectItem value="mul">×</SelectItem>
                          <SelectItem value="div">÷</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-700">Coefficient (optional)</label>
                      <Input
                        className="h-8 text-xs"
                        value={coefficient}
                        onChange={(e) => setCoefficient(e.target.value)}
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    The expression is evaluated as: <span className="font-mono">base_metric op other_metric * coefficient</span>.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Button type="submit" size="sm" className="text-xs">
                    Create derived metric
                  </Button>
                  {message && <p className="text-[11px] text-red-600">{message}</p>}
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
