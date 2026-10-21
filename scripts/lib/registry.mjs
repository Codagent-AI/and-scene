// Reads the explicit presentation registry (src/presentations/index.ts) as text.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export function parseRegistrySlugs(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  return [...code.matchAll(/\bslug:\s*(['"])([^'"]+)\1/g)].map((m) => m[2])
}

export async function readRegistrySlugs(root) {
  return parseRegistrySlugs(await readFile(join(root, 'src/presentations/index.ts'), 'utf8'))
}

/** The slugs to render; throws when a required reference sample is not registered. */
export function selectRoutes(slugs, requireSample) {
  if (slugs.length === 0) throw new Error('no presentations are registered in src/presentations/index.ts')
  if (requireSample && !slugs.includes(requireSample)) {
    throw new Error(`reference sample "${requireSample}" is not registered (registered: ${slugs.join(', ')})`)
  }
  return slugs
}
