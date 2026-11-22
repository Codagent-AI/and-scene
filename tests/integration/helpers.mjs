import { cp, mkdtemp, rm, symlink, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
export const root = resolve('.')
export async function temporary() { return mkdtemp(join(tmpdir(), 'and-scene-')) }
export function command(cwd, args, timeout = 180000) {
  const result = spawnSync(args[0], args.slice(1), { cwd, timeout, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', NODE_ENV: 'production' } })
  const output = (result.stdout || '') + (result.stderr || '')
  if (result.error) throw new Error(`${args.join(' ')}: ${result.error.message}\n${output}`)
  return { status: result.status, output }
}
export function success(result) { if (result.status !== 0) throw new Error(result.output); return result.output }
export async function copyApp() {
  const directory = await temporary()
  for (const name of ['src', 'scripts', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts']) await cp(join(root, name), join(directory, name), { recursive: true })
  await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir')
  return directory
}
export async function replace(directory, path, from, to) {
  const file = join(directory, path)
  const before = await readFile(file, 'utf8')
  if (!before.includes(from)) throw new Error(`fault injection missing target ${path}`)
  await writeFile(file, before.replace(from, to))
}
export async function fixture(directory, source) {
  await mkdir(join(directory, 'src/presentations/fixture'), { recursive: true })
  await writeFile(join(directory, 'src/presentations/fixture/Talk.tsx'), source)
  await writeFile(join(directory, 'src/presentations/index.ts'), `export const presentations = [{ slug: 'fixture', title: 'Fixture', load: () => import('./fixture/Talk') }]\n`)
}
export async function remove(directory) { await rm(directory, { recursive: true, force: true }) }
export function assertCleaned(output) {
  if (!output.includes('cleanup: browser and preview stopped')) throw new Error(`cleanup missing\n${output}`)
  if (!/chromium pid=\d+/.test(output)) throw new Error(`Chromium PID missing\n${output}`)
  for (const match of output.matchAll(/pid=(\d+)/g)) {
    let alive = false
    try { process.kill(Number(match[1]), 0); alive = true } catch { /* expected ESRCH */ }
    if (alive) throw new Error(`subprocess ${match[1]} still running`)
  }
}
