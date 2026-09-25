import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
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
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: 'inherit', env: process.env })
  assert.equal(result.status, 0, `${label} failed with status ${result.status}`)
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
  for (const anchor of ['vite.config.ts', 'src/presentation-kit/types.ts', 'src/presentation-kit/Stage.tsx', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts']) assert.ok((await files(app)).includes(anchor), `missing bootstrap anchor ${anchor}`)
  const sourceKit = path.join(root, 'src/presentation-kit')
  const copiedKit = path.join(app, 'src/presentation-kit')
  const canonicalFiles = await files(sourceKit)
  assert.deepEqual(await files(copiedKit), canonicalFiles, 'bootstrap kit file set differs from canonical kit')
  for (const file of canonicalFiles) assert.equal(await readFile(path.join(copiedKit, file), 'utf8'), await readFile(path.join(sourceKit, file), 'utf8'), `bootstrap kit drift: ${file}`)
  for (const file of canonicalFiles.filter((name) => /\.(css|tsx?)$/.test(name))) {
    const source = await readFile(path.join(copiedKit, file), 'utf8')
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b|\b(font-family|box-shadow|border|background-color|--[\w-]+)\s*:/i, `visual default in kit file ${file}`)
  }
  await readFile(path.join(app, 'package-lock.json'))
  run('npm', ['ci'], app, 'bootstrap dependency install')
  // Invoke the project scripts while the caller's cwd is outside the materialized app.
  run('npm', ['--prefix', app, 'run', 'lint'], outside, 'bootstrap lint')
  run('npm', ['--prefix', app, 'run', 'build'], outside, 'bootstrap build')
  run('node', [path.join(app, 'scripts/verify.mjs')], outside, 'bootstrap production route verification')
  console.log('PASS: materialized bootstrap dependencies, anchors, kit parity, style boundary, build, and route render')
} finally {
  await rm(temp, { recursive: true, force: true })
}
