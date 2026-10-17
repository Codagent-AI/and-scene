import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const BOOTSTRAP = path.join(ROOT, 'skills/presentation/templates/bootstrap')
export const TOOL = path.join(ROOT, 'skills/presentation/scripts/presentation-tool.mjs')

const dirs: string[] = []

export function tempDir(prefix = 'and-scene-int-') {
  const dir = mkdtempSync(path.join(tmpdir(), prefix))
  dirs.push(dir)
  return dir
}

export function cleanup() {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
}

export function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 })
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

const REPO_FILES = ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html', '.npmrc', 'public', 'src', 'scripts']

/** Disposable copy of the repository (sources only) that borrows the repository's installed dependencies. */
export function copyRepo() {
  const dir = tempDir('and-scene-copy-')
  for (const rel of REPO_FILES) cpSync(path.join(ROOT, rel), path.join(dir, rel), { recursive: true })
  symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'))
  return dir
}

/** Disposable copy of the bootstrap template that borrows the repository's installed dependencies. */
export function copyTemplate() {
  const dir = tempDir('and-scene-template-')
  cpSync(BOOTSTRAP, dir, { recursive: true, filter: (src) => !src.includes('node_modules') })
  symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'))
  return dir
}

export function writeProjectFile(dir: string, rel: string, content: string) {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), content)
}
