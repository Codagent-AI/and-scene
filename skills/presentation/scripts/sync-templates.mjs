import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const template = path.join(repo, 'skills/presentation/templates/bootstrap')
const sync = async (source, destination) => {
  await fs.rm(destination, { recursive: true, force: true })
  await fs.cp(source, destination, { recursive: true, filter: (item) => !item.includes('__tests__') && !item.endsWith('.test.ts') && !item.endsWith('.test.tsx') })
}
await sync(path.join(repo, 'src/presentation-kit'), path.join(template, 'src/presentation-kit'))
await sync(path.join(repo, 'scripts/inspect-presentation.mjs'), path.join(template, 'scripts/inspect-presentation.mjs'))
await sync(path.join(repo, 'scripts/verify.mjs'), path.join(template, 'scripts/verify.mjs'))
console.log('Synced canonical presentation kit, verification script, and inspection helper into bootstrap snapshot.')
