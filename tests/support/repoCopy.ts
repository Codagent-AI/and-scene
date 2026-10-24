import { spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ROOT } from './files.ts'

const EXCLUDE = new Set(['node_modules', 'dist', '.git', '.inspection', 'tests', 'openspec', 'skills', 'test-results', '.agent-runner', '.validator'])

/** A disposable copy of the app (sources + configs) that reuses the installed dependencies. */
export function copyRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'and-scene-copy-'))
  cpSync(ROOT, dir, { recursive: true, filter: (src) => !EXCLUDE.has(path.relative(ROOT, src).split(path.sep)[0]) })
  // Link each installed package (not the shared incremental build cache) so copies do not interfere.
  const modules = path.join(dir, 'node_modules')
  mkdirSync(modules)
  for (const name of readdirSync(path.join(ROOT, 'node_modules'))) {
    if (name !== '.tmp') symlinkSync(path.join(ROOT, 'node_modules', name), path.join(modules, name))
  }
  return dir
}

export const edit = (dir: string, file: string, change: (text: string) => string) => {
  const target = path.join(dir, file)
  const before = readFileSync(target, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`edit of ${file} changed nothing`)
  writeFileSync(target, after)
}

export const remove = (dir: string) => rmSync(dir, { recursive: true, force: true })

export interface RunResult {
  code: number | null
  output: string
}

export function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', reject)
    child.on('close', (code) => resolve({ code, output }))
  })
}

/** True if any process command line contains `needle` (used to prove preview servers are gone). */
export async function processExists(needle: string) {
  const { output } = await run('ps', ['-eo', 'args'], ROOT)
  return output.split('\n').some((line) => line.includes(needle) && !line.includes('ps -eo'))
}
