import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const REFERENCE_SLUG = 'how-to-make-a-presentation'
export const REFERENCE_TITLE = 'How to Use This Skill to Make a Presentation'

/** @param {string} registryPath */
export function readRegistrySource(registryPath) {
  return readFileSync(registryPath, 'utf-8')
}

/** @param {string} source */
export function checkPresentationsArray(source) {
  const match = source.match(/export const presentations[\s\S]*?=\s*\[([\s\S]*?)\]\s*\n/)
  if (!match) return false
  const slugPattern = new RegExp(`slug:\\s*['"]${REFERENCE_SLUG}['"]`)
  return slugPattern.test(match[1])
}

/** @param {string} rootDir */
export async function isSampleRegistered(rootDir) {
  const registryUrl = pathToFileURL(join(rootDir, 'src/presentations/index.ts')).href
  const { presentations } = await import(registryUrl)
  return presentations.some((entry) => entry.slug === REFERENCE_SLUG)
}
