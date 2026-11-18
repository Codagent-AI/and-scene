import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
export async function fileList(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(join(directory, prefix), { withFileTypes: true })
  return (await Promise.all(entries.map(entry => {
    const path = join(prefix, entry.name)
    return entry.isDirectory() ? fileList(directory, path) : [path]
  }))).flat().sort()
}
export async function snapshot(directory: string, paths?: string[]) {
  const files = paths ?? await fileList(directory)
  return Object.fromEntries(await Promise.all([...files].sort().map(async path => [path, createHash('sha256').update(await readFile(join(directory, path))).digest('hex')])))
}
