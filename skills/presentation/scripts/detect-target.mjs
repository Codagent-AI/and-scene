import fs from 'node:fs/promises'
import path from 'node:path'
 
const args = process.argv.slice(2)
const base = path.resolve(args[0] || '.')
const exists = async (file) => Boolean(await fs.stat(file).catch(() => null))
const packageJson = await fs.readFile(path.join(base, 'package.json'), 'utf8').then(JSON.parse).catch(() => ({}))
const monorepo = Boolean(packageJson.workspaces) || await exists(path.join(base, 'pnpm-workspace.yaml')) || await exists(path.join(base, 'packages')) || await exists(path.join(base, 'apps'))
const dir = monorepo ? path.join(base, 'presentations') : base
const targetPackage = await fs.readFile(path.join(dir, 'package.json'), 'utf8').then(JSON.parse).catch(() => ({}))
const build = Boolean(targetPackage.scripts?.build) && Boolean(targetPackage.dependencies?.react || targetPackage.devDependencies?.react) && Boolean(targetPackage.devDependencies?.vite) && Boolean(targetPackage.devDependencies?.typescript) && await exists(path.join(dir, 'vite.config.ts')) && await exists(path.join(dir, 'src/main.tsx'))
const kitRoot = path.join(dir, 'src/presentation-kit')
const kitIndex = await fs.readFile(path.join(kitRoot, 'index.ts'), 'utf8').catch(() => '')
const kit = ['Presentation', 'Stage', 'usePresentationNav', 'useFitScale', 'Box', 'Header', 'Footer', 'Toc'].every((name) => kitIndex.includes(name)) && await exists(path.join(kitRoot, 'types.ts')) && await exists(path.join(kitRoot, 'Stage.tsx'))
const indexSource = await fs.readFile(path.join(dir, 'src/presentations/index.ts'), 'utf8').catch(() => '')
const index = /presentations\s*:\s*PresentationEntry\[\]/.test(indexSource) && (indexSource.includes('import(') || /presentations\s*:\s*PresentationEntry\[\]\s*=\s*\[\s*\]/.test(indexSource))
const empty = (await fs.readdir(base).catch(() => [])).length === 0
const anchors = { build, kit, index }
const missing = Object.keys(anchors).filter((key) => !anchors[key])
const kind = monorepo ? 'monorepo' : anchors.build && anchors.kit && anchors.index ? 'existing-app' : 'standalone'
console.log(JSON.stringify({ anchors, target: { kind, dir }, empty, missing }, null, 2))
