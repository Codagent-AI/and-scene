import { cp, mkdir, readFile, readdir, access, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
export const templateRoot = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))
const groups = {
  build: ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', '.gitignore'],
  kit: ['src/presentation-kit'],
  index: ['src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx', 'src/index.css', 'src/presentations'],
}
async function exists(path) { try { await access(path); return true } catch { return false } }
export async function materialize(target, anchors = ['build', 'kit', 'index']) {
  const paths = []
  for (const anchor of anchors) {
    if (!groups[anchor]) throw new Error(`Unknown anchor ${anchor}`)
    paths.push(...groups[anchor])
  }
  // Preflight recursively so a partial scaffold never overwrites an existing contract.
  async function files(relative) {
    const source = join(templateRoot, relative)
    const entries = await readdir(source, { withFileTypes: true }).catch(error => { if (error.code === 'ENOTDIR') return null; throw error })
    if (!entries) return [relative]
    return (await Promise.all(entries.map(entry => files(join(relative, entry.name))))).flat()
  }
  const copies = (await Promise.all(paths.map(files))).flat()
  for (const path of copies) if (await exists(join(target, path))) throw new Error(`Refusing to overwrite ${path}; adapt the missing anchor explicitly`)
  // Verification support is required even when a host already supplies its build anchor.
  for (const path of await files('scripts')) if (!await exists(join(target, path))) copies.push(path)
  const required = JSON.parse(await readFile(join(templateRoot, 'package.json'), 'utf8'))
  const packagePath = join(target, 'package.json')
  const existing = await exists(packagePath) ? JSON.parse(await readFile(packagePath, 'utf8')) : null
  await mkdir(target, { recursive: true })
  for (const path of copies) { await mkdir(resolve(target, path, '..'), { recursive: true }); await cp(join(templateRoot, path), join(target, path), { errorOnExist: true, force: false }) }
  if (existing) {
    for (const key of ['dependencies', 'devDependencies']) existing[key] = { ...required[key], ...existing[key] }
    existing.scripts = { ...required.scripts, ...existing.scripts }
    await writeFile(packagePath, JSON.stringify(existing, null, 2) + '\n')
  } else {
    await cp(join(templateRoot, 'package.json'), packagePath)
    await cp(join(templateRoot, 'package-lock.json'), join(target, 'package-lock.json'))
  }
  return copies
}
if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  const target = process.argv[2]
  if (!target) { console.error('Usage: bootstrap.mjs <target> [build,kit,index]'); process.exitCode = 1 }
  else materialize(resolve(target), process.argv[3]?.split(',')).then(paths => console.log(`Scaffolded ${paths.length} files in ${resolve(target)}; install dependencies before building`)).catch(error => { console.error(error.message); process.exitCode = 1 })
}
