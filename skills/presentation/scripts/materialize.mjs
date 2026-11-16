import { cp, mkdir, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
export const bootstrap = fileURLToPath(new URL('../templates/bootstrap/', import.meta.url))
export async function materialize(target) {
  await mkdir(target, { recursive: true })
  if ((await readdir(target)).length) throw new Error('Target is non-empty: confirm the target and integrate missing anchors without overwriting existing files')
  await cp(bootstrap, target, { recursive: true })
  return target
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('Usage: materialize.mjs <empty-target>'); process.exitCode = 1 }
  else materialize(resolve(process.argv[2])).then(p => console.log(`Scaffolded ${p}; run npm ci`)).catch(e => { console.error(e.message); process.exitCode = 1 })
}
