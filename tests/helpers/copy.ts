import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { repoRoot } from './materialize.ts'

const SKIP = new Set(['node_modules', 'dist', '.git', 'inspection'])

/** A throwaway working copy of the repository that shares the installed dependencies. */
export function copyRepo(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
  fs.cpSync(repoRoot, dir, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) })
  fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

export function edit(dir: string, rel: string, change: (text: string) => string) {
  const file = path.join(dir, rel)
  const before = fs.readFileSync(file, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`edit of ${rel} changed nothing`)
  fs.writeFileSync(file, after)
}
