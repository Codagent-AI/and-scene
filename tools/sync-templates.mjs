// Refreshes skills/presentation/templates/bootstrap from the canonical sources:
// src/presentation-kit and scripts/ are copied byte-for-byte (tests excluded), and the
// example presentation is rendered from templates/presentation.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderTemplate } from '../skills/presentation/scripts/new-presentation.mjs'
import { BOOTSTRAP_DIR, PRESENTATION_TEMPLATE_DIR } from '../skills/presentation/scripts/scaffold.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const isTest = (name) => /\.test\.[cm]?[jt]sx?$/.test(name)

function sync(from, to) {
  fs.rmSync(to, { recursive: true, force: true })
  const walk = (dir, out) => {
    fs.mkdirSync(out, { recursive: true })
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name), path.join(out, entry.name))
      else if (!isTest(entry.name)) fs.copyFileSync(path.join(dir, entry.name), path.join(out, entry.name))
    }
  }
  walk(from, to)
}

sync(path.join(root, 'src/presentation-kit'), path.join(BOOTSTRAP_DIR, 'src/presentation-kit'))
sync(path.join(root, 'scripts'), path.join(BOOTSTRAP_DIR, 'scripts'))

const example = path.join(BOOTSTRAP_DIR, 'src/presentations/example')
fs.rmSync(example, { recursive: true, force: true })
fs.mkdirSync(example, { recursive: true })
for (const name of fs.readdirSync(PRESENTATION_TEMPLATE_DIR)) {
  const text = fs.readFileSync(path.join(PRESENTATION_TEMPLATE_DIR, name), 'utf8')
  fs.writeFileSync(path.join(example, name), renderTemplate(text, { slug: 'example', title: 'Example presentation' }))
}
console.log('templates synced')
