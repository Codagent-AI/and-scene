import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const templateRoot = fileURLToPath(new URL('../templates/bootstrap/', import.meta.url))
const anchorNames = ['build', 'kit', 'index']
const exists = async path => Boolean(await stat(path).catch(() => null))
const json = async path => JSON.parse(await readFile(path, 'utf8'))

export async function planScaffold(project, anchors = [], targetAnchors) {
  if ([...anchors, ...(targetAnchors ?? [])].some(anchor => !anchorNames.includes(anchor))) throw new Error('Unknown anchor; use build, kit, index')
  const root = resolve(project)
  const pkg = await json(join(root, 'package.json')).catch(() => ({}))
  const complete = anchorNames.every(anchor => anchors.includes(anchor))
  const monorepo = Boolean(pkg.workspaces) || await exists(join(root, 'pnpm-workspace.yaml')) || await exists(join(root, 'packages')) || await exists(join(root, 'apps'))
  // A complete app is already the target, even if it also has workspace signals.
  const target = monorepo && (!complete || targetAnchors !== undefined) ? join(root, 'presentations') : root
  if (target !== root && targetAnchors === undefined && (await readdir(target).catch(() => [])).length) {
    throw new Error(`Inspect existing presentation app at ${target}; supply its confirmed --target-anchors (or none) before planning`)
  }
  const present = target === root ? anchors : (targetAnchors ?? [])
  const missing = anchorNames.filter(anchor => !present.includes(anchor))
  const entries = await readdir(root).catch(() => [])
  return { root, target, missing, confirmationRequired: entries.length > 0 && (missing.includes('kit') || missing.includes('index')) }
}

async function copyMissing(source, target) {
  if ((await stat(source)).isDirectory()) {
    await mkdir(target, { recursive: true })
    for (const entry of await readdir(source)) await copyMissing(join(source, entry), join(target, entry))
  } else if (!await exists(target)) {
    await mkdir(dirname(target), { recursive: true })
    await cp(source, target, { errorOnExist: true, force: false })
  }
}

export async function materialize(plan, { confirmed = false } = {}) {
  if (plan.confirmationRequired && !confirmed) throw new Error(`Confirmation required before scaffolding ${plan.target}`)
  if (!plan.missing.length) return plan
  await mkdir(plan.target, { recursive: true })
  if (plan.missing.includes('build')) {
    for (const entry of await readdir(templateRoot)) {
      if (entry !== 'src') await copyMissing(join(templateRoot, entry), join(plan.target, entry))
    }
    await copyMissing(join(templateRoot, 'src/main.tsx'), join(plan.target, 'src/main.tsx'))
  }
  if (plan.missing.includes('kit')) await copyMissing(join(templateRoot, 'src/presentation-kit'), join(plan.target, 'src/presentation-kit'))
  if (plan.missing.includes('index')) {
    await copyMissing(join(templateRoot, 'src/presentations'), join(plan.target, 'src/presentations'))
    await copyMissing(join(templateRoot, 'src/Landing.tsx'), join(plan.target, 'src/Landing.tsx'))
  }
  // Helpers and dependencies are needed for new infrastructure even in a partial host.
  await copyMissing(join(templateRoot, 'scripts'), join(plan.target, 'scripts'))
  const template = await json(join(templateRoot, 'package.json'))
  const packageFile = join(plan.target, 'package.json')
  const current = await json(packageFile).catch(() => ({}))
  const merged = {
    ...current,
    scripts: { ...template.scripts, ...current.scripts },
    dependencies: { ...template.dependencies, ...current.dependencies },
    devDependencies: { ...template.devDependencies, ...current.devDependencies },
  }
  await writeFile(packageFile, JSON.stringify(merged, null, 2) + '\n')
  return plan
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2)
    if (!args[0] || args[0].startsWith('--')) throw new Error('Usage: scaffold.mjs <project> [--anchors build,kit,index] [--target-anchors build,kit,index|none] [--apply --confirm]')
    const index = args.indexOf('--anchors')
    const anchors = index < 0 ? [] : (args[index + 1] ?? '').split(',').filter(Boolean)
    const targetIndex = args.indexOf('--target-anchors')
    const targetValue = args[targetIndex + 1]
    if (targetIndex >= 0 && (!targetValue || targetValue.startsWith('--'))) throw new Error('--target-anchors requires confirmed anchor names or none')
    const targetAnchors = targetIndex < 0 ? undefined : targetValue === 'none' ? [] : targetValue.split(',').filter(Boolean)
    const plan = await planScaffold(args[0], anchors, targetAnchors)
    console.log(JSON.stringify(plan, null, 2))
    if (args.includes('--apply')) await materialize(plan, { confirmed: args.includes('--confirm') })
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
