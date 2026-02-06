
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
  fieldName: string
  categoryPath: string[]
  businessDefinition: string
  technicalDefinition: string
  status: "Active" | "Draft"
  tenant: string
  owners: {
    businessOwner: string
    techOwner: string
  }
  queryDefinitions: MetricQueryDefinition[]
  trend30d: TrendPoint[]
  topDimensions: TopDimensionPoint[]
  boundDimensionFieldNames: string[]
  createdAt?: string
  updatedAt?: string
  heat?: number
  larkSheetLink?: string
  history?: ChangeLog[]
}

export interface ChangeLog {
  version: string
  editor: string
  timestamp: string
  action: "create" | "update" | "delete"
  comment?: string
}

export interface DimensionValue {
  code: string
  label: string
}

export interface Dimension {
  id: string
  name: string
  fieldName: string
  aliases: string[]
  description: string
  tenant: string
  version: string
  scope: string[]
  type: string
  values: DimensionValue[]
  boundMetricFieldNames: string[]
  category?: string
  sourceLink?: string
  createdAt?: string
  updatedAt?: string
  history?: ChangeLog[]
}

export interface Tag {
  id: string
  name: string
}

export interface AlbumRef {
  fieldName: string
  version?: string
}

export interface Album {
  id: string
  name: string
  description: string
  scope: string
  visibility: "team" | "private"
  tenant: string
  metricRefs: AlbumRef[]
  dimensionRefs: AlbumRef[]
  metricFieldNames?: string[] // Deprecated
  tags: string[]
  createdAt?: string
  updatedAt?: string
  history?: ChangeLog[]
}

export interface CategoryNode {
  id: string
  name: string
  description?: string
  children?: CategoryNode[]
  metricFieldNames?: string[]
}

export interface Tenant {
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
  dimensionFieldNames?: string[]
}

export interface DataState {
  metrics: Metric[]
  dimensions: Dimension[]
  metricSets: Album[]
  categories: CategoryNode[]
  tenants: Tenant[]
  dimensionTree: DimensionTreeNode[]
}

export interface NewMetricPayload {
  businessName: string
  businessDefinition: string
  fieldName: string
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
  dimensionFieldName: string
  values: string
}

export interface FilterBasedDerivedSpec {
  mode: "filter"
  businessName: string
  fieldName: string
  description?: string
  dimensionFilters: FilterBasedDerivedDimensionFilter[]
}

export interface ArithmeticDerivedSpec {
  mode: "arithmetic"
  businessName: string
  fieldName: string
  description?: string
  otherMetricFieldName: string
  operator: "add" | "sub" | "mul" | "div"
  coefficient?: number
}

export type DerivedMetricSpec = FilterBasedDerivedSpec | ArithmeticDerivedSpec
