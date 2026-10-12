import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const template = path.join(skillDir, 'templates/bootstrap')
const args = process.argv.slice(2)
const get = (key, fallback) => { const i = args.indexOf(key); return i < 0 ? fallback : args[i + 1] }
const target = path.resolve(get('--target', '.'))
const chosen = get('--anchors', 'all').split(',')
const anchors = chosen.includes('all') ? ['build', 'kit', 'index'] : chosen
const groups = {
  build: ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', 'index.html', '.gitignore', 'src/main.tsx', 'src/Landing.tsx', 'src/index.css', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs'],
  kit: ['src/presentation-kit'],
  index: ['src/presentations/index.ts'],
}
const copyMissing = async (from, to) => {
  const stat = await fs.stat(from)
  if (stat.isDirectory()) {
    await fs.mkdir(to, { recursive: true })
    for (const name of await fs.readdir(from)) await copyMissing(path.join(from, name), path.join(to, name))
  } else {
    await fs.mkdir(path.dirname(to), { recursive: true })
    if (!await fs.stat(to).catch(() => null)) await fs.copyFile(from, to)
  }
}
await fs.mkdir(target, { recursive: true })
for (const anchor of anchors) {
  for (const relative of groups[anchor] || []) await copyMissing(path.join(template, relative), path.join(target, relative))
}
const pkgFile = path.join(target, 'package.json')
const templatePkg = JSON.parse(await fs.readFile(path.join(template, 'package.json'), 'utf8'))
if (await fs.stat(pkgFile).catch(() => null)) {
  const pkg = JSON.parse(await fs.readFile(pkgFile, 'utf8'))
  for (const field of ['dependencies', 'devDependencies']) {
    pkg[field] ||= {}
    for (const [name, version] of Object.entries(templatePkg[field] || {})) if (!pkg[field][name]) pkg[field][name] = version
  }
  for (const [name, command] of Object.entries(templatePkg.scripts || {})) if (!pkg.scripts?.[name]) {
    pkg.scripts ||= {}
    pkg.scripts[name] = command
  }
  await fs.writeFile(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`)
}
console.log(`Scaffolded ${anchors.join(', ')} anchors in ${target}. Run npm install there.`)
