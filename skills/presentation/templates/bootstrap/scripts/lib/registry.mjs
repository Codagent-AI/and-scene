import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ENTRY = /slug:\s*(['"])(.*?)\1\s*,\s*title:\s*(['"])(.*?)\3\s*,\s*load:\s*\(\)\s*=>\s*import\(\s*(['"])(.*?)\5\s*\)/gs

/** Reads `{ slug, title, load: () => import('...') }` entries from the registry source. */
export function parseRegistry(source) {
  return [...source.matchAll(ENTRY)].map((m) => ({ slug: m[2], title: m[4], loader: m[6] }))
}

export function readRegistry(root) {
  const file = join(root, 'src', 'presentations', 'index.ts')
  if (!existsSync(file)) return []
  return parseRegistry(readFileSync(file, 'utf8'))
}

export function loaderExists(root, loader) {
  const base = join(root, 'src', 'presentations', loader)
  return ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'].some((ext) => existsSync(base + ext))
}
