import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
const target = 'skills/presentation/templates/bootstrap'
await mkdir(target, { recursive: true })
for (const file of ['package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','eslint.config.js','.gitignore','public','src','scripts']) {
 if (file === 'scripts') {
   await mkdir(`${target}/scripts`, { recursive: true })
   for (const script of ['browser.mjs','verify.mjs','diagnostics.mjs','inspect-presentation.mjs','reference.json']) await cp(`scripts/${script}`, `${target}/scripts/${script}`)
 } else await cp(file, `${target}/${file}`, { recursive: true })
}

const pkg = JSON.parse(await readFile(`${target}/package.json`, 'utf8'))
pkg.scripts.test = 'vitest run --passWithNoTests'
delete pkg.scripts['test:integration']
await writeFile(`${target}/package.json`, JSON.stringify(pkg, null, 2) + '\n')
