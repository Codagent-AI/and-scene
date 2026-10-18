import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export const BOOTSTRAP = 'skills/presentation/templates/bootstrap'

const IGNORED = new Set(['node_modules', 'dist', 'artifacts'])

/** Relative paths of every file under `dir`. */
export function listFiles(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (IGNORED.has(name)) return []
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full, base) : [path.relative(base, full)]
  })
}

export const read = (file: string) => readFileSync(file)

/** Files that exist in both trees must be byte-identical, and neither may have extras. */
export function diffTrees(a: string, b: string): string[] {
  const left = listFiles(a).sort()
  const right = listFiles(b).sort()
  const problems: string[] = []
  for (const f of left) if (!right.includes(f)) problems.push(`missing from ${b}: ${f}`)
  for (const f of right) if (!left.includes(f)) problems.push(`extra in ${b}: ${f}`)
  for (const f of left) {
    if (right.includes(f) && !read(path.join(a, f)).equals(read(path.join(b, f)))) problems.push(`differs: ${f}`)
  }
  return problems
}
