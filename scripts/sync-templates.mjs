import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
const destination = new URL('../skills/presentation/templates/bootstrap/', import.meta.url)
await mkdir(destination, { recursive: true })
for (const file of ['package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', '.gitignore', 'vitest.config.ts', 'tsconfig.tests.json']) await cp(new URL(`../${file}`, import.meta.url), new URL(file, destination))
await cp(new URL('../src/presentation-kit/', import.meta.url), new URL('src/presentation-kit/', destination), { recursive: true })
for (const file of ['browser.mjs', 'reference.mjs', 'verify.mjs', 'diagnostics.mjs', 'inspect-presentation.mjs']) await cp(new URL(file, import.meta.url), new URL(`scripts/${file}`, destination), { recursive: true })
for (const file of ['runtime.test.tsx', 'payload-contract.tsx', 'setup.ts']) await cp(new URL(`../tests/${file}`, import.meta.url), new URL(`tests/${file}`, destination), { recursive: true })
const manifest = JSON.parse(await readFile(new URL('package.json', destination), 'utf8'))
manifest.scripts.verify = 'node scripts/verify.mjs example'
manifest.scripts['test:integration'] = 'npm run verify'
await writeFile(new URL('package.json', destination), JSON.stringify(manifest, null, 2) + '\n')
