import { cp, mkdir, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
export const bootstrapDirectory = fileURLToPath(new URL('../templates/bootstrap/', import.meta.url))
export async function scaffold(target) {
  const destination = resolve(target)
  await mkdir(destination, { recursive: true })
  if ((await readdir(destination)).length) throw new Error('Refusing full scaffold into a non-empty target; merge only missing anchors after target confirmation')
  for (const name of await readdir(bootstrapDirectory)) {
    await cp(resolve(bootstrapDirectory, name), resolve(destination, name), { recursive: true, force: false, errorOnExist: true })
  }
  return destination
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error('Usage: scaffold.mjs <empty-target>')
    console.log(`Scaffolded ${await scaffold(process.argv[2])}; run npm ci in that directory`)
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
