import { readFile, readdir, mkdir, copyFile, access, writeFile } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

export const templateRoot = resolve(dirname(fileURLToPath(import.meta.url)), 'templates/bootstrap')
async function exists(path) { try { await access(path); return true } catch { return false } }
async function packageAt(root) {
  try { return JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) } catch { return {} }
}
async function sourceText(root) {
  const texts = []
  async function walk(dir) {
    if (!await exists(dir)) return
    for (const item of await readdir(dir, { withFileTypes: true })) {
      if (item.isDirectory()) await walk(join(dir, item.name))
      else if (/\.(tsx?|jsx?)$/.test(item.name)) texts.push(await readFile(join(dir, item.name), 'utf8'))
    }
  }
  await walk(join(root, 'src'))
  return texts.join('\n')
}
export async function detectAnchors(root) {
  const pkg = await packageAt(root), source = await sourceText(root)
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  return {
    build: Boolean(pkg.scripts?.build && deps.react && deps.vite && deps.typescript),
    kit: /\bStep\b/.test(source) && /\bScene\b/.test(source) && /\bPresentation\b/.test(source) && /layoutId|LayoutGroup/.test(source) && /browse/.test(source) && /present/.test(source) && /fitScale|useFitScale/.test(source),
    index: /slug\s*:/.test(source) && /title\s*:/.test(source) && /load\s*:/.test(source) && /import\(/.test(source),
  }
}
export async function resolveTarget(root) {
  const anchors = await detectAnchors(root)
  if (Object.values(anchors).every(Boolean)) return root
  const pkg = await packageAt(root)
  const monorepo = Boolean(pkg.workspaces) || await exists(join(root, 'pnpm-workspace.yaml')) || await exists(join(root, 'packages')) || await exists(join(root, 'apps'))
  return monorepo ? join(root, 'presentations') : root
}
export async function scaffold(root, { confirmed = false, install = true } = {}) {
  root = resolve(root)
  const target = await resolveTarget(root)
  const anchors = await detectAnchors(target)
  const entries = await readdir(root).catch(() => [])
  if (entries.length && (!anchors.kit || !anchors.index) && !confirmed) throw new Error(`confirmation required before scaffolding target: ${target}`)
  if (Object.values(anchors).every(Boolean)) return { target, anchors, created: [] }
  const created = []
  async function copyTree(from, to) {
    await mkdir(to, { recursive: true })
    for (const item of await readdir(from, { withFileTypes: true })) {
      const src = join(from, item.name), dest = join(to, item.name)
      if (item.isDirectory()) await copyTree(src, dest)
      else if (!await exists(dest)) { await copyFile(src, dest); created.push(dest) }
    }
  }
  if (!anchors.build) {
    for (const name of ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js']) {
      const dest = join(target, name)
      if (!await exists(dest)) { await mkdir(target, { recursive: true }); await copyFile(join(templateRoot, name), dest); created.push(dest) }
    }
  }
  if (!anchors.kit) await copyTree(join(templateRoot, 'src/presentation-kit'), join(target, 'src/presentation-kit'))
  if (!anchors.index) {
    await copyTree(join(templateRoot, 'src/presentations'), join(target, 'src/presentations'))
    for (const name of ['main.tsx', 'Router.tsx', 'Landing.tsx', 'index.css']) {
      const dest = join(target, 'src', name)
      if (!await exists(dest)) { await copyFile(join(templateRoot, 'src', name), dest); created.push(dest) }
    }
  }
  await copyTree(join(templateRoot, 'scripts'), join(target, 'scripts'))
  await copyTree(join(templateRoot, 'public'), join(target, 'public'))
  const baseline = await packageAt(templateRoot), pkg = await packageAt(target)
  const merged = { ...baseline, ...pkg, scripts: { ...baseline.scripts, ...pkg.scripts }, dependencies: { ...baseline.dependencies, ...pkg.dependencies }, devDependencies: { ...baseline.devDependencies, ...pkg.devDependencies } }
  await mkdir(target, { recursive: true })
  await writeFile(join(target, 'package.json'), JSON.stringify(merged, null, 2) + '\n')
  if (!await exists(join(target, 'package-lock.json')) && !Object.keys(pkg).length) await copyFile(join(templateRoot, 'package-lock.json'), join(target, 'package-lock.json'))
  if (install) {
    const result = spawnSync('npm', ['install'], { cwd: target, stdio: 'inherit' })
    if (result.status !== 0) throw new Error('scaffold: dependency installation failed')
  }
  return { target, anchors, created }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] ?? process.cwd()
  scaffold(root, { confirmed: process.argv.includes('--confirmed') }).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1 })
}
