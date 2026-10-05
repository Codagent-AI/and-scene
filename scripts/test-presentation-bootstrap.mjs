import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const skillDir = path.join(root, 'skills/presentation')
const templateDir = path.join(skillDir, 'templates/bootstrap')
const temp = await mkdtemp(path.join(tmpdir(), 'and-scene-bootstrap-'))
const project = path.join(temp, 'materialized-app')
const outside = path.join(temp, 'outside-cwd')

async function files(dir, prefix = '') {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = path.posix.join(prefix, entry.name)
    if (entry.isDirectory()) out.push(...await files(path.join(dir, entry.name), rel))
    else out.push(rel)
  }
  return out
}
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`)
}

try {
  await cp(templateDir, project, { recursive: true })
  await mkdir(outside, { recursive: true })
  const kitFiles = (await files(path.join(root, 'src/presentation-kit'))).filter(file => !file.endsWith('.test.tsx')).sort()
  const snapshotFiles = (await files(path.join(project, 'src/presentation-kit'))).filter(file => !file.endsWith('.test.tsx')).sort()
  assert.deepEqual(snapshotFiles, kitFiles, 'bootstrap kit file list must match canonical kit')
  for (const file of kitFiles) assert.equal(await readFile(path.join(project, 'src/presentation-kit', file), 'utf8'), await readFile(path.join(root, 'src/presentation-kit', file), 'utf8'), `${file} differs from canonical kit`)

  const templatePresentation = path.join(project, 'src/presentations/template-check')
  await mkdir(path.join(templatePresentation, 'steps'), { recursive: true })
  await cp(path.join(skillDir, 'templates/presentation'), templatePresentation, { recursive: true })
  await cp(path.join(skillDir, 'templates/step/Step.tsx'), path.join(templatePresentation, 'steps/Step.tsx'))

  const pkg = JSON.parse(await readFile(path.join(project, 'package.json'), 'utf8'))
  const declared = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']) assert.ok(declared[name], `missing required dependency ${name}`)
  assert.ok(pkg.scripts['verify'] && pkg.scripts['inspect'], 'bootstrap must provide local verify and inspect helpers')
  const kitText = (await Promise.all(kitFiles.map(file => readFile(path.join(project, 'src/presentation-kit', file), 'utf8')))).join('\n')
  assert.doesNotMatch(kitText, /tailwind|#[0-9a-f]{3,8}\b|font-family\s*:|box-shadow\s*:|border\s*:/i, 'kit must not define a visual theme')
  assert.doesNotMatch(await readFile(path.join(project, 'src/index.css'), 'utf8'), /#[0-9a-f]{3,8}\b|font-family\s*:|box-shadow\s*:|tailwind/i, 'bootstrap host CSS must not define a theme')
  const skill = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8')
  assert.match(skill, /templates.*next to this `SKILL\.md`/i, 'templates must resolve relative to the skill file')

  run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], project)
  run('npm', ['--prefix', project, 'run', 'build'], outside)
  run('npm', ['--prefix', project, 'run', 'lint'], outside)
  run('npm', ['--prefix', project, 'run', 'verify'], outside)
  console.log('INT-001 passed: materialized bootstrap built, route smoke-checked from an external cwd, dependency contract and kit parity verified.')
} catch (error) {
  console.error(`INT-001 failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await rm(temp, { recursive: true, force: true })
}
