import type { Metric } from "@/App"

export interface MetricLineageDagProps {
  metric: Metric
}

export function MetricLineageDag({ metric }: MetricLineageDagProps) {
  const upstreamSources = Array.from(
    new Set(metric.queryDefinitions.map((q) => q.source).filter((s) => !!s)),
  )
  const downstreamConsumers = ["SGI / QBR dashboard", "Monetization API", "External export"]

  const upstreamNodes = upstreamSources.length ? upstreamSources : ["Query source"]
  const downstreamNodes = downstreamConsumers

  const width = 400
  const height = 170
  const centerX = width / 2
  const centerY = height / 2
  const upstreamY = 40
  const downstreamY = height - 40

  const getXPositions = (count: number): number[] => {
    const step = width / (count + 1)
    return Array.from({ length: count }, (_, index) => (index + 1) * step)
  }

  const upstreamXs = getXPositions(upstreamNodes.length)
  const downstreamXs = getXPositions(downstreamNodes.length)

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500">
        Mock DAG: upstream query sources on top, this metric in the middle, downstream consumers at the bottom.
      </p>
      <div className="h-48 w-full rounded-md border border-zinc-200 bg-zinc-50">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
          <defs>
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0 0 L8 4 L0 8 z" fill="#a1a1aa" />
            </marker>
          </defs>

          {/* Upstream nodes */}
          {upstreamNodes.map((label, index) => {
            const x = upstreamXs[index]
            return (
              <g key={label}>
                <rect
                  x={x - 60}
                  y={upstreamY - 14}
                  width={120}
                  height={28}
                  rx={6}
                  className="fill-white stroke-zinc-300"
                />
                <text
                  x={x}
                  y={upstreamY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-zinc-700"
                  fontSize={10}
                >
                  {label}
                </text>
                <line
                  x1={x}
                  y1={upstreamY + 14}
                  x2={centerX}
                  y2={centerY - 22}
                  stroke="#a1a1aa"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  markerEnd="url(#arrow)"
                />
              </g>
            )
          })}

          {/* Metric node */}
          <g>
            <rect
              x={centerX - 70}
              y={centerY - 18}
              width={140}
              height={36}
              rx={8}
              className="fill-zinc-900"
            />
            <text
              x={centerX}
              y={centerY - 4}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white"
              fontSize={11}
            >
              {metric.businessName}
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-zinc-400"
              fontSize={9}
            >
              {metric.slug}
            </text>
          </g>

          {/* Downstream nodes */}
          {downstreamNodes.map((label, index) => {
            const x = downstreamXs[index]
            return (
              <g key={label}>
                <rect
                  x={x - 60}
                  y={downstreamY - 14}
                  width={120}
                  height={28}
                  rx={6}
                  className="fill-white stroke-zinc-300"
                />
                <text
                  x={x}
                  y={downstreamY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-zinc-700"
                  fontSize={10}
                >
                  {label}
                </text>
                <line
                  x1={centerX}
                  y1={centerY + 22}
                  x2={x}
                  y2={downstreamY - 14}
                  stroke="#a1a1aa"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  markerEnd="url(#arrow)"
                />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
