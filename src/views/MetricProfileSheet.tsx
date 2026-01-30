import type { Metric, Dimension } from "@/App"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { MetricProfileView } from "@/views/MetricProfileView"

export interface MetricProfileSheetProps {
  metric: Metric
  dimensions: Dimension[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeriveMetric?: (metric: Metric) => void
}

export function MetricProfileSheet({ metric, dimensions, open, onOpenChange, onDeriveMetric }: MetricProfileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">Metric profile</SheetTitle>
        </SheetHeader>
        <div className="mt-4 pb-6">
          <MetricProfileView metric={metric} dimensions={dimensions} onDeriveMetric={onDeriveMetric} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
