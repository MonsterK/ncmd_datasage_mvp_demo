
export interface MetricQueryDefinition {
  id: string
  type: string
  source: string
  originField: string
  aggregate: string
  businessDate: string
  filters: string[]
  analysisDimensions: string[]
  link?: string
}

export interface TrendPoint {
  date: string
  value: number
}

export interface TopDimensionPoint {
  label: string
  value: number
}

export interface Metric {
  id: string
  businessName: string
  slug: string
  categoryPath: string[]
  businessDefinition: string
  technicalDefinition: string
  status: "Active" | "Draft"
  domain: string
  owners: {
    businessOwner: string
    techOwner: string
  }
  queryDefinitions: MetricQueryDefinition[]
  trend30d: TrendPoint[]
  topDimensions: TopDimensionPoint[]
  boundDimensionSlugs: string[]
  createdAt?: string
  updatedAt?: string
  heat?: number
  larkSheetLink?: string
}

export interface DimensionValue {
  code: string
  label: string
}

export interface Dimension {
  id: string
  name: string
  slug: string
  aliases: string[]
  description: string
  domain: string
  version: string
  scope: string[]
  type: string
  values: DimensionValue[]
  boundMetricSlugs: string[]
  category?: string
  sourceLink?: string
  createdAt?: string
  updatedAt?: string
}

export interface Tag {
  id: string
  name: string
}

export interface Album {
  id: string
  name: string
  description: string
  scope: string
  visibility: "team" | "private"
  domain: string
  metricSlugs: string[]
  tags: string[]
  createdAt?: string
  updatedAt?: string
}

export interface CategoryNode {
  id: string
  name: string
  description?: string
  children?: CategoryNode[]
  metricSlugs?: string[]
}

export interface Domain {
  id: string
  name: string
  description?: string
  permitted?: boolean
  sourceType?: string
  sourceLink?: string
}

export interface DimensionTreeNode {
  id: string
  name: string
  count: number
  children?: DimensionTreeNode[]
  dimensionSlugs?: string[]
}

export interface DataState {
  metrics: Metric[]
  dimensions: Dimension[]
  metricSets: Album[]
  categories: CategoryNode[]
  domains: Domain[]
  dimensionTree: DimensionTreeNode[]
}

export interface NewMetricPayload {
  businessName: string
  businessDefinition: string
  slug: string
  technicalDefinition: string
  categoryPath: string[]
  larkSheetLink?: string
  query: {
    type: string
    source: string
    originField: string
    aggregate: string
    businessDate: string
    filters: string[]
    analysisDimensions: string[]
    link?: string
  }
}

export interface FilterBasedDerivedDimensionFilter {
  dimensionSlug: string
  values: string
}

export interface FilterBasedDerivedSpec {
  mode: "filter"
  businessName: string
  slug: string
  description?: string
  dimensionFilters: FilterBasedDerivedDimensionFilter[]
}

export interface ArithmeticDerivedSpec {
  mode: "arithmetic"
  businessName: string
  slug: string
  description?: string
  otherMetricSlug: string
  operator: "add" | "sub" | "mul" | "div"
  coefficient?: number
}

export type DerivedMetricSpec = FilterBasedDerivedSpec | ArithmeticDerivedSpec
