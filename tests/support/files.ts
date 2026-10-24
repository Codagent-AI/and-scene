import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

export const ROOT = path.resolve(import.meta.dirname, '..', '..')
export const read = (...parts: string[]) => readFileSync(path.join(ROOT, ...parts), 'utf8')
export const readJson = (...parts: string[]) => JSON.parse(read(...parts))

export function walk(dir: string, skip = new Set(['node_modules', 'dist', '.git', '.inspection'])): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full, skip))
    else out.push(full)
  }
  return out
}

/** Source text with comments removed, so scans look at code only. */
export function stripComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}
