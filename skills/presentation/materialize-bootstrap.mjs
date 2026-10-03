import { cp, mkdir, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const destination = process.argv[2]
if (!destination) throw new Error('Usage: node materialize-bootstrap.mjs <empty-app-directory>')
const target = resolve(destination)
await mkdir(target, { recursive: true })
if ((await readdir(target)).length) throw new Error(`Refusing to scaffold into non-empty directory: ${target}`)
const template = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))
await cp(template, target, { recursive: true })
console.log(`Materialized presentation app at ${target}`)
