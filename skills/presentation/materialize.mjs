import { cp, mkdir, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
export const bootstrap = new URL('./templates/bootstrap/', import.meta.url)
export async function materialize(target) {
  await mkdir(target, { recursive: true })
  if ((await readdir(target)).length) throw new Error('Full bootstrap requires an empty target; complete missing anchors without overwriting existing contracts')
  await cp(bootstrap, target, { recursive: true })
  return resolve(target)
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  if (!process.argv[2]) { console.error('Usage: materialize.mjs <empty-target>'); process.exitCode = 1 }
  else materialize(resolve(process.argv[2])).then(console.log).catch(error => { console.error(error.message); process.exitCode = 1 })
}
