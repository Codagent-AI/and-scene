import { cp, mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const templateRoot = path.join(repositoryRoot, 'skills/presentation/templates/bootstrap')
const canonicalKit = path.join(repositoryRoot, 'src/presentation-kit')
const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with ${result.status}`)
}
const walk = async (directory) => {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(fullPath))
    else files.push(fullPath)
  }
  return files
}

try {
  const canonicalFiles = await walk(canonicalKit)
  const templateKit = path.join(templateRoot, 'src/presentation-kit')
  const templateFiles = await walk(templateKit)
  const canonicalPaths = canonicalFiles.map((file) => path.relative(canonicalKit, file)).sort()
  const templatePaths = templateFiles.map((file) => path.relative(templateKit, file)).sort()
  if (JSON.stringify(canonicalPaths) !== JSON.stringify(templatePaths)) throw new Error(`scene-kit template file set differs: canonical=${canonicalPaths.join(',')} snapshot=${templatePaths.join(',')}`)
  for (const source of canonicalFiles) {
    const relative = path.relative(canonicalKit, source)
    const snapshot = path.join(templateRoot, 'src/presentation-kit', relative)
    if ((await readFile(source)).compare(await readFile(snapshot)) !== 0) throw new Error(`scene-kit template drift: ${relative}`)
  }
  const manifest = JSON.parse(await readFile(path.join(templateRoot, 'package.json'), 'utf8'))
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
  const required = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'globals', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']
  for (const dependency of required) if (!dependencies[dependency]) throw new Error(`bootstrap missing required dependency: ${dependency}`)
  if (dependencies.tailwindcss || dependencies['@tailwindcss/vite']) throw new Error('bootstrap must not require Tailwind')

  await cp(templateRoot, tempRoot, { recursive: true })
  const appManifest = path.join(tempRoot, 'package.json')
  const json = JSON.parse(await readFile(appManifest, 'utf8'))
  json.name = 'and-scene-bootstrap-contract'
  await writeFile(appManifest, `${JSON.stringify(json, null, 2)}\n`)
  const fixtureDir = path.join(tempRoot, 'src/presentations/bootstrap-contract')
  await mkdir(fixtureDir, { recursive: true })
  await writeFile(path.join(fixtureDir, 'Talk.tsx'), `import { Presentation, type Step } from '../../presentation-kit'\nfunction Scene() { return <div>Bootstrap route renders</div> }\nconst steps: Step<null>[] = [{ id: 'fixture:one', era: 'Fixture', title: 'Bootstrap smoke', caption: 'The materialized route works.', Scene, payload: null }]\nexport default function Talk() { return <Presentation steps={steps} title="Bootstrap contract" /> }\n`)
  await writeFile(path.join(tempRoot, 'src/presentations/index.ts'), `export interface PresentationRegistration { slug: string; title: string; load: () => Promise<{ default: React.ComponentType }> }\nexport const presentations: PresentationRegistration[] = [{ slug: 'bootstrap-contract', title: 'Bootstrap contract', load: () => import('./bootstrap-contract/Talk') }]\n`)
  run('npm', ['install', '--no-audit', '--no-fund'], tempRoot)
  run('npx', ['playwright', 'install', 'chromium'], tempRoot)
  run('npm', ['run', 'build'], tempRoot)
  run('npm', ['run', 'verify', '--', 'bootstrap-contract'], tempRoot)
  run('npm', ['run', 'inspect', '--', 'bootstrap-contract'], tempRoot)
  console.log('PASS: materialized bootstrap built, rendered, and captured a route screenshot in an isolated directory')
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}
