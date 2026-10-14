import { spawn } from 'node:child_process'
import { cpSync, mkdtempSync, symlinkSync } from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '..')

export function run(cmd: string, args: string[], cwd: string, env: Record<string, string> = {}) {
  return new Promise<{ code: number; output: string }>((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env } })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

/** Disposable copy of the repo (never touches the source checkout); node_modules is symlinked. */
export function copyRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'and-scene-e2e-'))
  const skip = new Set(['node_modules', 'dist', 'artifacts', '.git'])
  cpSync(repoRoot, dir, { recursive: true, filter: (src) => !skip.has(path.basename(src)) })
  symlinkSync(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

export function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.once('error', () => resolve(false))
    s.listen(port, '127.0.0.1', () => s.close(() => resolve(true)))
  })
}
