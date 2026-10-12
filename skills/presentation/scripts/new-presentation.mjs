import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const template = path.join(skillDir, 'templates/presentation')
const args = process.argv.slice(2)
const option = (name) => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1] }
const target = path.resolve(option('--target') || '.')
const slug = option('--slug')
const title = option('--title')
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !title) throw new Error('Usage: node <SKILL.md directory>/scripts/new-presentation.mjs --target <dir> --slug <slug> --title <title>')
const destination = path.join(target, 'src/presentations', slug)
await fs.mkdir(destination, { recursive: true })
const copy = async (from, to) => {
  const stat = await fs.stat(from)
  if (stat.isDirectory()) { await fs.mkdir(to, { recursive: true }); for (const name of await fs.readdir(from)) await copy(path.join(from, name), path.join(to, name)) }
  else if (!await fs.stat(to).catch(() => null)) { await fs.mkdir(path.dirname(to), { recursive: true }); await fs.copyFile(from, to) }
}
await copy(template, destination)
const talkFile = path.join(destination, 'Talk.tsx')
await fs.writeFile(talkFile, (await fs.readFile(talkFile, 'utf8')).replace('title="Presentation title"', `title={${JSON.stringify(title)}}`))
const registryFile = path.join(target, 'src/presentations/index.ts')
let registry = await fs.readFile(registryFile, 'utf8')
if (!registry.includes(`slug: "${slug}"`) && !registry.includes(`slug: '${slug}'`)) {
  const ending = registry.lastIndexOf(']')
  if (ending < 0) throw new Error(`Cannot find the presentations array in ${registryFile}`)
  const entry = `  { slug: ${JSON.stringify(slug)}, title: ${JSON.stringify(title)}, load: () => import('./${slug}/Talk') },\n`
  registry = `${registry.slice(0, ending)}${entry}${registry.slice(ending)}`
  await fs.writeFile(registryFile, registry)
}
console.log(`Created ${slug} in ${destination} and registered it in ${registryFile}`)
