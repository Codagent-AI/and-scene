import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const root = fileURLToPath(new URL('../', import.meta.url))
const source = path => resolve(root, path)
const sample = 'src/presentations/how-to-make-a-presentation'

async function scratch(t) {
  const cwd = await mkdtemp(join(tmpdir(), 'and-scene-'))
  t.after(() => rm(cwd, { recursive: true, force: true }))
  return cwd
}

async function run(t, cwd, command, ...args) {
  const label = [command, ...args].join(' ')
  try {
    const { stdout, stderr } = await exec(command, args, { cwd, timeout: 150_000 })
    t.diagnostic(`${label} (exit 0)\n${stdout}${stderr}`)
    return { code: 0, output: stdout + stderr, stdout }
  } catch (error) {
    t.diagnostic(`${label} (exit ${error.code}, signal ${error.signal})\n${error.stdout}${error.stderr}`)
    return { code: error.code, output: error.stdout + error.stderr }
  }
}

async function copyApp(t) {
  const cwd = await scratch(t)
  const files = ['index.html', 'package.json', 'tsconfig.json', 'tsconfig.app.json',
    'tsconfig.node.json', 'vite.config.ts', 'src', 'scripts']
  await Promise.all(files.map(path => cp(source(path), join(cwd, path), { recursive: true })))
  // Share the installed packages while keeping build caches isolated per fixture.
  const modules = join(cwd, 'node_modules')
  await mkdir(modules)
  const names = await readdir(source('node_modules'))
  await Promise.all(names.filter(name => name === '.bin' || !name.startsWith('.')).map(name =>
    symlink(source(`node_modules/${name}`), join(modules, name))))
  return cwd
}

async function edit(cwd, path, transform) {
  const target = join(cwd, path)
  const before = await readFile(target, 'utf8')
  const after = transform(before)
  assert.notEqual(after, before, `Fault edit must change ${path}`)
  await writeFile(target, after)
}

async function compareTrees(canonical, vendored) {
  const entries = await readdir(canonical, { withFileTypes: true })
  const copies = await readdir(vendored)
  assert.deepEqual(copies.sort(), entries.map(entry => entry.name).sort())
  for (const entry of entries) {
    const base = join(canonical, entry.name)
    const copy = join(vendored, entry.name)
    if (entry.isDirectory()) await compareTrees(base, copy)
    else assert.deepEqual(await readFile(copy), await readFile(base), entry.name)
  }
}

function previewUrl(output) {
  return output.match(/Preview ready at (http:\/\/127\.0\.0\.1:\d+\/)/)?.[1]
}

async function checkPreviewStopped(output) {
  const url = previewUrl(output)
  assert.ok(url, 'Vite preview and readiness must use the IPv4 loopback')
  await assert.rejects(fetch(url, { signal: AbortSignal.timeout(2000) }), { name: 'TypeError' })
}

test('INT-001 materialized bootstrap is complete and style-neutral', async t => {
  const outside = await scratch(t)
  const skill = 'skills/presentation'
  const lookup = await run(t, outside, process.execPath, source(`${skill}/templates.mjs`))
  assert.equal(lookup.code, 0)
  const templates = JSON.parse(lookup.stdout)
  assert.equal(resolve(templates.bootstrap), source(`${skill}/templates/bootstrap`))
  assert.equal(resolve(templates.presentation), source(`${skill}/templates/presentation`))
  const cwd = join(outside, 'materialized')
  await cp(templates.bootstrap, cwd, { recursive: true })
  const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'))
  const installed = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react', 'vite',
    '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom',
    '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
    assert.ok(installed[dependency], `Missing ${dependency}`)
  }
  assert.ok(Object.keys(installed).every(name => !/tailwind|bootstrap|chakra/i.test(name)))
  assert.equal(await readFile(join(cwd, 'src/index.css'), 'utf8'), 'body { margin: 0; }\n')
  await compareTrees(source('src/presentation-kit'), join(cwd, 'src/presentation-kit'))
  for (const path of (await readdir(source('scripts'))).filter(path => path.endsWith('.mjs'))) {
    assert.deepEqual(await readFile(join(cwd, 'scripts', path)), await readFile(source(`scripts/${path}`)), path)
  }
  const ci = await run(t, cwd, 'npm', 'ci', '--prefer-offline', '--no-audit')
  assert.equal(ci.code, 0)
  const verified = await run(t, cwd, 'npm', 'run', 'verify')
  assert.equal(verified.code, 0)
  assert.match(verified.output, /PASS: build and browser render for \/starter/)
  await checkPreviewStopped(verified.output)
})

test('INT-002 screenshot helper emits settled artifacts and advisory warnings', async t => {
  const cwd = await copyApp(t)
  const fixture = join(cwd, 'src/presentations/inspection-fixture/Talk.tsx')
  await mkdir(dirname(fixture), { recursive: true })
  await writeFile(fixture, `
    import { useEffect, useState } from 'react'
    import { Presentation, SceneLayer } from '../../presentation-kit'
    import type { SceneProps, Step } from '../../presentation-kit'

    let firstScale: string | undefined
    function Diagram({ payload }: SceneProps<number>) {
      const [settled, setSettled] = useState(false)
      useEffect(() => {
        const timer = setTimeout(() => {
          const scale = document.querySelector<HTMLElement>('[data-presentation-fit]')?.dataset.scale
          if (!scale || Number(scale) <= 0 || (firstScale && firstScale !== scale)) {
            console.error('Canvas fit changed with step chrome: ' + firstScale + ' -> ' + scale)
          }
          firstScale ??= scale
          setSettled(true)
        }, 240)
        return () => clearTimeout(timer)
      }, [])
      return <SceneLayer>
        {payload === 2 && settled && <div>
          <span style={{ position: 'absolute', left: 80, top: 30 }}>Unmarked collision A</span>
          <span style={{ position: 'absolute', left: 83, top: 30 }}>Unmarked collision B</span>
        </div>}
        {payload === 3 && <div data-presentation-allow-overlap="">
          <span style={{ position: 'absolute', left: 80, top: 30 }}>Allowed collision A</span>
          <span style={{ position: 'absolute', left: 83, top: 30 }}>Allowed collision B</span>
        </div>}
      </SceneLayer>
    }

    const steps: Step<number>[] = [1, 2, 3].map(number => ({
      id: String(number), era: 'Era ' + number, title: 'Step ' + number,
      caption: number === 2 ? 'A longer caption wraps on a shorter stage. '.repeat(10) : 'A short caption.',
      payload: number, Scene: Diagram,
    }))

    export default function Talk() {
      return <><style>{\`
        [data-presentation] { block-size: 420px; }
        [data-presentation-attribution] { line-height: 24px; }
        [data-step-index="1"] [data-presentation-attribution] { font-size: 8px; }
        [data-step-index="2"] [data-presentation-attribution] { visibility: hidden; }
      \`}</style><Presentation steps={steps} title="Inspection fixture" /></>
    }
  `)
  await edit(cwd, 'src/presentations/index.ts', text => text.replace('= [', `= [
    { slug: 'inspection-fixture', title: 'Inspection fixture', load: () => import('./inspection-fixture/Talk') },`))
  const inspection = await run(t, cwd, 'npm', 'run', 'inspect', '--', 'inspection-fixture', '--settle=550')
  assert.equal(inspection.code, 0)
  const dir = join(cwd, 'artifacts/presentation-inspection/inspection-fixture/1440x900')
  const shots = (await readdir(dir)).sort()
  assert.deepEqual(shots, ['step-01.png', 'step-02.png', 'step-03.png'])
  for (const shot of shots) {
    const content = await readFile(join(dir, shot))
    assert.equal(content.subarray(1, 4).toString(), 'PNG')
    assert.equal(content.readUInt32BE(16), 1440)
    assert.equal(content.readUInt32BE(20), 900)
  }
  assert.match(inspection.output, /Warning at step 2: overlap between "Unmarked collision A" and "Unmarked collision B"/)
  assert.doesNotMatch(inspection.output, /Allowed collision [AB]/)
  assert.match(inspection.output, /Warning at step 2: indistinct active progress indicator/)
  assert.match(inspection.output, /Warning at step 2: indistinct active table of contents entry/)
  assert.match(inspection.output, /Warning at step 1: undersized or browser-default attribution; style \[data-presentation-attribution\]/)
  assert.match(inspection.output, /Warning at step 2: undersized or browser-default attribution; style \[data-presentation-attribution\]/)
  assert.match(inspection.output, /Warning at step 3: missing visible attribution; style \[data-presentation-attribution\]/)
  await checkPreviewStopped(inspection.output)
})

test('E2E-001 reference presentation passes production verification', async t => {
  const result = await run(t, root, 'npm', 'run', 'verify')
  assert.equal(result.code, 0)
  assert.match(result.output, /tsc -b && vite build/)
  assert.match(result.output, /PASS: build and browser render for \/how-to-make-a-presentation/)
  const indices = [...result.output.matchAll(/Verified step \d+ \(index (\d+)\)/g)].map(match => Number(match[1]))
  assert.deepEqual(indices, [0, 1, 2, 3, 4, 5, 6, 7, 8])
  await checkPreviewStopped(result.output)
})

test('E2E-002 verification failures are actionable and preview is cleaned up', async t => {
  const fixtures = [
    ['build failure', `${sample}/Talk.tsx`, text => `${text}\nexport const broken: string = 42\n`, /FAIL: build:/, false],
    ['missing sample', 'src/presentations/index.ts', text => text.slice(0, text.indexOf('= [') + 2) + '[]\n',
      /FAIL: route and render at step 1 \(index 0\)/, true],
    ['out-of-order outline', `${sample}/Talk.tsx`, text => text.replace('outline.map', '[...outline].reverse().map'),
      /FAIL: reference outline at step 1 \(index 0\): Expected/, true],
    ['console error', `${sample}/steps/BuildScene.tsx`, text => text.replace('  return <SceneLayer', `  if (beat === 2) console.error('fixture console fault')
      return <SceneLayer`), /FAIL: render at step 2 \(index 1\): console error: fixture console fault/, true],
    ['uncaught page error', `${sample}/steps/BuildScene.tsx`, text => text.replace('  return <SceneLayer', `  if (beat === 2) setTimeout(() => { throw new Error('fixture page fault') }, 100)
      return <SceneLayer`), /FAIL: render at step 2 \(index 1\): page error: fixture page fault/, true],
    ['failed transition', `${sample}/Talk.tsx`, text => text.replace('const steps:', "document.addEventListener('keydown', event => event.preventDefault())\nconst steps:"),
      /FAIL: transition to step 2 \(index 1\)/, true],
  ]
  for (const [name, path, transform, expected, preview] of fixtures) {
    await t.test(name, async subtest => {
      const cwd = await copyApp(subtest)
      await edit(cwd, path, transform)
      const result = await run(subtest, cwd, 'npm', 'run', 'verify')
      assert.equal(result.code, 1)
      assert.match(result.output, expected)
      assert.doesNotMatch(result.output, /PASS:/)
      if (preview) await checkPreviewStopped(result.output)
      else assert.equal(previewUrl(result.output), undefined)
    })
  }
})
