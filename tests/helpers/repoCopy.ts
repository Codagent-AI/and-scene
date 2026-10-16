import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const SOURCE_ROOT = path.resolve(__dirname, '..', '..')
const SKIP = new Set(['node_modules', 'dist', '.git', '.inspection', 'validator_logs', 'openspec', '.validator'])

/** Disposable copy of the repo without node_modules/dist; node_modules is symlinked. */
export function makeRepoCopy(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-copy-'))
  fs.cpSync(SOURCE_ROOT, dir, {
    recursive: true,
    filter: (src) => !SKIP.has(path.basename(src)) || path.dirname(src) !== SOURCE_ROOT,
  })
  fs.symlinkSync(path.join(SOURCE_ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

export function removeCopy(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true })
}

export function edit(dir: string, rel: string, fn: (s: string) => string) {
  const file = path.join(dir, rel)
  const before = fs.readFileSync(file, 'utf8')
  const after = fn(before)
  if (after === before) throw new Error(`edit of ${rel} changed nothing`)
  fs.writeFileSync(file, after)
}

export function registerFixture(dir: string) {
  const target = path.join(dir, 'src', 'presentations', 'inspection-fixture')
  fs.mkdirSync(target, { recursive: true })
  fs.copyFileSync(path.join(SOURCE_ROOT, 'tests', 'fixtures', 'inspection-fixture', 'Talk.tsx.txt'), path.join(target, 'Talk.tsx'))
  edit(dir, 'src/presentations/index.ts', (s) =>
    s.replace(/\n\]\s*$/, "\n  { slug: 'inspection-fixture', title: 'Fixture', load: () => import('./inspection-fixture/Talk') },\n]\n"),
  )
}
