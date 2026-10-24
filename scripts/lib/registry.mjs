import fs from 'node:fs'
import path from 'node:path'

/** Slugs registered in `src/presentations/index.ts`, in registry order. */
export function readRegisteredSlugs(root) {
  const file = path.join(root, 'src', 'presentations', 'index.ts')
  if (!fs.existsSync(file)) return []
  return parseSlugs(fs.readFileSync(file, 'utf8'))
}

export function parseSlugs(source) {
  return [...source.matchAll(/\bslug:\s*(['"`])([^'"`]+)\1/g)].map((m) => m[2])
}
