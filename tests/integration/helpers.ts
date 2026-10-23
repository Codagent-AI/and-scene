import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, symlinkSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const repoRoot = path.resolve(__dirname, '../..')

const COPIED = [
  'src',
  'scripts',
  'public',
  'index.html',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'vitest.config.ts',
  'vitest.integration.config.ts',
  'eslint.config.js',
]

const dirs: string[] = []

export function tempDir(prefix = 'and-scene-') {
  const dir = mkdtempSync(path.join(tmpdir(), prefix))
  dirs.push(dir)
  return dir
}

export function cleanupDirs() {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
}

/** A throwaway copy of the repository that shares the installed dependencies. */
export function copyRepo(): string {
  const dir = tempDir('and-scene-copy-')
  for (const entry of COPIED) cpSync(path.join(repoRoot, entry), path.join(dir, entry), { recursive: true })
  symlinkSync(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

export function run(command: string, args: string[], cwd: string, timeout = 400_000) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout, env: process.env })
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '', output: `${result.stdout}${result.stderr}` }
}

export const edit = (file: string, change: (source: string) => string) =>
  writeFileSync(file, change(readFileSync(file, 'utf8')))

/** True when nothing answers on the preview address any more. */
export async function previewIsGone(output: string): Promise<boolean> {
  const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]
  if (!url) return true // no preview was started
  try {
    await fetch(`${url}/`, { signal: AbortSignal.timeout(2000) })
    return false
  } catch {
    return true
  }
}
