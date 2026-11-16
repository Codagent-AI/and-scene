import { cp, mkdir, readFile, readdir, writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'
const template = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))
const args = process.argv.slice(2)
const target = args[0] === '--target' && args[1] ? resolve(args[1]) : null
const anchors = args[2] === '--anchors' ? args[3]?.split(',') : null
if (!target || !anchors?.length || anchors.some(anchor => !['build', 'kit', 'index'].includes(anchor))) {
  console.error('Usage: node bootstrap.mjs --target <authorized-target> --anchors build,kit,index'); process.exit(1)
}
const exists = async file => access(file).then(() => true, () => false)
async function files(dir) { return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(async entry => entry.isDirectory() ? files(resolve(dir, entry.name)) : [resolve(dir, entry.name)]))).flat() }
const category = path => path.startsWith('src/presentation-kit/') ? 'kit' : path.startsWith('src/') ? 'index' : 'build'
try {
  const sourcePackage = JSON.parse(await readFile(resolve(template, 'package.json'), 'utf8'))
  const packageFile = resolve(target, 'package.json')
  const hostPackage = await exists(packageFile) ? JSON.parse(await readFile(packageFile, 'utf8')) : { name: 'presentation-app', private: true, version: '0.0.0', type: 'module' }
  const planned = []
  for (const source of await files(template)) {
    const path = relative(template, source)
    if (['package.json', 'package-lock.json'].includes(path)) continue
    // Render tooling is required even when the host already owns its build anchor.
    if (!anchors.includes(category(path)) && !path.startsWith('scripts/')) continue
    const destination = resolve(target, path)
    if (await exists(destination)) {
      if ((await readFile(destination)).equals(await readFile(source))) continue
      throw new Error(`Refusing to overwrite ${destination}; integrate the missing contract manually`)
    }
    planned.push({ source, destination })
  }
  for (const { source, destination } of planned) { await mkdir(dirname(destination), { recursive: true }); await cp(source, destination) }
  for (const group of ['dependencies', 'devDependencies', 'scripts']) hostPackage[group] = { ...sourcePackage[group], ...hostPackage[group] }
  await mkdir(target, { recursive: true })
  await writeFile(packageFile, JSON.stringify(hostPackage, null, 2) + '\n')
  console.log(`Scaffolded ${anchors.join(',')} at ${target}. Run npm install here to update lock data and install all dependencies.`)
} catch (error) { console.error(error.message); process.exitCode = 1 }
