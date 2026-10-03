import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
const temp = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
const app = path.join(temp, 'app')
const outside = path.join(temp, 'caller')
await cp(bootstrap, app, { recursive: true })
await mkdir(outside)

function run(command, args, cwd, label) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  assert.equal(result.status, 0, `${label} failed with status ${result.status}`)
}
function runCapture(command, args, cwd, label) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
  process.stdout.write(result.stdout ?? '')
  process.stderr.write(result.stderr ?? '')
  assert.equal(result.status, 0, `${label} failed with status ${result.status}`)
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`
}

async function files(dir, prefix = '') {
  const result = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = path.posix.join(prefix, entry.name)
    if (entry.isDirectory()) result.push(...await files(path.join(dir, entry.name), rel))
    else result.push(rel)
  }
  return result.sort()
}

try {
  const packageJson = JSON.parse(await readFile(path.join(app, 'package.json'), 'utf8'))
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright']) assert.ok(deps[name], `missing dependency ${name}`)
  assert.ok(!Object.keys(deps).some((name) => /tailwind|styled-components|emotion/.test(name)), 'bootstrap unexpectedly requires a styling framework')
  const appFiles = await files(app)
  for (const anchor of ['vite.config.ts', 'src/presentation-kit/types.ts', 'src/presentation-kit/Stage.tsx', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts']) assert.ok(appFiles.includes(anchor), `missing bootstrap anchor ${anchor}`)
  const sourceKit = path.join(root, 'src/presentation-kit')
  const copiedKit = path.join(app, 'src/presentation-kit')
  const canonicalFiles = await files(sourceKit)
  assert.deepEqual(await files(copiedKit), canonicalFiles, 'bootstrap kit file set differs from canonical kit')
  for (const file of canonicalFiles) {
    const copied = await readFile(path.join(copiedKit, file), 'utf8')
    assert.equal(copied, await readFile(path.join(sourceKit, file), 'utf8'), `bootstrap kit drift: ${file}`)
    if (/\.(css|tsx?)$/.test(file)) assert.doesNotMatch(copied, /#[0-9a-f]{3,8}\b|\b(font-family|box-shadow|border|background-color|--[\w-]+)\s*:/i, `visual default in kit file ${file}`)
  }
  await readFile(path.join(app, 'package-lock.json'))
  const registryPath = path.join(app, 'src/presentations/index.ts')
  const registry = await readFile(registryPath, 'utf8')
  const starterEntry = "  { slug: 'starter', title: 'Starter presentation', load: () => import('./starter/Talk') },"
  await writeFile(registryPath, registry.replace(starterEntry, `${starterEntry}\n  { slug: 'second', title: 'Second presentation', load: () => import('./starter/Talk') },`))
  const openingPath = path.join(app, 'src/presentations/starter/steps/Opening.tsx')
  const opening = await readFile(openingPath, 'utf8')
  await writeFile(openingPath, opening.replace('<Box id="starter:opening" className="starter-box">{payload.label}</Box>', '<Box id="starter:opening" className="starter-box" data-allow-overlap="">intentional fixture overlap {payload.label}</Box><Box id="fixture:unmarked" className="fixture-unmarked">unmarked fixture overlap</Box>'))
  const kitPresentation = path.join(app, 'src/presentation-kit/Presentation.tsx')
  const kitSource = await readFile(kitPresentation, 'utf8')
  await writeFile(kitPresentation, kitSource.replace('data-presentation-progress=""', 'data-presentation-progress="" data-allow-overlap=""'))
  const starterStyle = path.join(app, 'src/presentations/starter/style.css')
  await writeFile(starterStyle, `${await readFile(starterStyle, 'utf8')}\n.starter [data-presentation-caption], .starter [data-presentation-attribution] { position: absolute !important; right: 0 !important; bottom: 0 !important; width: 220px !important; height: 30px !important; }\n.starter [data-presentation-progress-item], .starter [data-presentation-progress-item][data-presentation-active="true"] { color: #555 !important; background: transparent !important; border-color: transparent !important; font-weight: 400 !important; outline: none !important; box-shadow: none !important; text-decoration: none !important; }\n.starter [data-presentation-footer] button[aria-current] { outline: none !important; }\n`)
  run('npm', ['ci'], app, 'bootstrap dependency install')
  // Invoke the project scripts while the caller's cwd is outside the materialized app.
  run('npm', ['--prefix', app, 'run', 'lint'], outside, 'bootstrap lint')
  run('npm', ['--prefix', app, 'run', 'build'], outside, 'bootstrap build')
  const verifyOutput = runCapture('node', [path.join(app, 'scripts/verify.mjs')], outside, 'bootstrap production route verification')
  assert.match(verifyOutput, /rendered 2 registered presentation/)
  const inspectOutput = runCapture('npm', ['--prefix', app, 'run', 'inspect', '--', 'starter'], outside, 'bootstrap screenshot helper')
  assert.match(inspectOutput, /WARN step 1: possible unmarked visible text\/chrome overlap: data-presentation-caption ↔ data-presentation-attribution/)
  assert.doesNotMatch(inspectOutput, /WARN step 1: possible unmarked visible text\/chrome overlap: data-presentation-caption ↔ data-presentation-progress/)
  assert.match(inspectOutput, /WARN step 1: active progress or contents state may be indistinct/)
  assert.match(inspectOutput, /WARN step 1: attribution is missing, browser-default, or undersized/)
  assert.ok((await stat(path.join(app, 'artifacts/presentation-inspection/starter/step-01.png'))).size > 0, 'screenshot helper did not write its step image')
  console.log('PASS: materialized bootstrap dependencies, anchors, kit parity, style boundary, build, and route render')
} finally {
  await rm(temp, { recursive: true, force: true })
}
