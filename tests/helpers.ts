import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const REPO = path.resolve(import.meta.dirname, '..')

const SKIP_TOP = new Set(['node_modules', 'dist', '.git', '.inspection', 'openspec', 'tests', 'skills', '.agent-runner', '.validator'])

export interface RunResult {
  status: number | null
  stdout: string
  stderr: string
  output: string
}

export function makeTempDir(prefix = 'and-scene-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

export function removeDir(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true })
}

/**
 * Disposable copy of the repository's app sources. `node_modules` entries are
 * symlinked (except build caches) so copies share installed dependencies
 * without sharing TypeScript or Vite incremental state.
 */
export function copyRepo(dest: string): string {
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(REPO)) {
    if (SKIP_TOP.has(name)) continue
    fs.cpSync(path.join(REPO, name), path.join(dest, name), { recursive: true })
  }
  const nm = path.join(dest, 'node_modules')
  fs.mkdirSync(nm)
  for (const name of fs.readdirSync(path.join(REPO, 'node_modules'))) {
    if (name === '.tmp' || name === '.vite' || name === '.vite-temp') continue
    fs.symlinkSync(path.join(REPO, 'node_modules', name), path.join(nm, name))
  }
  return dest
}

export function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): RunResult {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 })
  const stdout = res.stdout ?? ''
  const stderr = res.stderr ?? ''
  return { status: res.status, stdout, stderr, output: `${stdout}${stderr}` }
}

/** Like `run`, without blocking the event loop. */
export function runAsync(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env } })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('close', (status) => resolve({ status, stdout, stderr, output: `${stdout}${stderr}` }))
  })
}

export function editFile(file: string, edit: (text: string) => string) {
  const before = fs.readFileSync(file, 'utf8')
  const after = edit(before)
  if (after === before) throw new Error(`edit did not change ${file}`)
  fs.writeFileSync(file, after)
}

/** True when nothing accepts connections at the URL any more. */
export async function isClosed(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) })
    return false
  } catch {
    return true
  }
}
