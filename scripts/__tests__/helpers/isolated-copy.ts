import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, statSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

const EXCLUDED_TOP_LEVEL = new Set(['node_modules', '.git', 'dist', 'inspection', 'validator_logs'])

/**
 * Copies the whole repository (minus `node_modules`/build/inspection output)
 * into a fresh temp directory, then symlinks `node_modules` back to this
 * checkout's install so isolated-copy tests don't pay for a second `npm ci`.
 * The source checkout is never written to.
 */
export function createIsolatedRepoCopy(prefix: string): string {
  const tempDir = mkdtempSync(path.join(tmpdir(), prefix))
  cpSync(REPO_ROOT, tempDir, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(REPO_ROOT, source)
      if (relative === '') return true
      const topLevel = relative.split(path.sep)[0]
      return !EXCLUDED_TOP_LEVEL.has(topLevel)
    },
  })
  symlinkSync(path.join(REPO_ROOT, 'node_modules'), path.join(tempDir, 'node_modules'), 'dir')
  return tempDir
}

export function removeIsolatedRepoCopy(tempDir: string): void {
  rmSync(tempDir, { recursive: true, force: true })
}

/** Process env that points Playwright at the sandbox's pre-cached browsers when present. */
export function playwrightEnv(): NodeJS.ProcessEnv {
  const browsersPath = statSync('/ms-playwright', { throwIfNoEntry: false })?.isDirectory() ? '/ms-playwright' : undefined
  return { ...process.env, ...(browsersPath ? { PLAYWRIGHT_BROWSERS_PATH: browsersPath } : {}) }
}

/** Runs `npm run verify` in `cwd` with the Playwright browser env. */
export function runVerify(cwd: string) {
  return spawnSync('npm', ['run', 'verify'], { cwd, encoding: 'utf8', env: playwrightEnv() })
}
