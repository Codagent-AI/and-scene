import { cp, readdir, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
export function templatePath(name) {
 if (!['bootstrap', 'presentation'].includes(name)) throw new Error('Unknown template')
 return fileURLToPath(new URL(`./templates/${name}/`, import.meta.url))
}
// Full bootstrap only. The SKILL procedure handles partial contracts without replacement.
export async function materialize(target) {
 await mkdir(target, { recursive: true })
 if ((await readdir(target)).length) throw new Error('Full bootstrap requires an empty target; preserve existing anchors using SKILL.md')
 for (const name of await readdir(templatePath('bootstrap'))) await cp(path.join(templatePath('bootstrap'), name), path.join(target, name), { recursive: true, errorOnExist: true, force: false })
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const target = process.argv[2]
 if (!target) throw new Error('usage: node <skill-directory>/scaffold.mjs <empty-target>')
 await materialize(path.resolve(target))
 console.log(`Materialized ${templatePath('bootstrap')} into ${path.resolve(target)}`)
}
