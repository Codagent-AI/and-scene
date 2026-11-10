import { readFile, readdir, mkdir, copyFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
export const templateRoot = fileURLToPath(new URL('../templates/bootstrap/', import.meta.url))
async function exists(file) { try { await access(file); return true } catch { return false } }
async function json(file) { try { return JSON.parse(await readFile(file, 'utf8')) } catch { return {} } }
export function selectTarget(root, { complete = false, monorepo = false } = {}) { return complete || !monorepo ? root : path.join(root, 'presentations') }
export async function plan(root, knownAnchors) {
 const pkg = await json(path.join(root, 'package.json'))
 const anchors = knownAnchors ?? {
  build: !!pkg.scripts?.build && !!pkg.dependencies?.react && !!pkg.devDependencies?.vite,
  kit: await exists(path.join(root, 'src/presentation-kit/Presentation.tsx')),
  index: await exists(path.join(root, 'src/presentations/index.ts')),
 }
 const monorepo = !!pkg.workspaces || await exists(path.join(root, 'pnpm-workspace.yaml')) || await exists(path.join(root, 'packages')) || await exists(path.join(root, 'apps'))
 const complete = Object.values(anchors).every(Boolean)
 const target = selectTarget(root, { complete, monorepo })
 const targetAnchors = target === root ? anchors : { build: false, kit: false, index: false }
 return { root, target, anchors: targetAnchors, complete, needsConfirmation: (await readdir(root)).length > 0 && !complete }
}
async function copyMissing(source, target, anchors, relative = '') {
 await mkdir(target, { recursive: true })
 for (const entry of await readdir(source, { withFileTypes: true })) {
  const from = path.join(source, entry.name), to = path.join(target, entry.name)
  const rel = path.join(relative, entry.name)
  if (anchors.kit && rel.startsWith('src/presentation-kit')) continue
  if (anchors.index && (rel.startsWith('src/presentations') || ['src/Landing.tsx', 'src/Router.tsx', 'src/main.tsx'].includes(rel))) continue
  if (anchors.build && ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js'].includes(rel)) continue
  if (entry.isDirectory()) await copyMissing(from, to, anchors, rel)
  else { try { await copyFile(from, to, constants.COPYFILE_EXCL) } catch (e) { if (e.code !== 'EEXIST') throw e } }
 }
}
export async function scaffold(result, { confirmed = false, install = true } = {}) {
 if (result.complete) return
 if (result.needsConfirmation && !confirmed) throw new Error(`Confirm scaffold target ${result.target} before writing`)
 await mkdir(result.target, { recursive: true })
 await copyMissing(templateRoot, result.target, result.anchors)
 // Merge dependencies and missing scripts without replacing a host's build command.
 const file = path.join(result.target, 'package.json')
 const host = await json(file), base = await json(path.join(templateRoot, 'package.json'))
 const merged = { ...base, ...host, scripts: { ...base.scripts, ...host.scripts }, dependencies: { ...base.dependencies, ...host.dependencies }, devDependencies: { ...base.devDependencies, ...host.devDependencies } }
 const { writeFile } = await import('node:fs/promises')
 await writeFile(file, JSON.stringify(merged, null, 2) + '\n')
 if (install) {
  const child = spawnSync('npm', ['install'], { cwd: result.target, stdio: 'inherit' })
  if (child.status !== 0) throw new Error('dependency installation failed')
 }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 const args = process.argv.slice(2)
 const root = path.resolve(args.find(a => !a.startsWith('--')) ?? '.')
 const result = await plan(root)
 console.log(JSON.stringify(result, null, 2))
 if (args.includes('--apply')) await scaffold(result, { confirmed: args.includes('--confirmed') })
}
