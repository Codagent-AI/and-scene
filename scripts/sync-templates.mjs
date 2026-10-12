import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
async function replace(source, destination) {
  await rm(destination, { recursive: true, force: true })
  await mkdir(path.dirname(destination), { recursive: true })
  await cp(source, destination, { recursive: true, filter: src => !/(\.test\.|\.spec\.)/.test(src) })
}
await replace(path.join(root, 'src/presentation-kit'), path.join(bootstrap, 'src/presentation-kit'))
for (const name of ['inspect-presentation.mjs', 'preview-utils.mjs']) {
  await replace(path.join(root, 'scripts', name), path.join(bootstrap, 'scripts', name))
}
console.log('Updated bootstrap scene kit and inspection helper snapshots.')
