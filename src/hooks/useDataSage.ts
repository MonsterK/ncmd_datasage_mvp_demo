
import { useState, useEffect } from "react"
import { Album, DataState } from "../types"

const EMPTY_DATA: DataState = {
  metrics: [],
  dimensions: [],
  metricSets: [],
  categories: [],
  dimensionTree: [],
}

export function useDataSage() {
  const [data, setData] = useState<DataState>(EMPTY_DATA)
  const [metricSetsState, setMetricSetsState] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const t = Date.now()
        const [metricsRes, dimensionsRes, metricSetsRes, categoriesRes, dimensionTreeRes] =
          await Promise.all([
            fetch(`/metrics.json?t=${t}`),
            fetch(`/dimensions.json?t=${t}`),
            fetch(`/metricSets.json?t=${t}`),
            fetch(`/categories.json?t=${t}`),
            fetch(`/dimensionsTree.json?t=${t}`),
          ])

        if (
          !metricsRes.ok ||
          !dimensionsRes.ok ||
          !metricSetsRes.ok ||
          !categoriesRes.ok ||
          !dimensionTreeRes.ok
        ) {
          throw new Error("Failed to load mock JSON data")
        }

        const metricsJson = await metricsRes.json()
        const dimensionsJson = await dimensionsRes.json()
        const metricSetsJson = await metricSetsRes.json()
        const categoriesJson = await categoriesRes.json()
        const dimensionTreeJson = await dimensionTreeRes.json()

        const metricSetsRaw = metricSetsJson.metricSets ?? []
        const metricSets: Album[] = metricSetsRaw.map((set: any) => ({
          ...set,
          tags: Array.isArray(set.tags) ? set.tags : [],
        }))

        const loadedData: DataState = {
          metrics: metricsJson.metrics ?? [],
          dimensions: dimensionsJson.dimensions ?? [],
          metricSets,
          categories: categoriesJson.categories ?? [],
          dimensionTree: dimensionTreeJson.nodes ?? dimensionTreeJson.dimensionTree ?? [],
        }

        setData(loadedData)
        setMetricSetsState(loadedData.metricSets)
        setLoading(false)
      } catch (e) {
        console.error(e)
        setError("Failed to load mock data. Please refresh the page.")
        setLoading(false)
      }
    }

    load()
  }, [])

  return {
    data,
    setData,
    metricSetsState,
    setMetricSetsState,
    loading,
    error,
  }
}
