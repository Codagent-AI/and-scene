import { cp } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
for (const directory of ['src/presentation-kit', 'scripts']) await cp(resolve(root, directory), resolve(root, 'skills/presentation/templates/bootstrap', directory), { recursive: true, filter: path => !path.endsWith('sync-templates.mjs') })
