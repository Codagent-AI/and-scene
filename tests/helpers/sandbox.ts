import { spawn } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '../..')
const created: string[] = []

export function tempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), `${prefix}-`))
  created.push(dir)
  return dir
}

export function cleanupSandboxes(): void {
  while (created.length) rmSync(created.pop() as string, { recursive: true, force: true })
}

const COPIED = ['src', 'scripts', 'public', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vitest.integration.config.ts']

/** Disposable copy of the repository sharing the installed node_modules. */
export function copyRepo(): string {
  const dir = tempDir('and-scene-copy')
  for (const name of COPIED) cpSync(path.join(repoRoot, name), path.join(dir, name), { recursive: true })
  symlinkSync(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

export interface RunResult {
  code: number | null
  out: string
}

export function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('close', (code) => resolve({ code, out }))
  })
}

export function edit(file: string, change: (text: string) => string): void {
  const before = readFileSync(file, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`edit changed nothing in ${file}`)
  writeFileSync(file, after)
}

/** Preview processes whose command line mentions this directory (should be none after a run). */
export async function leftoverProcesses(dir: string): Promise<string[]> {
  const { out } = await run('pgrep', ['-f', dir], '/')
  return out.split('\n').filter(Boolean)
}
