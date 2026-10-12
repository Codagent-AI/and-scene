import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
const check = process.argv.includes('--check')
const files = ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js']
const kitFiles = async (dir, prefix = '') => {
  const files = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(...await kitFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`))
    else if (!entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) files.push(`${prefix}${entry.name}`)
  }
  return files
}
const expected = new Map()
for (const file of files) expected.set(file, await readFile(path.join(root, file)))
expected.set('package-lock.json', await readFile(path.join(root, 'package-lock.json')))
for (const file of ['src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx', 'src/presentations/index.ts', 'scripts/verify.mjs', 'scripts/verification-lib.mjs', 'scripts/inspect-presentation.mjs', 'scripts/inspection-lib.mjs']) expected.set(file, await readFile(path.join(root, file)))
for (const file of await kitFiles(path.join(root, 'src/presentation-kit'))) expected.set(`src/presentation-kit/${file}`, await readFile(path.join(root, 'src/presentation-kit', file)))
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
packageJson.name = 'and-scene-presentation'
packageJson.scripts = { build: packageJson.scripts.build, lint: packageJson.scripts.lint, verify: 'node scripts/verify.mjs --slug starter --generic', inspect: 'node scripts/inspect-presentation.mjs' }
delete packageJson.scripts.dev
delete packageJson.scripts.preview
delete packageJson.scripts.test
expected.set('package.json', Buffer.from(`${JSON.stringify(packageJson, null, 2)}\n`))
expected.set('src/index.css', Buffer.from('* { box-sizing: border-box; }\n'))
expected.set('src/presentations/index.ts', Buffer.from("import type React from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: React.ComponentType }> }\nexport const presentations: PresentationEntry[] = [\n  { slug: 'starter', title: 'Your presentation', load: () => import('./starter/Talk') },\n]\nexport function findPresentation(slug: string): PresentationEntry | undefined { return presentations.find((entry) => entry.slug === slug) }\nexport type RouteResolution = { kind: 'landing' } | { kind: 'presentation'; slug: string }\nexport function resolveRoute(pathname: string): RouteResolution {\n  const slug = pathname.replace(/^\\/+|\\/+$/g, '')\n  return slug && findPresentation(slug) ? { kind: 'presentation', slug } : { kind: 'landing' }\n}\n"))
expected.set('src/presentations/starter/Talk.tsx', Buffer.from("import { Presentation } from '../../presentation-kit/Presentation'\nimport { Box } from '../../presentation-kit/nodes/Box'\nimport type { Step } from '../../presentation-kit/types'\nfunction StarterScene() { return <Box layoutId=\"starter-node\">Add your scene</Box> }\nconst steps: Step[] = [{ id: 'start', era: 'Start', title: 'Your first step', caption: 'Describe the idea this scene introduces.', Scene: StarterScene, payload: undefined }]\nexport default function Talk() { return <Presentation steps={steps} title=\"Your presentation\" /> }\n"))
if (!check) {
  await rm(bootstrap, { recursive: true, force: true })
  await mkdir(bootstrap, { recursive: true })
  for (const [file, content] of expected) { const target = path.join(bootstrap, file); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, content) }
  await cp(path.join(root, 'package-lock.json'), path.join(bootstrap, 'package-lock.json'))
  await mkdir(path.join(bootstrap, 'src/presentations/starter'), { recursive: true })
  await writeFile(path.join(bootstrap, 'src/presentations/starter/Talk.tsx'), expected.get('src/presentations/starter/Talk.tsx'))
} else {
  const mismatches = []
  for (const [file, content] of expected) {
    const actual = await readFile(path.join(bootstrap, file)).catch(() => null)
    if (!actual || !actual.equals(content)) mismatches.push(file)
  }
  if (mismatches.length) { console.error(`Template snapshot drift: ${mismatches.join(', ')}`); process.exitCode = 1 }
}
