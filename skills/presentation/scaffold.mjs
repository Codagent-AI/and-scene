import { cp, mkdir, readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
export const bootstrapDirectory = resolve(dirname(fileURLToPath(import.meta.url)), 'templates/bootstrap')
export function detectMonorepo({ packageJSON = {}, entries = [] } = {}) {
  return packageJSON.workspaces !== undefined || ['pnpm-workspace.yaml', 'packages', 'apps'].some(name => entries.includes(name))
}
export function scaffoldPlan({ root, anchors, project = {}, monorepo = detectMonorepo(project), childAnchors = {} }) {
  if (anchors.build && anchors.kit && anchors.index) return { target: root, missing: [] }
  // Root anchors do not satisfy contracts in a separate, self-contained child app.
  const targetAnchors = monorepo ? childAnchors : anchors
  return { target: monorepo ? resolve(root, 'presentations') : root, missing: ['build', 'kit', 'index'].filter(k => !targetAnchors[k]) }
}
// Full bootstrap utility. Partial anchors are integrated by the skill, not overwritten.
export async function materialize(target, template = bootstrapDirectory) {
  await mkdir(target, { recursive: true })
  async function copy(from, to) {
    for (const entry of await readdir(from, { withFileTypes: true })) {
      const source = resolve(from, entry.name), dest = resolve(to, entry.name)
      if (entry.isDirectory()) { await mkdir(dest, { recursive: true }); await copy(source, dest) }
      else {
        if (await stat(dest).then(() => true, () => false)) throw new Error(`Refusing to overwrite ${dest}; integrate missing anchors explicitly`)
        await mkdir(dirname(dest), { recursive: true })
        await cp(source, dest, { errorOnExist: true, force: false })
      }
    }
  }
  await copy(template, resolve(target))
}
