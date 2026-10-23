import { cpSync, mkdirSync, readdirSync, readlinkSync, realpathSync, symlinkSync } from 'node:fs'
import net from 'node:net'
import { join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

export const REPO = join(__dirname, '..', '..')

const COPIED = [
  'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json',
  'tsconfig.node.json', 'tsconfig.test.json', 'verify.config.json', 'eslint.config.js', 'public', 'src', 'scripts', 'tests/types',
]

/**
 * An isolated copy of the repository (sources only). `node_modules` is rebuilt from symlinks so
 * the copy can build without sharing tsc's incremental state with the source checkout.
 */
export function copyProject(dest: string) {
  mkdirSync(dest, { recursive: true })
  for (const entry of COPIED) cpSync(join(REPO, entry), join(dest, entry), { recursive: true })
  const modules = join(dest, 'node_modules')
  mkdirSync(modules)
  for (const name of readdirSync(join(REPO, 'node_modules'))) {
    if (name === '.tmp' || name === '.vite' || name === '.vite-temp') continue
    symlinkSync(join(REPO, 'node_modules', name), join(modules, name))
  }
}

export interface RunResult {
  status: number | null
  stdout: string
  stderr: string
}

export function run(cmd: string, args: string[], cwd: string, timeoutMs = 300_000): RunResult {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: timeoutMs, env: { ...process.env, CI: '1' } })
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

/**
 * True when any live process has `dir` (or a subdirectory) as its working directory. The preview
 * server runs with the project as cwd, so this finds a leaked one even when its executable and
 * arguments resolve into another checkout through symlinked dependencies.
 */
export function hasLeakedProcess(dir: string): boolean {
  const root = realpathSync(dir)
  for (const pid of readdirSync('/proc').filter((n) => /^\d+$/.test(n))) {
    try {
      const cwd = readlinkSync(`/proc/${pid}/cwd`)
      if (cwd === root || cwd.startsWith(root + '/')) return true
    } catch {
      // process ended or is not inspectable
    }
  }
  return false
}

/** The preview port a verify run announced (`ok preview http://127.0.0.1:PORT`), if it got that far. */
export const announcedPort = (stdout: string): number | null => {
  const m = /ok preview http:\/\/127\.0\.0\.1:(\d+)/.exec(stdout)
  return m ? Number(m[1]) : null
}

/** True when nothing accepts connections on the loopback port. */
export function isPortClosed(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => (socket.destroy(), resolve(false)))
    socket.once('error', () => resolve(true))
  })
}

export { spawn }
