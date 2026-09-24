import { cp, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [name, targetArgument] = process.argv.slice(2)
const allowed = new Set(['bootstrap', 'presentation', 'step'])
if (!allowed.has(name) || !targetArgument) {
  console.error('Usage: node <skill-directory>/scripts/copy-template.mjs <bootstrap|presentation|step> <target-directory>')
  process.exit(2)
}

const skillDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(skillDirectory, 'templates', name)
const target = resolve(targetArgument)
await mkdir(target, { recursive: true })
await cp(source, target, { recursive: true, force: false })
console.log(`Copied ${name} template from ${source} into ${target}; existing paths were preserved.`)
