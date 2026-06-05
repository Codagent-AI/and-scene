import { readFileSync } from 'node:fs'

export const REFERENCE_SLUG = 'how-to-make-a-presentation'
export const REFERENCE_TITLE = 'How to Use This Skill to Make a Presentation'

/** @param {string} registryPath */
export function readRegistrySource(registryPath) {
  return readFileSync(registryPath, 'utf-8')
}

/** @param {string} source */
export function checkSampleRegistered(source) {
  return source.includes(`slug: '${REFERENCE_SLUG}'`) || source.includes(`slug: "${REFERENCE_SLUG}"`)
}
