export interface CdmFieldRecommendation {
  fieldName: string
  recommendedTableName: string
  isCertifiedCDM: boolean
  candidateTableNames: string[]
}

const sqlKeywords = new Set([
  "select",
  "from",
  "where",
  "and",
  "or",
  "case",
  "when",
  "then",
  "else",
  "end",
  "sum",
  "count",
  "avg",
  "min",
  "max",
  "distinct",
  "as",
  "on",
  "join",
  "left",
  "right",
  "inner",
  "outer",
  "group",
  "by",
  "order",
  "limit",
  "over",
  "partition",
  "desc",
  "asc",
])

const defaultTables = [
  "cdm_ads_performance",
  "cdm_campaign_daily",
  "cdm_creative_asset",
  "cdm_delivery_fact",
  "cdm_revenue_core",
  "raw_ad_events",
]

const certifiedTables = new Set(["cdm_ads_performance", "cdm_campaign_daily", "cdm_revenue_core"])

const tokenizeExpression = (expression: string): string[] => {
  if (!expression.trim()) return []
  const tokens = expression.match(/[a-zA-Z_][a-zA-Z0-9_\.]*/g) ?? []
  return Array.from(new Set(tokens))
    .map((token) => token.split(".").pop() ?? token)
    .filter((token) => token.length > 1 && !sqlKeywords.has(token.toLowerCase()))
}

export const mockResolveCdm = (expression: string): Promise<CdmFieldRecommendation[]> => {
  const fields = tokenizeExpression(expression)
  const recommendations = fields.map((fieldName, index) => {
    const recommendedTableName = defaultTables[index % defaultTables.length]
    const candidateTableNames = Array.from(
      new Set([recommendedTableName, ...defaultTables].slice(0, 4)),
    )
    return {
      fieldName,
      recommendedTableName,
      isCertifiedCDM: certifiedTables.has(recommendedTableName),
      candidateTableNames,
    }
  })
  return new Promise((resolve) => {
    setTimeout(() => resolve(recommendations), 600)
  })
}
