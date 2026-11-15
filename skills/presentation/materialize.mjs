import { cp, readdir, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
export const bootstrapDirectory = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))
export async function materialize(target) {
  await mkdir(target, { recursive: true })
  if ((await readdir(target)).length) throw new Error('Full materialization requires an empty resolved target; integrate missing anchors separately after confirmation')
  await cp(bootstrapDirectory, target, { recursive: true, force: false, errorOnExist: true })
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('Usage: materialize.mjs <empty-resolved-target>'); process.exitCode = 1 }
  else materialize(path.resolve(process.argv[2])).catch(error => { console.error(error.message); process.exitCode = 1 })
}
