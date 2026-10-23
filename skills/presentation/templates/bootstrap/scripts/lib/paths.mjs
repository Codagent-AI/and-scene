import { join } from 'node:path'

/** Screenshot directory for one presentation, relative to the project root. */
export function inspectionDirectory(root, slug, viewportName) {
  const name = viewportName === 'narrow' ? `${slug}-narrow` : slug
  return join(root, 'inspection', name)
}

export function stepFileName(index) {
  return `step-${String(index + 1).padStart(2, '0')}.png`
}
