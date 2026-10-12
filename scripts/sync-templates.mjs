import { cp, mkdir, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
async function replace(source, destination) {
  const parent = path.dirname(destination)
  const temporary = path.join(parent, `.${path.basename(destination)}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`)
  await mkdir(parent, { recursive: true })
  try {
    await cp(source, temporary, {
      recursive: true,
      filter: src => !/\.(test|spec)\./.test(path.basename(src)),
    })
    await rm(destination, { recursive: true, force: true })
    await rename(temporary, destination)
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    throw error
  }
}
await replace(path.join(root, 'src/presentation-kit'), path.join(bootstrap, 'src/presentation-kit'))
for (const name of ['inspect-presentation.mjs', 'preview-utils.mjs']) {
  await replace(path.join(root, 'scripts', name), path.join(bootstrap, 'scripts', name))
}
console.log('Updated bootstrap scene kit and inspection helper snapshots.')
