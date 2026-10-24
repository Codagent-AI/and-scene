// Shared setup for the slower integration and end-to-end suites.
import { spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const created = []

export function tmpDir(prefix) {
  const d = mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
  created.push(d)
  return d
}

export function cleanup() {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true })
}

/** Link every entry of `from`/node_modules except the shared tsc cache into `to`/node_modules. */
export function linkNodeModules(from, to) {
  mkdirSync(path.join(to, 'node_modules'), { recursive: true })
  for (const name of readdirSync(path.join(from, 'node_modules'))) {
    if (name === '.tmp') continue
    symlinkSync(path.join(from, 'node_modules', name), path.join(to, 'node_modules', name))
  }
}

/** An independent throwaway copy of this repository that never touches the source checkout. */
export function copyRepo() {
  const dest = tmpDir('and-scene-copy')
  const keep = ['src', 'scripts', 'public', 'index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'eslint.config.js']
  for (const name of [...keep, ...readdirSync(REPO).filter((n) => /^tsconfig.*\.json$/.test(n))]) {
    cpSync(path.join(REPO, name), path.join(dest, name), { recursive: true })
  }
  linkNodeModules(REPO, dest)
  return dest
}

export function run(cmd, args, { cwd, env, timeoutMs = 300_000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, out })
    })
  })
}

export const edit = (file, fn) => writeFileSync(file, fn(readFileSync(file, 'utf8')))
