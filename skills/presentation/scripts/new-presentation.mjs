import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { PRESENTATION_TEMPLATE_DIR, resolveTarget } from './scaffold.mjs'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const REGISTRY_START = /export const presentations\s*:\s*PresentationEntry\[\]\s*=\s*\[/

export const registryFile = (appDir) => path.join(appDir, 'src', 'presentations', 'index.ts')

/** The registered presentations, in registry order. */
export function listPresentations(appDir) {
  const source = fs.readFileSync(registryFile(appDir), 'utf8')
  return [...source.matchAll(/slug:\s*(['"`])(.+?)\1[\s\S]*?title:\s*("(?:[^"\\]|\\.)*"|'[^']*'|`[^`]*`)/g)].map((m) => ({
    slug: m[2],
    title: m[3][0] === '"' ? JSON.parse(m[3]) : m[3].slice(1, -1),
  }))
}

/** Appends one entry to the explicit registry without touching the existing ones. */
export function registerPresentation(source, { slug, title }) {
  const start = source.match(REGISTRY_START)
  if (!start) throw new Error('registry array `presentations: PresentationEntry[]` not found')
  const open = start.index + start[0].length
  const close = source.indexOf('\n]', open)
  if (close < 0) throw new Error('registry array is not closed with a line-start `]`')
  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk'),\n  },`
  const before = source.slice(0, close).replace(/\s*$/, '')
  return `${before}\n${entry}${source.slice(close)}`
}

export function renderTemplate(text, { slug, title }) {
  return text
    .replaceAll('__CLASS__', `p-${slug}`)
    .replaceAll('__TITLE_JSON__', JSON.stringify(title))
    .replaceAll('__TITLE__', title.replaceAll('*/', '* /'))
}

/** Copies the presentation template into `<appDir>/src/presentations/<slug>` and registers it. */
export function createPresentation(appDir, { slug, title }) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase words joined by hyphens`)
  const dest = path.join(appDir, 'src', 'presentations', slug)
  if (fs.existsSync(dest)) throw new Error(`presentation folder already exists: ${dest}`)
  if (listPresentations(appDir).some((p) => p.slug === slug)) throw new Error(`slug already registered: ${slug}`)

  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(PRESENTATION_TEMPLATE_DIR)) {
    const text = fs.readFileSync(path.join(PRESENTATION_TEMPLATE_DIR, name), 'utf8')
    fs.writeFileSync(path.join(dest, name), renderTemplate(text, { slug, title }))
  }
  const index = registryFile(appDir)
  fs.writeFileSync(index, registerPresentation(fs.readFileSync(index, 'utf8'), { slug, title }))
  return { dir: dest, route: `/${slug}` }
}

function main(argv) {
  const [command, ...rest] = argv
  const cwdIndex = rest.indexOf('--cwd')
  const cwd = path.resolve(cwdIndex >= 0 ? rest.splice(cwdIndex, 2)[1] : process.cwd())
  const { targetDir } = resolveTarget(cwd)
  if (command === 'list') console.log(JSON.stringify(listPresentations(targetDir), null, 2))
  else if (command === 'create' && rest.length === 2) console.log(JSON.stringify(createPresentation(targetDir, { slug: rest[0], title: rest[1] }), null, 2))
  else {
    console.error('usage: new-presentation.mjs <list | create <slug> "<Title>"> [--cwd <dir>]')
    process.exitCode = 2
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
