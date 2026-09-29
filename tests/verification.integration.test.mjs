import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const minimalFiles = ['package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'src', 'scripts']

function command(program, args, cwd, timeout = 90_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    const timer = setTimeout(() => child.kill('SIGKILL'), timeout)
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('exit', (code, signal) => { clearTimeout(timer); resolve({ code, signal, output }) })
  })
}

async function materialize(root) {
  const project = path.join(root, 'project')
  await mkdir(project, { recursive: true })
  for (const file of minimalFiles) await cp(path.join(repo, file), path.join(project, file), { recursive: true })
  await symlink(path.join(repo, 'node_modules'), path.join(project, 'node_modules'), 'dir')
  return project
}

test('production verifier builds and renders the canonical nine-step route', { timeout: 120_000 }, async () => {
  const result = await command('npm', ['run', 'verify'], repo)
  assert.equal(result.code, 0, result.output)
  assert.match(result.output, /PASS: build, canonical sample contract, and production browser render/)
  assert.match(result.output, /127\.0\.0\.1/)
})

test('inspection helper captures settled fixture steps and reports advisory defects', { timeout: 120_000 }, async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-inspect-'))
  try {
    const project = await materialize(temporaryRoot)
    const fixture = path.join(project, 'src/presentations/diagnostic-fixture')
    await mkdir(fixture, { recursive: true })
    await writeFile(path.join(fixture, 'Talk.tsx'), `
      import { Presentation } from '../../presentation-kit'
      import './style.css'
      const Scene = () => <div className="fixture-scene"><span className="collision-a">collision alpha</span><span className="collision-b">collision beta</span><div className="allowed" data-allow-overlap=""><span>allowed alpha</span><span>allowed beta</span></div></div>
      const steps = ['First fixture step', 'Second fixture step'].map((title, index) => ({ id: String(index), era: 'Fixture', title, caption: 'Controlled diagnostics fixture.', Scene, payload: undefined }))
      export default function Fixture() { return <Presentation steps={steps} title="Diagnostic fixture" /> }
    `)
    await writeFile(path.join(fixture, 'style.css'), `
      .fixture-scene { position: relative; width: 100%; height: 100%; }
      .collision-a, .collision-b, .allowed span { position: absolute; left: 160px; top: 150px; padding: 12px; background: white; }
      .collision-b { left: 165px; top: 153px; }
      .allowed { position: absolute; left: 500px; top: 150px; }
      .allowed span { left: 0; top: 0; }
      .allowed span + span { left: 3px; top: 2px; }
      .presentation-progress button { color: #111; background: transparent; border-color: #111; transform: none; font-weight: 400; }
      .presentation-attribution { font-size: 8px; color: #00e; text-decoration: underline; }
    `)
    const registryPath = path.join(project, 'src/presentations/index.ts')
    const registry = await readFile(registryPath, 'utf8')
    await writeFile(registryPath, registry.replace('= [', "= [{ slug: 'diagnostic-fixture', title: 'Diagnostic fixture', load: () => import('./diagnostic-fixture/Talk') },"))
    const result = await command('npm', ['run', 'inspect', '--', 'diagnostic-fixture'], project, 90_000)
    assert.equal(result.code, 0, result.output)
    assert.match(result.output, /possible text\/chrome overlap/)
    assert.doesNotMatch(result.output, /possible text\/chrome overlap:.*allowed alpha.*allowed beta/)
    assert.match(result.output, /active progress marker is visually indistinct/)
    assert.match(result.output, /attribution appears browser-default or undersized/)
    const captures = await Promise.all([1, 2].map(index => readFile(path.join(project, `.presentation-inspection/diagnostic-fixture/step-0${index}.png`))))
    assert.ok(captures.every(buffer => buffer.length > 1000), 'each step has a non-empty settled screenshot')
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})

test('inspection rejects path-like slugs before writing output', async () => {
  const result = await command('node', ['scripts/inspect-presentation.mjs', '../escape'], repo)
  assert.equal(result.code, 2, result.output)
  assert.match(result.output, /Invalid presentation slug/)
})

test('isolated fault copies fail with phase and step details', { timeout: 360_000 }, async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-faults-'))
  const faults = ['build', 'missing-sample', 'missing-scene', 'browser-error', 'transition']
  try {
    for (const fault of faults) {
      const project = await materialize(path.join(temporaryRoot, fault))
      const sample = path.join(project, 'src/presentations/how-to-make-a-presentation')
      if (fault === 'build') {
        await writeFile(path.join(sample, 'Talk.tsx'), "import './missing-module.tsx'\nexport default function Broken() { return null }\n")
      } else if (fault === 'missing-sample') {
        await unlink(path.join(sample, 'outline.json'))
      } else if (fault === 'missing-scene') {
        await writeFile(path.join(sample, 'style.css'), '[data-presentation-scene] { opacity: 0 !important; }\n')
      } else if (fault === 'browser-error') {
        const steps = path.join(sample, 'steps/index.tsx')
        const source = await readFile(steps, 'utf8')
        await writeFile(steps, source.replace('  const through = payload.through', "  console.error('injected browser fault')\n  const through = payload.through"))
      } else {
        const navigation = path.join(project, 'src/presentation-kit/usePresentationNav.ts')
        const source = await readFile(navigation, 'utf8')
        const broken = source.replace(/const next = useCallback\(.*\n/, 'const next = useCallback(() => {}, [])\n')
        assert.notEqual(broken, source, 'transition fault injection must change the navigation hook')
        await writeFile(navigation, broken)
      }
      const result = await command('npm', ['run', 'verify'], project, 70_000)
      assert.notEqual(result.code, 0, `${fault} fault must fail:\n${result.output}`)
      assert.match(result.output, /FAIL \[(build|sample contract|browser render step \d+)\]/, `${fault} reports failed phase:\n${result.output}`)
      if (fault === 'browser-error') assert.match(result.output, /step 1: console\.error: injected browser fault/)
      if (fault === 'missing-scene') assert.match(result.output, /browser render step 1.*scene is not visibly rendered at step 1/)
      if (fault === 'transition') assert.match(result.output, /step 2.*observed index 0|step 2.*Timeout/i)
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})
