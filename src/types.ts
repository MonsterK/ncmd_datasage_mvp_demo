
export interface MetricQueryDefinition {
  id: string
  type: string
  source: string
  expression?: string
  businessDate: string
  analysisDimensions: string[]
  createInDownstream?: string[]
  relatedDatasets?: string[]
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
  status: "Active" | "Offline"
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
  dataType?: string
  unit?: string
  dispatchHistory?: DispatchHistory[]
  lastDispatchAt?: string
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
  owners?: {
    businessOwner: string
    techOwner: string
  }
  category?: string
  categoryPath?: string[]
  sourceLink?: string
  sourceDimensionField?: string
  technicalDefinition?: string
  createdAt?: string
  updatedAt?: string
  history?: ChangeLog[]
}

export interface Tag {
  id: string
  name: string
}

export type TopNav = "home" | "metrics" | "dimensions" | "workspace" | "management"

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
  semanticView?: {
    name: string
    hiveTables: string[]
  }
}

export interface TenantCategory {
  name: string
}

export interface Tenant {
  id: string
  name: string
  description?: string
  permitted?: boolean
  sourceType?: string
  sourceLink?: string
  categories?: TenantCategory[]
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
  businessOwner?: string
  techOwner?: string
  categoryPath: string[]
  larkSheetLink?: string
  query: {
    type: string
    source: string
    expression: string
    businessDate: string
    analysisDimensions: string[]
    dataType?: string
    unit?: string
    createInDownstream?: string[]
    relatedDatasets?: string[]
  }
  tenantId?: string
  dispatchSummary?: DispatchHistory
}

export type DispatchTargetType = "Aeolus Dataset" | "Hive Table"

export interface DispatchHistory {
  targetType: DispatchTargetType
  target: string
  status: "success" | "failed"
  dispatchedAt: string
  fieldCount: number
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
