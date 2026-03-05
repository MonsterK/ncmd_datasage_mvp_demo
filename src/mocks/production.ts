import { DeployTargetType } from "@/types"

export interface CdmBindingItem {
  fieldName: string
  tableName: string
  isCertifiedCDM: boolean
  notFound: boolean
}

export interface DeployValidationResult {
  ok: boolean
  errors: { fieldName?: string; message: string }[]
  existingFields: string[]
}

const targetFieldSeeds: Record<DeployTargetType, string[]> = {
  "Aeolus Dataset": ["spp_revenue", "auto_ads_revenue", "active_monetized_creators"],
  "Hive Table": ["ad_id", "campaign_id", "p_date"],
}

export const mockValidateDeploy = (params: {
  bindings: CdmBindingItem[]
  targetType: DeployTargetType
  targetId: string
}): Promise<DeployValidationResult> => {
  const errors: { fieldName?: string; message: string }[] = []
  const existingFields = targetFieldSeeds[params.targetType] ?? []

  if (!params.targetId.trim()) {
    errors.push({ message: "Target identifier is required." })
  }

  params.bindings.forEach((binding) => {
    if (binding.notFound) {
      errors.push({ fieldName: binding.fieldName, message: "No suitable CDM table selected." })
      return
    }
    if (!binding.tableName.trim()) {
      errors.push({ fieldName: binding.fieldName, message: "CDM table selection is missing." })
    }
    if (!binding.isCertifiedCDM) {
      errors.push({ fieldName: binding.fieldName, message: "Selected table is not a certified CDM table." })
    }
    if (existingFields.includes(binding.fieldName)) {
      errors.push({ fieldName: binding.fieldName, message: "Field already exists in target dataset." })
    }
  })

  return new Promise((resolve) => {
    setTimeout(() => resolve({ ok: errors.length === 0, errors, existingFields }), 600)
  })
}
