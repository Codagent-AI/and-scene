import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const TEMPLATE = path.join(ROOT, 'skills/presentation/templates/bootstrap')
export const TEST_FILE = /\.test\.[cm]?[jt]sx?$/

export async function walk(dir: string, skip: readonly string[] = ['node_modules', 'dist']): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (skip.includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full, skip)))
    else out.push(full)
  }
  return out.sort()
}

export const rel = (base: string, files: string[]) => files.map((f) => path.relative(base, f).split(path.sep).join('/'))
export const text = (file: string) => readFile(file, 'utf8')
export const json = async (file: string) => JSON.parse(await text(file))
