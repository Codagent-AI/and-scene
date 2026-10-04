import { cp, mkdtemp, readFile, readdir, rm, writeFile, mkdir, stat } from 'node:fs/promises'
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
  await writeFile(path.join(fixtureDir, 'Talk.tsx'), `import { Presentation, type SceneProps, type Step } from '../../presentation-kit'\nimport './fixture.css'\nfunction Scene({ index }: SceneProps<null>) { return <div className="fixture-scene"><p className="collision-a">Collision A</p><p className="collision-b">Collision B</p><div className="allowed" data-presentation-allow-overlap><p>Allowed A</p><p>Allowed B</p></div><span>Step {index + 1}</span></div> }\nconst steps: Step<null>[] = [1, 2].map((n) => ({ id: 'fixture:' + n, era: 'Fixture ' + n, title: 'Bootstrap smoke ' + n, caption: 'The materialized route works.', Scene, payload: null }))\nexport default function Talk() { return <Presentation steps={steps} title="Bootstrap contract" /> }\n`)
  await writeFile(path.join(fixtureDir, 'fixture.css'), `.fixture-scene { position: relative; height: 100%; } .fixture-scene p { position: absolute; margin: 0; } .collision-a, .collision-b { left: 20px; top: 20px; } .allowed { position: absolute; left: 200px; top: 20px; } .allowed p { left: 0; top: 0; } .allowed p + p { left: 0; top: 0; }`)
  await writeFile(path.join(tempRoot, 'src/presentations/index.ts'), `export interface PresentationRegistration { slug: string; title: string; load: () => Promise<{ default: React.ComponentType }> }\nexport const presentations: PresentationRegistration[] = [{ slug: 'bootstrap-contract', title: 'Bootstrap contract', load: () => import('./bootstrap-contract/Talk') }]\n`)
  run('npm', ['install', '--prefer-offline', '--no-audit', '--no-fund'], tempRoot)
  run('npx', ['playwright', 'install', 'chromium'], tempRoot)
  run('npm', ['run', 'build'], tempRoot)
  const missingSlug = spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: tempRoot, encoding: 'utf8' })
  const missingSlugOutput = `${missingSlug.stdout ?? ''}${missingSlug.stderr ?? ''}`
  if (missingSlug.status !== 2 || !missingSlugOutput.includes('Usage: npm run verify -- <presentation-slug>')) {
    throw new Error(`verification without a slug should exit with usage status 2: ${missingSlugOutput}`)
  }
  run('npm', ['run', 'verify', '--', 'bootstrap-contract'], tempRoot)
  const inspection = spawnSync('npm', ['run', 'inspect', '--', 'bootstrap-contract', '--settle', '40'], { cwd: tempRoot, encoding: 'utf8' })
  const inspectionOutput = `${inspection.stdout ?? ''}${inspection.stderr ?? ''}`
  if (inspection.status !== 0) throw new Error(`inspection failed with ${inspection.status}: ${inspectionOutput}`)
  if (!/WARN step 1\/2: overlap: .*Collision A.*Collision B/s.test(inspectionOutput)) throw new Error(`inspection did not report the unmarked collision: ${inspectionOutput}`)
  if (!/WARN step 1\/2: active navigation: .*resembles inactive state/.test(inspectionOutput)) throw new Error(`inspection did not report indistinct active navigation: ${inspectionOutput}`)
  if (!/WARN step 1\/2: attribution: .*browser-default or undersized/.test(inspectionOutput)) throw new Error(`inspection did not report unpolished attribution: ${inspectionOutput}`)
  if (/overlap: .*Allowed A.*Allowed B/s.test(inspectionOutput)) throw new Error('inspection reported an explicitly allowed overlap')
  for (const name of ['step-01.png', 'step-02.png']) await stat(path.join(tempRoot, 'artifacts/presentation-inspection/bootstrap-contract', name))
  console.log('PASS: materialized bootstrap built, rendered, and captured a route screenshot in an isolated directory')
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}
