import { cp, mkdir, readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
export const bootstrapDirectory = resolve(dirname(fileURLToPath(import.meta.url)), 'templates/bootstrap')
export function scaffoldPlan({ root, monorepo, anchors }) {
  if (anchors.build && anchors.kit && anchors.index) return { target: root, missing: [] }
  return { target: monorepo ? resolve(root, 'presentations') : root, missing: ['build', 'kit', 'index'].filter(k => !anchors[k]) }
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
