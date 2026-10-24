// Locates a project's presentation registry by what it exports, not by what the file is called.
import fs from 'node:fs'
import path from 'node:path'

const SOURCE = /\.[cm]?[jt]sx?$/
const isRegistry = (text) => /\bexport\b/.test(text) && /\bslug\b/.test(text) && /\bload\b/.test(text)

/**
 * The registry module: a top-level source file of `src/presentations/` (any name) that exports a
 * slug -> loader list, preferring `index.*`. Registries elsewhere in the project, such as a blog's
 * routes, are not a presentation index. Registration and verification both use this file.
 */
export function findRegistry(dir) {
  const presentations = path.join(dir, 'src', 'presentations')
  if (!fs.existsSync(presentations)) return null
  const files = fs
    .readdirSync(presentations, { withFileTypes: true })
    .filter((e) => e.isFile() && SOURCE.test(e.name) && !/\.(test|spec)\./.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => Number(/^index\./.test(b)) - Number(/^index\./.test(a)) || a.localeCompare(b))
  const found = files.find((name) => isRegistry(fs.readFileSync(path.join(presentations, name), 'utf8')))
  return found ? path.join(presentations, found) : null
}

/** The slugs the registry module lists, or null when the project has no registry. */
export function registeredSlugs(dir) {
  const file = findRegistry(dir)
  if (!file) return null
  return [...fs.readFileSync(file, 'utf8').matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}
