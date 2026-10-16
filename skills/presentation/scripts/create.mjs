// Creates a presentation from templates/presentation at the locations detect.mjs found
// (renamed kit directories and registry files are honoured), then registers it.
// Template paths resolve from this file, never from the caller's working directory.
//
// usage: node create.mjs <target-dir> <slug> <title>
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { locations } from './detect.mjs'

const TEMPLATE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'presentation')

const walk = (p) =>
  fs.statSync(p).isDirectory() ? fs.readdirSync(p).flatMap((f) => walk(path.join(p, f))) : [p]

export function createPresentation(target, slug, title) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`slug "${slug}" must be lowercase words joined by hyphens`)
  if (/['"\\<>{}\n`$]/.test(title)) throw new Error('title must not contain quotes, backslashes, braces, angle brackets or line breaks')
  const where = locations(target)
  if (!where.kit || !where.registry) throw new Error('no scene kit and presentation registry found: scaffold the missing anchors first')
  const kit = path.join(target, where.kit)
  const registry = path.join(target, where.registry)
  const folder = path.join(target, where.presentations, slug)
  if (fs.existsSync(folder)) throw new Error(`presentation folder ${path.relative(target, folder)} already exists`)

  // Edit the registry text first: nothing is written until registration is known to work.
  const source = fs.readFileSync(registry, 'utf8')
  const last = [...source.matchAll(/\bslug\s*:/g)].at(-1)
  // The array holding the entries closes at the first line-start `]` after the last entry, not at the file's last one.
  const close = last ? source.indexOf('\n]', last.index) : -1
  if (close === -1 || new RegExp(`slug:\\s*['"]${slug}['"]`).test(source)) {
    throw new Error(`cannot register "${slug}" in ${where.registry}: add it by hand or pick a new slug`)
  }
  const head = source.slice(0, close)
  // A previous entry written without a trailing comma needs one before the new entry.
  const sep = /[,[]\s*$/.test(head) ? '' : ','
  const entry = `  {\n    slug: '${slug}',\n    title: '${title}',\n    load: () => import('./${slug}/Talk'),\n  },`
  const registered = `${head}${sep}\n${entry}${source.slice(close)}`

  try {
    for (const src of walk(TEMPLATE)) {
      const dest = path.join(folder, path.relative(TEMPLATE, src))
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      const text = fs.readFileSync(src, 'utf8').replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title)
      // The template imports the kit by its canonical name; point it at wherever the kit actually is.
      const spec = path.relative(path.dirname(dest), kit).split(path.sep).join('/')
      fs.writeFileSync(dest, text.replace(/(['"])(?:\.\.\/)+presentation-kit\1/g, `'${spec.startsWith('.') ? spec : `./${spec}`}'`))
    }
    fs.writeFileSync(registry, registered)
  } catch (e) {
    fs.rmSync(folder, { recursive: true, force: true })
    throw e
  }
  return { folder: path.relative(target, folder).split(path.sep).join('/'), registry: where.registry }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [dir, slug, ...title] = process.argv.slice(2)
  if (!dir || !slug || title.length === 0) {
    console.error('usage: node create.mjs <target-dir> <slug> <title>')
    process.exit(2)
  }
  try {
    console.log(JSON.stringify(createPresentation(path.resolve(dir), slug, title.join(' ')), null, 2))
  } catch (e) {
    console.error(`create failed: ${e.message}`)
    process.exit(1)
  }
}
