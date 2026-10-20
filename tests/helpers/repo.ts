import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

export const ROOT = process.cwd()
export const TEMPLATE = join(ROOT, 'skills', 'presentation', 'templates', 'bootstrap')
export const isTestFile = (name: string) => /\.test\.[cm]?[jt]sx?$/.test(name)

export function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

/** Non-test files under `dir`, as paths relative to it. */
export const nonTestFiles = (dir: string) => listFiles(dir).filter((f) => !isTestFile(f)).map((f) => relative(dir, f)).sort()

export const read = (path: string) => readFileSync(path, 'utf8')
export const readJson = (path: string) => JSON.parse(read(path)) as Record<string, Record<string, string>>
