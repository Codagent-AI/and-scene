import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const target = resolve(root, 'skills/presentation/templates/bootstrap')
await mkdir(target, { recursive: true })
for (const file of ['package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','eslint.config.js','index.html','.gitignore']) await cp(resolve(root, file), resolve(target, file))
for (const directory of ['src/presentation-kit', 'scripts']) await cp(resolve(root, directory), resolve(target, directory), { recursive: true, filter: path => !path.endsWith('sync-templates.mjs') })
