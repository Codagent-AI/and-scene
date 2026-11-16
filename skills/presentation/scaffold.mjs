import { cp, mkdir, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
export const bootstrap = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))
export async function materialize(target) {
  await mkdir(target, { recursive: true })
  if ((await readdir(target)).length) throw new Error('Target is not empty; use the skill’s confirmed selective merge procedure')
  await cp(bootstrap, target, { recursive: true, errorOnExist: true, force: false })
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { if (!process.argv[2]) throw new Error('Absolute target required'); if (!process.argv[2].startsWith('/')) throw new Error('Absolute target required'); await materialize(resolve(process.argv[2])) }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
