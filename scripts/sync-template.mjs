// Copies the canonical kit and root verification scripts into the bootstrap template (byte-for-byte).
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

export const SYNCED = ['src/presentation-kit', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib']

const sync = (rel) => {
  const from = path.join(root, rel)
  const to = path.join(bootstrap, rel)
  rmSync(to, { recursive: true, force: true })
  mkdirSync(path.dirname(to), { recursive: true })
  cpSync(from, to, { recursive: true })
  return statSync(to).isDirectory() ? readdirSync(to).length : 1
}

for (const rel of SYNCED) console.log(`synced ${rel} (${sync(rel)})`)
