import { cp, mkdir, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const bootstrapSource = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))

/** Full scaffold only. Compatible/partial hosts are merged by the skill procedure. */
export async function materializeBootstrap(destination) {
  const target = resolve(destination)
  await mkdir(target, { recursive: true })
  if ((await readdir(target)).length) {
    throw new Error(`Refusing to overwrite non-empty scaffold target: ${target}`)
  }
  await cp(bootstrapSource, target, { recursive: true, force: false, errorOnExist: true })
  return target
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) {
    console.error('Usage: node materialize-bootstrap.mjs <empty-target>')
    process.exitCode = 1
  } else {
    try {
      console.log(`Scaffolded ${await materializeBootstrap(process.argv[2])}`)
    } catch (error) {
      console.error(error.message)
      process.exitCode = 1
    }
  }
}
