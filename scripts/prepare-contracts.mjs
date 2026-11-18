import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
export default async function prepareContracts() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const target = resolve(root, '.test-work/contracts/src')
  await rm(target, { recursive: true, force: true })
  await mkdir(target, { recursive: true })
  await cp(resolve(root, 'src/presentation-kit'), resolve(target, 'presentation-kit'), { recursive: true })
  await cp(resolve(root, 'skills/presentation/templates/presentation'), resolve(target, 'presentations/template-contract'), { recursive: true })
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepareContracts()
