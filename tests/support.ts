import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const REPO = process.cwd()
export const BOOTSTRAP_TEMPLATE = join(REPO, 'skills/presentation/templates/bootstrap')

/** Creates an empty scratch directory outside the repository. */
export function scratch(prefix: string): string {
  return mkdtempSync(join(tmpdir(), `${prefix}-`))
}

export function removeScratch(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}

/**
 * Copies the repository's source into a scratch directory and links the repository's installed
 * dependencies, so a throwaway copy can build and render without reinstalling.
 */
export function copyRepository(prefix: string): string {
  const dir = scratch(prefix)
  const skip = new Set(['node_modules', 'dist', '.git', 'inspection', 'validator_logs', '.validator', '.agent-runner'])
  cpSync(REPO, dir, {
    recursive: true,
    filter: (source) => {
      const first = source.slice(REPO.length + 1).split('/')[0]
      return !skip.has(first ?? '')
    },
  })
  symlinkSync(join(REPO, 'node_modules'), join(dir, 'node_modules'), 'dir')
  return dir
}

/** Copies the bootstrap template into a fresh directory. It has no installed dependencies yet. */
export function materializeTemplate(dest: string) {
  cpSync(BOOTSTRAP_TEMPLATE, dest, { recursive: true })
}

/** Replaces `search` with `replacement` in a file, failing loudly if the search text is absent. */
export function replaceInFile(file: string, search: string, replacement: string) {
  const text = readFileSync(file, 'utf8')
  if (!text.includes(search)) throw new Error(`fault seed text not found in ${file}: ${search}`)
  writeFileSync(file, text.replace(search, replacement))
}

export function run(command: string, args: string[], options: { cwd: string; timeout?: number }): SpawnSyncReturns<string> {
  return spawnSync(command, args, { cwd: options.cwd, encoding: 'utf8', timeout: options.timeout ?? 280_000 })
}

export function output(result: SpawnSyncReturns<string>): string {
  return `${result.stdout ?? ''}${result.stderr ?? ''}`
}
