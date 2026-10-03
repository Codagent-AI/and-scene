import { cpSync, mkdtempSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')

export function isolatedCopy(label: string) {
  const temp = mkdtempSync(join(tmpdir(), `and-scene-${label}-`))
  cpSync(root, temp, { recursive: true, filter: (source) => !source.slice(root.length).split('/').some((part) => ['node_modules', 'dist', '.git', 'artifacts'].includes(part)) })
  symlinkSync(join(root, 'node_modules'), join(temp, 'node_modules'), 'dir')
  return temp
}
