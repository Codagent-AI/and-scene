import { cp, mkdir, readFile, readdir, writeFile, access } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
export const bootstrap = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))
export async function exists(path) { try { await access(path); return true } catch { return false } }
export async function materialize(target, anchors = ['build', 'kit', 'index']) {
  if (anchors.some(anchor => !['build', 'kit', 'index'].includes(anchor))) throw new Error('Unknown scaffold anchor')
  await mkdir(target, { recursive: true })
  const files = {
    build: ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', '.gitignore'],
    kit: ['src/presentation-kit'],
    index: ['src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx', 'src/index.css', 'src/presentations'],
  }
  const copyMissing = async (source, destination) => {
    const { stat } = await import('node:fs/promises')
    if ((await stat(source)).isDirectory()) {
      await mkdir(destination, { recursive: true })
      for (const entry of await readdir(source)) await copyMissing(join(source, entry), join(destination, entry))
    } else if (!await exists(destination)) {
      await mkdir(dirname(destination), { recursive: true }); await cp(source, destination)
    }
  }
  for (const anchor of anchors) for (const path of files[anchor]) await copyMissing(join(bootstrap, path), join(target, path))
  if (anchors.length) await copyMissing(join(bootstrap, 'scripts'), join(target, 'scripts'))
  const declared = JSON.parse(await readFile(join(bootstrap, 'package.json'), 'utf8'))
  const packagePath = join(target, 'package.json')
  if (!await exists(packagePath)) {
    await cp(join(bootstrap, 'package.json'), packagePath)
    if (!await exists(join(target, 'package-lock.json'))) await cp(join(bootstrap, 'package-lock.json'), join(target, 'package-lock.json'))
  } else {
    const current = JSON.parse(await readFile(packagePath, 'utf8'))
    for (const key of ['dependencies', 'devDependencies', 'scripts']) current[key] = { ...declared[key], ...current[key] }
    await writeFile(packagePath, JSON.stringify(current, null, 2) + '\n')
  }
  return target
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  if (!args[0]) throw new Error('Usage: scaffold.mjs <confirmed-target> [--anchors build,kit,index]')
  const selected = args.includes('--anchors') ? args[args.indexOf('--anchors') + 1].split(',') : undefined
  await materialize(resolve(args[0]), selected)
}
