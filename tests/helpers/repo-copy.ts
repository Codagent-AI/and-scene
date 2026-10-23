import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, symlinkSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const REPO = path.resolve(import.meta.dirname, '..', '..')
const COPIED = [
  'src', 'scripts', 'public', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json',
  'tsconfig.app.json', 'tsconfig.node.json', 'tsconfig.test.json', 'vite.config.ts',
  'vitest.config.ts', 'vitest.integration.config.ts', 'tests/setup.ts',
]

/** Disposable copy of the project sharing the installed dependencies; never touches the source. */
export function copyRepo(prefix = 'and-scene-copy-') {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix))
  for (const rel of COPIED) cpSync(path.join(REPO, rel), path.join(dir, rel), { recursive: true })
  symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return {
    dir,
    read: (rel: string) => readFileSync(path.join(dir, rel), 'utf8'),
    write: (rel: string, text: string) => writeFileSync(path.join(dir, rel), text),
    edit(rel: string, from: string | RegExp, to: string) {
      const before = readFileSync(path.join(dir, rel), 'utf8')
      const after = before.replace(from, to)
      if (after === before) throw new Error(`edit of ${rel} changed nothing`)
      writeFileSync(path.join(dir, rel), after)
    },
    remove: () => rmSync(dir, { recursive: true, force: true }),
  }
}

export function sh(command: string, args: string[], cwd: string, timeout = 280_000) {
  const r = spawnSync(command, args, { cwd, encoding: 'utf8', timeout, env: { ...process.env, FORCE_COLOR: '0' } })
  return { status: r.status, out: `${r.stdout}${r.stderr}` }
}
