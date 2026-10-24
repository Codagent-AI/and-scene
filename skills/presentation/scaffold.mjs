import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const bootstrap = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))
async function files(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(resolve(dir, entry.name), prefix + entry.name + '/') : prefix + entry.name))).flat()
}
export async function scaffold(target, requested = ['build', 'kit', 'index']) {
  if (requested.some(anchor => !['build', 'kit', 'index'].includes(anchor))) throw new Error('Unknown scaffold anchor')
  // A target without its own package.json cannot have a build anchor, so a new self-contained app always receives one.
  const hasPackage = await readFile(resolve(target, 'package.json')).then(() => true, error => { if (error.code !== 'ENOENT') throw error; return false })
  const anchors = hasPackage ? requested : [...new Set([...requested, 'build'])]
  const selected = (await files(bootstrap)).filter(path => {
    if (path.startsWith('src/presentation-kit/')) return anchors.includes('kit')
    if (path.startsWith('src/')) return anchors.includes('index')
    return anchors.includes('build') || path.startsWith('scripts/')
  }).filter(path => !['package.json', 'package-lock.json'].includes(path))
  const plan = []
  for (const path of selected) {
    const source = resolve(bootstrap, path), destination = resolve(target, path)
    let existing
    try { existing = await readFile(destination) } catch (error) { if (error.code !== 'ENOENT') throw error }
    if (existing) {
      if (!existing.equals(await readFile(source))) throw new Error(`Refusing to overwrite existing file: ${destination}`)
    } else plan.push({ source, destination })
  }
  const packagePath = resolve(target, 'package.json')
  let original
  try { original = await readFile(packagePath, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
  const template = JSON.parse(await readFile(resolve(bootstrap, 'package.json'), 'utf8'))
  const host = original ? JSON.parse(original) : template
  const combined = { ...host, scripts: { ...template.scripts, ...host.scripts }, dependencies: { ...template.dependencies, ...host.dependencies }, devDependencies: { ...template.devDependencies, ...host.devDependencies } }
  const written = []
  let wrotePackage = false
  try {
    for (const { source, destination } of plan) { await mkdir(dirname(destination), { recursive: true }); await cp(source, destination); written.push(destination) }
    await mkdir(target, { recursive: true })
    await writeFile(packagePath, JSON.stringify(combined, null, 2) + '\n'); wrotePackage = true
    if (!original) { const lock = resolve(target, 'package-lock.json'); await cp(resolve(bootstrap, 'package-lock.json'), lock, { errorOnExist: true, force: false }); written.push(lock) }
  } catch (error) {
    for (const path of written.reverse()) await rm(path, { force: true })
    if (wrotePackage) { if (original) await writeFile(packagePath, original); else await rm(packagePath, { force: true }) }
    throw error
  }
  return written
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const target = args[args.indexOf('--target') + 1]
  const anchorArg = args.indexOf('--anchors')
  try {
    if (!args.includes('--target') || !target) throw new Error('Specify --target after contract detection and required confirmation')
    await scaffold(resolve(target), anchorArg >= 0 ? args[anchorArg + 1].split(',') : undefined)
    console.log(`Scaffold copied to ${resolve(target)}. Install dependencies before use.`)
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
