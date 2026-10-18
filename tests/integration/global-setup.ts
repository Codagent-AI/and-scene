import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { TestProject } from 'vitest/node'

const ROOT = path.resolve(import.meta.dirname, '..', '..')

declare module 'vitest' {
  export interface ProvidedContext {
    appDir: string
    scaffoldResult: { written: string[]; kind: string; missing: string[] }
  }
}

/**
 * Shared, expensive setup: materialize the bootstrap template into a fresh directory
 * outside the repository, from a foreign working directory, and install it from the
 * committed lock data.
 */
export default function setup(project: TestProject) {
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-int-'))
  const foreignCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-cwd-'))
  const out = execFileSync(
    process.execPath,
    [path.join(ROOT, 'skills/presentation/scripts/scaffold.mjs'), 'apply', '--cwd', appDir, '--install'],
    { cwd: foreignCwd, encoding: 'utf8', env: { ...process.env, npm_config_prefer_offline: 'true' }, stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 },
  )
  // The JSON result is the last top-level object on stdout (npm's own output precedes it).
  const json = out.slice(out.indexOf('\n{\n') + 1)
  project.provide('appDir', appDir)
  project.provide('scaffoldResult', JSON.parse(json))
  return () => {
    fs.rmSync(appDir, { recursive: true, force: true })
    fs.rmSync(foreignCwd, { recursive: true, force: true })
  }
}
