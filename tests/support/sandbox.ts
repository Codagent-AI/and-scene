import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const REPO = path.resolve(import.meta.dirname, '../..')

export interface RunResult {
  code: number | null
  stdout: string
  stderr: string
}

export function run(command: string, args: string[], cwd: string, env: Record<string, string> = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

export const tempDir = (prefix: string) => mkdtemp(path.join(tmpdir(), `${prefix}-`))
export const remove = (dir: string) => rm(dir, { recursive: true, force: true })

const SKIP = new Set(['.git', 'node_modules', 'dist', 'artifacts', 'validator_logs', '.agent-runner', '.validator'])

/** Copy the repository (sources only) into `dest`, with node_modules linked from the real one. */
export async function copyRepo(dest: string) {
  await cp(REPO, dest, {
    recursive: true,
    filter: (src) => !SKIP.has(path.basename(src)),
  })
  await linkNodeModules(REPO, dest)
}

/**
 * node_modules as a real directory of symlinks, so tool caches under node_modules/.tmp stay
 * private to the copy instead of leaking into the source checkout.
 */
export async function linkNodeModules(from: string, to: string) {
  const target = path.join(to, 'node_modules')
  await mkdir(target, { recursive: true })
  for (const name of await readdir(path.join(from, 'node_modules'))) {
    if (name === '.tmp') continue
    await symlink(path.join(from, 'node_modules', name), path.join(target, name))
  }
}

export async function isListening(origin: string): Promise<boolean> {
  try {
    await fetch(origin, { signal: AbortSignal.timeout(1500) })
    return true
  } catch {
    return false
  }
}
