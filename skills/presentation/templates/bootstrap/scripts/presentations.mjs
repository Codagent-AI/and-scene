import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const SLUG_PATTERN = /^[a-z0-9-]+$/
const REGISTRY_SLUGS = /slug:\s*['"]([a-z0-9-]+)['"]/g

export function validateSlug(slug) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`invalid presentation slug "${slug}"`)
  return slug
}

// Slugs are read from the registry source rather than the built app, so registries
// must declare them as literals.
export async function registeredSlugs(root) {
  const source = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
  const slugs = [...source.matchAll(REGISTRY_SLUGS)].map((match) => validateSlug(match[1]))
  if (slugs.length === 0) throw new Error('no registered presentations found')
  return slugs
}
