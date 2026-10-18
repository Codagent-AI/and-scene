import { spawn } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export function tempDir(prefix) {
  return mkdtempSync(path.join(os.tmpdir(), `and-scene-${prefix}-`))
}

/** Runs a command, resolving with its exit code and combined output. Never rejects on non-zero exit. */
export function run(command, args, { cwd, env = {}, timeoutMs = 540_000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('error', (error) => resolve({ code: 1, output: `${output}${error}` }))
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, output })
    })
  })
}

/**
 * Copies the project (without tests, build output, or dependencies) into a throwaway directory and
 * links the already-installed dependencies, so faults can be injected without touching the source checkout.
 */
export function copyProject(prefix) {
  const dir = tempDir(prefix)
  for (const entry of ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html', 'public', 'scripts']) {
    cpSync(path.join(REPO, entry), path.join(dir, entry), { recursive: true })
  }
  cpSync(path.join(REPO, 'src'), path.join(dir, 'src'), {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}src${path.sep}tests`),
  })
  symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

export function removeDir(dir) {
  rmSync(dir, { recursive: true, force: true })
}

/** Processes whose working directory is inside `dir` (Linux /proc), used to prove cleanup. */
export function processesIn(dir) {
  if (!existsSync('/proc')) return []
  const found = []
  for (const pid of readdirSync('/proc').filter((name) => /^\d+$/.test(name))) {
    try {
      const cwd = readlinkSync(`/proc/${pid}/cwd`)
      if (cwd === dir || cwd.startsWith(`${dir}${path.sep}`)) found.push(pid)
    } catch {
      // process ended or is not readable
    }
  }
  return found
}
