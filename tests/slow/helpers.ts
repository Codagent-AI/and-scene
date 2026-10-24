import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const ROOT = path.resolve(__dirname, '../..')

const APP_PATHS = [
  'src', 'scripts', 'public', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json',
  'tsconfig.node.json', 'tsconfig.test.json', 'vite.config.ts', 'eslint.config.js',
]

/** A disposable copy of the application that shares this checkout's node_modules. */
export function copyApp(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'and-scene-copy-'))
  for (const rel of APP_PATHS) cpSync(path.join(ROOT, rel), path.join(dir, rel), { recursive: true })
  symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'))
  return dir
}

export const discard = (dir: string) => rmSync(dir, { recursive: true, force: true })

export function run(command: string, args: string[], opts: { cwd: string; env?: Record<string, string>; timeout?: number }) {
  const result = spawnSync(command, args, {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    encoding: 'utf8',
    timeout: opts.timeout ?? 280_000,
    maxBuffer: 64 * 1024 * 1024,
  })
  return { code: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

export const edit = (file: string, from: string | RegExp, to: string) => {
  const text = readFileSync(file, 'utf8')
  const next = text.replace(from, to)
  if (next === text) throw new Error(`edit did not change ${file}: ${String(from)}`)
  writeFileSync(file, next)
}

/** Preview servers still running out of `dir`'s node_modules (should be none after a run). */
export function leftoverPreviews(dir: string): string[] {
  const { output } = run('ps', ['-eo', 'args'], { cwd: dir })
  return output.split('\n').filter((line) => line.includes(`${dir}/node_modules/vite/bin/vite.js preview`))
}
