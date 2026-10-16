import { spawnSync, type SpawnSyncOptions } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '../..')

export function run(cmd: string, args: string[], opts: SpawnSyncOptions & { cwd: string }) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', ...opts })
  return { status: res.status, output: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

const made: string[] = []
export function tempDir(prefix: string) {
  const dir = mkdtempSync(path.join(os.tmpdir(), `and-scene-${prefix}-`))
  made.push(dir)
  return dir
}
export function cleanupTemp() {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true })
}

/** Copy a project tree (without dependencies or generated output) and link the repo's node_modules. */
export function copyProject(from: string, to: string, extraSkip: string[] = []) {
  const skip = new Set(['node_modules', 'dist', '.git', '.inspect', 'validator_logs', 'openspec', ...extraSkip])
  mkdirSync(to, { recursive: true })
  cpSync(from, to, { recursive: true, filter: (src) => !skip.has(path.basename(src)) })
  symlinkSync(path.join(repoRoot, 'node_modules'), path.join(to, 'node_modules'), 'dir')
}

export const bootstrapTemplate = path.join(repoRoot, 'skills/presentation/templates/bootstrap')
export const scaffoldScript = path.join(repoRoot, 'skills/presentation/scripts/scaffold.mjs')
export const hasDist = (dir: string) => existsSync(path.join(dir, 'dist/index.html'))

export async function portClosed(origin: string) {
  try {
    await fetch(origin, { signal: AbortSignal.timeout(2000) })
    return false
  } catch {
    return true
  }
}
