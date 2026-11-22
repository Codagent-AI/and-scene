import { existsSync, readdirSync, readFileSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

export const templateRoot = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))
const readPackage = dir => existsSync(join(dir, 'package.json')) ? JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) : {}
export function detectAnchors(dir) {
  const pkg = readPackage(dir)
  return {
    build: Boolean(pkg.scripts?.build && existsSync(join(dir, 'index.html')) && existsSync(join(dir, 'tsconfig.json'))),
    kit: existsSync(join(dir, 'src/presentation-kit/Presentation.tsx')) && existsSync(join(dir, 'src/presentation-kit/types.ts')),
    index: existsSync(join(dir, 'src/presentations/index.ts')),
  }
}
export function resolveTarget(cwd, anchors = detectAnchors(cwd)) {
  const root = resolve(cwd)
  if (anchors.build && anchors.kit && anchors.index) return root
  const pkg = readPackage(root)
  const monorepo = Boolean(pkg.workspaces || ['pnpm-workspace.yaml', 'apps', 'packages'].some(name => existsSync(join(root, name))))
  return monorepo ? join(root, 'presentations') : root
}
function files(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(prefix, entry.name)
    return entry.isDirectory() ? files(join(dir, entry.name), path) : [path]
  })
}
export function scaffold({ cwd, confirmed = false, install = false, anchors: inspectedAnchors } = {}) {
  if (!cwd) throw new Error('A target project path is required')
  const sourceAnchors = inspectedAnchors ?? detectAnchors(cwd)
  const target = resolveTarget(cwd, sourceAnchors)
  const anchors = target === resolve(cwd) ? sourceAnchors : detectAnchors(target)
  const nonempty = existsSync(cwd) && readdirSync(cwd).some(name => name !== '.git')
  if (nonempty && (!anchors.kit || !anchors.index) && !confirmed) {
    throw new Error(`Confirmation required before scaffolding ${target}`)
  }
  if (Object.values(anchors).every(Boolean)) return { target, copied: [], anchors, reused: true }
  mkdirSync(target, { recursive: true })
  const copied = []
  for (const name of files(templateRoot)) {
    const posix = name.split('\\').join('/')
    if (['package.json', 'package-lock.json'].includes(posix)) continue
    const group = posix.startsWith('scripts/') ? 'support' : posix.startsWith('src/presentation-kit/') ? 'kit'
      : posix.startsWith('src/presentations/') || ['src/main.tsx', 'src/Landing.tsx'].includes(posix) ? 'index' : 'build'
    if (anchors[group]) continue
    const destination = join(target, name)
    if (existsSync(destination)) continue
    mkdirSync(dirname(destination), { recursive: true })
    copyFileSync(join(templateRoot, name), destination)
    copied.push(name)
  }
  const template = readPackage(templateRoot)
  const existing = readPackage(target)
  const fresh = !existsSync(join(target, 'package.json'))
  const merged = {
    ...template, ...existing,
    scripts: { ...template.scripts, ...existing.scripts },
    dependencies: { ...template.dependencies, ...existing.dependencies },
    devDependencies: { ...template.devDependencies, ...existing.devDependencies },
  }
  // A partial host retains its own build and scripts; new commands are additive.
  writeFileSync(join(target, 'package.json'), JSON.stringify(merged, null, 2) + '\n')
  if (fresh) copyFileSync(join(templateRoot, 'package-lock.json'), join(target, 'package-lock.json'))
  if (install) {
    const result = spawnSync('npm', [fresh ? 'ci' : 'install'], { cwd: target, stdio: 'inherit' })
    if (result.status !== 0) throw new Error(`Dependency installation failed in ${target}`)
  }
  return { target, copied, anchors, reused: false }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = scaffold({ cwd: resolve(process.argv[2] || '.'), confirmed: process.argv.includes('--confirmed'), install: true })
    console.log(JSON.stringify({ ...result, target: relative(process.cwd(), result.target) || '.' }))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
