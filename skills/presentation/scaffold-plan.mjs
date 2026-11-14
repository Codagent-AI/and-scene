import { resolve } from 'node:path'
import { fileURLToPath, URL as NodeURL } from 'node:url'
export const bootstrapPath = fileURLToPath(new NodeURL('./templates/bootstrap/', import.meta.url))
export const presentationPath = fileURLToPath(new NodeURL('./templates/presentation/', import.meta.url))
// Anchors are semantic findings supplied by the agent, not filename checks.
export function scaffoldPlan({ directory, anchors, monorepo = false, nonEmpty = false, existingApp = false }) {
  const target = existingApp || !monorepo ? resolve(directory) : resolve(directory, 'presentations')
  const found = existingApp || !monorepo ? anchors : { build: false, kit: false, index: false }
  const missing = ['build', 'kit', 'index'].filter(key => !found[key])
  return { target, missing, confirmationRequired: nonEmpty && missing.length > 0 && (!found.kit || !found.index) }
}
