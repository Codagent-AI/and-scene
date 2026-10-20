import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

export const repoRoot = process.cwd()

/** Relative POSIX paths of every file under dir, skipping heavy directories. */
export function listFiles(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (['node_modules', '.git', 'dist'].includes(name)) return []
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full, base) : [path.relative(base, full).split(path.sep).join('/')]
  })
}

export const isTestFile = (rel: string) => /\.test\.(ts|tsx)$/.test(rel) || rel.split('/').includes('__fixtures__')
