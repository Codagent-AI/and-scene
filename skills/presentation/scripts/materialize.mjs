import { cp, mkdir, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
export const templateRoot = fileURLToPath(new URL('../templates/bootstrap/', import.meta.url))
export async function materialize(target) {
  await mkdir(target, { recursive: true })
  if ((await readdir(target)).some(name => name !== '.git')) throw new Error('Target is non-empty; merge only missing anchors after target confirmation')
  await cp(templateRoot, target, { recursive: true })
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('Usage: node materialize.mjs <empty-target>'); process.exitCode = 1 }
  else materialize(resolve(process.argv[2])).catch(error => { console.error(error.message); process.exitCode = 1 })
}
