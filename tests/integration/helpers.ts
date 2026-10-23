import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, statSync, cpSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

export const ROOT = join(import.meta.dirname, '..', '..')
export const SCAFFOLD = join(ROOT, 'skills', 'presentation', 'scripts', 'scaffold.mjs')
export const TEMPLATE = join(ROOT, 'skills', 'presentation', 'templates', 'bootstrap')

/** Lists files under a directory, relative to it, skipping dependency and output directories. */
export function listFiles(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (['node_modules', 'dist', '.inspection'].includes(entry)) return []
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? listFiles(path, base) : [relative(base, path)]
  })
}

/** Materializes the distributable bootstrap into a fresh directory outside the repository. */
export function materializeBootstrap(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  // Run from an unrelated working directory so template lookup must not depend on cwd.
  execFileSync('node', [SCAFFOLD, 'scaffold', dir], { cwd: tmpdir(), stdio: 'pipe' })
  return dir
}

/** Runs a command, returning its exit status and combined output. */
export function run(command: string, args: string[], cwd: string, timeout = 600_000) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout })
  return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

/** A disposable copy of a materialized app that reuses one installed node_modules tree. */
export function copyWithSharedModules(source: string, nodeModules: string, prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  cpSync(source, dir, { recursive: true, filter: (path) => !path.includes('node_modules') })
  symlinkSync(nodeModules, join(dir, 'node_modules'), 'dir')
  return dir
}

export function removeDir(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}
