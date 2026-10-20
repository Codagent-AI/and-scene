// Refreshes the bootstrap template's derived copies from their canonical sources:
// src/presentation-kit (minus tests), scripts/, and templates/presentation as the starter presentation.
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills', 'presentation', 'templates', 'bootstrap')
const isTest = (file) => /\.test\.tsx?$/.test(file) || path.basename(file).startsWith('testing.')

function copyTree(from, to) {
  rmSync(to, { recursive: true, force: true })
  mkdirSync(to, { recursive: true })
  for (const name of readdirSync(from)) {
    const source = path.join(from, name)
    if (isTest(source)) continue
    if (statSync(source).isDirectory()) copyTree(source, path.join(to, name))
    else cpSync(source, path.join(to, name))
  }
}

copyTree(path.join(root, 'src', 'presentation-kit'), path.join(bootstrap, 'src', 'presentation-kit'))
copyTree(path.join(root, 'scripts'), path.join(bootstrap, 'scripts'))
copyTree(path.join(root, 'skills', 'presentation', 'templates', 'presentation'), path.join(bootstrap, 'src', 'presentations', 'getting-started'))
console.log('templates synced')
