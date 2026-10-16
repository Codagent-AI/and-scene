import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const ROOT = join(import.meta.dirname, '..', '..')
export const SKILL = join(ROOT, 'skills/presentation')

export const makeTemp = (prefix: string) => mkdtempSync(join(tmpdir(), `and-scene-${prefix}-`))
export const removeDir = (dir: string) => rmSync(dir, { recursive: true, force: true })

export interface Result {
  code: number
  out: string
}

export function run(cmd: string, args: string[], cwd: string, env: Record<string, string> = {}): Result {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 })
  return { code: res.status ?? 1, out: `${res.stdout}${res.stderr}` }
}

/** Materializes the distributable bootstrap into a fresh directory through the skill helper, run from an unrelated cwd. */
export function materializeBootstrap(): string {
  const dir = makeTemp('bootstrap')
  const elsewhere = makeTemp('cwd')
  try {
    execFileSync('node', [join(SKILL, 'scripts/scaffold.mjs'), 'scaffold', dir], { cwd: elsewhere })
  } finally {
    removeDir(elsewhere)
  }
  return dir
}

export function npmCi(dir: string) {
  const res = run('npm', ['ci', '--no-audit', '--no-fund'], dir)
  if (res.code !== 0) throw new Error(`npm ci failed:\n${res.out}`)
}

/** Copy of the repository without dependencies or output; node_modules is shared by symlink. */
export function copyRepo(): string {
  const dir = makeTemp('repo')
  cpSync(ROOT, dir, {
    recursive: true,
    filter: (src) => !/(^|\/)(node_modules|dist|\.git|\.presentation-inspect|\.agent-runner|validator_logs)$/.test(src),
  })
  symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'))
  return dir
}

export const write = (dir: string, rel: string, text: string) => {
  mkdirSync(join(dir, rel, '..'), { recursive: true })
  writeFileSync(join(dir, rel), text)
}

export const exists = (dir: string, rel: string) => existsSync(join(dir, rel))
