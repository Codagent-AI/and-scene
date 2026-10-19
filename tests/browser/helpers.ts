import { spawn } from 'node:child_process'
import {
  cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const repo = path.resolve('.')
const created: string[] = []

export function tempDir(prefix: string) {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix))
  created.push(dir)
  return dir
}

export function cleanupTempDirs() {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true })
}

const SKIP = new Set(['node_modules', 'dist', 'artifacts', '.git', 'validator_logs', '.agent-runner', '.validator'])

/**
 * Independent disposable checkout of the repository. Dependencies are linked
 * entry by entry so each copy keeps its own build caches.
 */
export function copyRepo(prefix = 'and-scene-') {
  const dir = tempDir(prefix)
  for (const name of readdirSync(repo)) {
    if (!SKIP.has(name)) cpSync(path.join(repo, name), path.join(dir, name), { recursive: true })
  }
  const modules = path.join(dir, 'node_modules')
  mkdirSync(modules)
  for (const name of readdirSync(path.join(repo, 'node_modules'))) {
    if (name !== '.tmp' && name !== '.vite') symlinkSync(path.join(repo, 'node_modules', name), path.join(modules, name))
  }
  return dir
}

export function editFile(file: string, change: (source: string) => string) {
  const before = readFileSync(file, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`edit changed nothing in ${file}`)
  writeFileSync(file, after)
}

export interface RunResult {
  code: number
  output: string
}

export function runNpm(cwd: string, args: string[], timeoutMs = 220_000): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn('npm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: '1' } })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? 1, output })
    })
  })
}

export function previewUrls(output: string) {
  return [...output.matchAll(/http:\/\/[^\s/]+:\d+/g)].map((m) => m[0])
}

/** True when nothing answers on the preview address any more. */
export async function previewIsGone(output: string) {
  const base = /preview listening on (http:\/\/127\.0\.0\.1:\d+)/.exec(output)?.[1]
  if (!base) return true
  try {
    await fetch(`${base}/`, { signal: AbortSignal.timeout(2000) })
    return false
  } catch {
    return true
  }
}
