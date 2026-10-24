import { spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'

export const repoRoot = path.resolve(__dirname, '../..')
const scratchRoot = path.join(repoRoot, 'tests/.tmp')

export interface RunResult {
  code: number | null
  output: string
}

export function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('close', (code) => resolve({ code, output }))
  })
}

export const npm = (args: string[], cwd: string, env?: NodeJS.ProcessEnv) => run(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, cwd, env)

/** A throwaway copy of the app (without dependencies, which resolve from the repository above it). */
export function copyProject(label: string): string {
  mkdirSync(scratchRoot, { recursive: true })
  const dest = mkdtempSync(path.join(scratchRoot, `${label}-`))
  for (const entry of ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'tsconfig.test.json', 'vite.config.ts', 'index.html', 'public', 'src', 'scripts', 'verify.config.json', '.npmrc']) {
    cpSync(path.join(repoRoot, entry), path.join(dest, entry), { recursive: true })
  }
  // tsconfig.test.json lists test directories this copy does not have
  writeFileSync(
    path.join(dest, 'tsconfig.json'),
    JSON.stringify({ files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }] }),
  )
  return dest
}

export function removeProject(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}

/** Resolves true when nothing accepts connections on the loopback port. */
export function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(true))
  })
}
