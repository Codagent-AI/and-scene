import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const REPO = path.resolve(__dirname, '..')
export const SKILL_CLI = path.join(REPO, 'skills/presentation/scripts/presentation.mjs')

const dirs: string[] = []
export function tmpDir(prefix = 'and-scene-'): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix))
  dirs.push(d)
  return d
}
export function cleanupTmp() {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
}

export function run(cmd: string, args: string[], cwd: string, timeout = 280000) {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout })
  return { status: res.status, out: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

/** Materialize the bootstrap through the skill CLI, run from a cwd outside any project. */
export function materialize(opts: { install?: 'ci' | 'link' } = { install: 'link' }): string {
  const target = tmpDir('materialized-')
  const outside = tmpDir('outside-')
  const res = run('node', [SKILL_CLI, 'scaffold', target], outside)
  if (res.status !== 0) throw new Error(res.out)
  if (opts.install === 'ci') {
    const ci = run('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'], target)
    if (ci.status !== 0) throw new Error(ci.out)
  } else {
    symlinkSync(path.join(REPO, 'node_modules'), path.join(target, 'node_modules'), 'dir')
  }
  return target
}

/** A throwaway copy of this repository (no deps, build output, or git), sharing node_modules. */
export function copyRepo(): string {
  const dest = tmpDir('repo-copy-')
  cpSync(REPO, dest, {
    recursive: true,
    filter: (src) => !/(^|\/)(node_modules|dist|\.git|\.presentation-artifacts|validator_logs)(\/|$)/.test(path.relative(REPO, src)),
  })
  symlinkSync(path.join(REPO, 'node_modules'), path.join(dest, 'node_modules'), 'dir')
  return dest
}

export const read = (root: string, rel: string) => readFileSync(path.join(root, rel), 'utf8')
export const write = (root: string, rel: string, body: string) => writeFileSync(path.join(root, rel), body)
export const exists = (root: string, rel: string) => existsSync(path.join(root, rel))
