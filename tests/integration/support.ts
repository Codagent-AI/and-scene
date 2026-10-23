import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, stat, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = fileURLToPath(new URL('../..', import.meta.url))

const EXCLUDED = new Set(['node_modules', 'dist', '.inspection', '.git', 'validator_logs', 'test-results'])

export interface RunResult {
  code: number | null
  output: string
}

/** Runs a command, capturing combined output. Never throws on a non-zero exit. */
export function run(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs = 600_000,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, output })
    })
  })
}

export const npm = (args: string[], cwd: string, timeoutMs?: number) =>
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, cwd, timeoutMs)

/** Fresh temporary directory, removed by the caller. */
export function tempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), `${prefix}-`))
}

/**
 * Disposable copy of the repository without generated or dependency directories.
 * node_modules is linked from the source checkout so no install is repeated.
 */
export async function copyRepo(prefix: string): Promise<string> {
  const target = await tempDir(prefix)
  await cp(REPO, target, {
    recursive: true,
    filter: (source) => {
      const name = relative(REPO, source).split(/[\\/]/)[0]
      return !EXCLUDED.has(name)
    },
  })
  await symlink(join(REPO, 'node_modules'), join(target, 'node_modules'), 'dir')
  return target
}

export async function removeDir(dir: string) {
  await rm(dir, { recursive: true, force: true })
}

export async function replaceInFile(file: string, search: string, replacement: string) {
  const { writeFile } = await import('node:fs/promises')
  const text = await readFile(file, 'utf8')
  if (!text.includes(search)) throw new Error(`fault injection target not found in ${file}: ${search.slice(0, 60)}`)
  await writeFile(file, text.replace(search, replacement))
}

export async function listFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(path, base)))
    else files.push(relative(base, path))
  }
  return files.sort()
}

export async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  )
}

/** True when nothing is accepting connections on the URL (used to prove cleanup). */
export async function isClosed(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1000) })
    return false
  } catch {
    return true
  }
}
