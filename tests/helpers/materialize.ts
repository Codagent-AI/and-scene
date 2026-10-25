import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '../..')
export const skillDir = path.join(repoRoot, 'skills/presentation')

export interface Result {
  code: number
  out: string
}

/** Runs a command and returns exit code plus combined output; never throws. */
export function sh(command: string, args: string[], cwd: string, env: Record<string, string> = {}): Result {
  const res = spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 })
  return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

/**
 * Scaffolds a fresh app from the distributable skill into a new temp directory,
 * invoked from a working directory outside the repository, then installs from the lockfile.
 */
export function materializeBootstrap(prefix: string): { dir: string; scaffold: Result } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
  const scaffold = sh(process.execPath, [path.join(skillDir, 'scripts/scaffold.mjs'), '--cwd', dir], os.tmpdir())
  if (scaffold.code !== 0) throw new Error(`scaffold failed\n${scaffold.out}`)
  const install = sh('npm', ['ci', '--no-audit', '--no-fund', '--prefer-offline'], dir)
  if (install.code !== 0) throw new Error(`npm ci failed\n${install.out}`)
  return { dir, scaffold }
}

export function listFiles(dir: string): string[] {
  return (fs.readdirSync(dir, { recursive: true }) as string[]).filter((f) => fs.statSync(path.join(dir, f)).isFile()).sort()
}
