import { Metric, Dimension } from "@/types"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MetricProfileView } from "@/views/MetricProfileView"

export interface MetricProfileSheetProps {
  metric: Metric
  dimensions: Dimension[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeriveMetric?: (metric: Metric) => void
  onNavigateWorkspace?: () => void
  onUpdateMetricStatus?: (fieldName: string, status: "Active" | "Draft") => void
}

export function MetricProfileSheet({
  metric,
  dimensions,
  open,
  onOpenChange,
  onDeriveMetric,
  onNavigateWorkspace,
  onUpdateMetricStatus,
}: MetricProfileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:max-w-xl p-0">
        <div className="px-6 py-6">
          <MetricProfileView
            metric={metric}
            dimensions={dimensions}
            onDeriveMetric={onDeriveMetric}
            onNavigateWorkspace={onNavigateWorkspace}
            onUpdateMetricStatus={onUpdateMetricStatus}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
