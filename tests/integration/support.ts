import { execFileSync, spawn } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const REPO = path.resolve('.')
const made: string[] = []

export function tempDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `and-scene-${prefix}-`))
  made.push(d)
  return d
}

export function cleanupTempDirs() {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true })
}

/** Git state of the source checkout, to prove disposable runs never touch it. */
export function sourceState(): string {
  return execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: REPO, encoding: 'utf8' })
}

const COPY = ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html', 'eslint.config.js', '.npmrc', 'public', 'scripts', 'src']

/** A disposable copy of the repository that shares the source's installed node_modules. */
export function throwawayCopy(prefix: string): string {
  const dir = tempDir(prefix)
  for (const rel of COPY) cpSync(path.join(REPO, rel), path.join(dir, rel), { recursive: true })
  symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

export function edit(dir: string, rel: string, fn: (text: string) => string) {
  const file = path.join(dir, rel)
  const before = readFileSync(file, 'utf8')
  const after = fn(before)
  if (after === before) throw new Error(`edit did not change ${rel}`)
  writeFileSync(file, after)
}

export interface Result {
  code: number | null
  output: string
}

export function run(command: string, args: string[], cwd: string, env: Record<string, string> = {}): Promise<Result> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ code, output }))
  })
}

export function alive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function canBind(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)))
  })
}

export function listFiles(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir).sort() : []
}
