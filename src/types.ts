
export interface MetricQueryDefinition {
  id: string
  type: string
  source: string
  fields?: string[]
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

export type MetricStatus = "Active" | "Draft"

export interface Metric {
  id: string
  businessName: string
  fieldName: string
  categoryPath: string[]
  businessDefinition: string
  technicalDefinition: string
  status: MetricStatus
  owner: string
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
  deployHistory?: DeployHistory[]
  lastDeployAt?: string
  sourceHiveTable?: string
  sourceHiveField?: string
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
  version: string
  scope: string[]
  type: string
  values: DimensionValue[]
  boundMetricFieldNames: string[]
  owner?: string
  category?: string
  categoryPath?: string[]
  sourceLink?: string
  sourceDimensionField?: string
  queryDefinitions?: MetricQueryDefinition[]
  status?: MetricStatus
  technicalDefinition?: string
  createdAt?: string
  updatedAt?: string
  history?: ChangeLog[]
  deployHistory?: DeployHistory[]
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
  metricRefs: AlbumRef[]
  dimensionRefs: AlbumRef[]
  metricFieldNames?: string[] // Deprecated
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
  dimensionTree: DimensionTreeNode[]
}

export interface NewMetricPayload {
  businessName: string
  businessDefinition: string
  fieldName: string
  technicalDefinition: string
  owner?: string
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
  deploySummary?: DeployHistory
  sourceHiveTable?: string
  sourceHiveField?: string
}

export type DeployTargetType = "Aeolus Dataset" | "Hive Table"

export interface DeployHistory {
  targetType: DeployTargetType
  target: string
  targetField?: string
  status: "success" | "failed"
  deployedAt: string
  fieldCount: number
  type?: "deployment" | "binding"
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
