import { test } from 'node:test'
import { PNG } from 'pngjs'
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { ROOT } from '../scripts/browser.mjs'
import { bootstrap } from '../skills/presentation/scaffold.mjs'
const EVIDENCE = process.env.AND_SCENE_EVIDENCE
async function run(cwd, args, { expectFailure = false, timeout = 180000 } = {}) {
  const child = spawn(args[0], args.slice(1), { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { output += data })
  const timer = setTimeout(() => child.kill('SIGKILL'), timeout)
  let code
  try { [code] = await once(child, 'exit') } finally { clearTimeout(timer) }
  assert.equal(code === 0, !expectFailure, output)
  return output
}
async function compareTree(a, b) {
  const files = (await readdir(a)).filter(name => !name.endsWith('.test.tsx'))
  assert.deepEqual((await readdir(b)).sort(), files.sort())
  for (const name of files) {
    const left = resolve(a, name), right = resolve(b, name)
    const { stat } = await import('node:fs/promises')
    if ((await stat(left)).isDirectory()) await compareTree(left, right)
    else assert.equal(await readFile(left, 'utf8'), await readFile(right, 'utf8'), `drift: ${name}`)
  }
}
async function isolatedCopy() {
  const dir = await mkdtemp(resolve(tmpdir(), 'and-scene-e2e-'))
  for (const name of ['src', 'scripts', 'public', 'package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) await cp(resolve(ROOT, name), resolve(dir, name), { recursive: true })
  await symlink(resolve(ROOT, 'node_modules'), resolve(dir, 'node_modules'), 'dir')
  return dir
}
async function evidence(id, output, rows, code) {
  if (!EVIDENCE) return
  const name = `${id}.log`
  await writeFile(resolve(EVIDENCE, name), output)
  for (const row of rows.split(',')) {
    const unitRows = ['I-33', 'I-37', 'I-39', 'I-40', 'I-42', 'I-43', 'I-44']
    const extra = unitRows.includes(row) ? ` Targeted test ${row} in \`${row}-unit.log\`.` : ''
    const dependency = row === 'I-32' ? ' Successful whole-app build in E2E-001, `E2E-001.log`.' : row === 'I-41' ? ' Root/template script parity in INT-001, `INT-001.log`.' : row === 'I-38' ? ' Public hook component assertion I-1, `I-1-unit.log`.' : ''
    await run(ROOT, ['node', 'scripts/record-evidence.mjs', row, code, `${id} assertions in \`${name}\`; node --test tests/integration.test.mjs.${extra}${dependency}`])
  }
}
async function assertCleaned(output) {
  const started = [...output.matchAll(/; pid (\d+)/g)].map(m => m[1])
  for (const pid of started) {
    assert.ok(output.includes(`preview cleaned ${pid}`), output)
    assert.throws(() => process.kill(Number(pid), 0), { code: 'ESRCH' })
  }
}
test('INT-001 materialized bootstrap complete style-neutral and relocatable', { timeout: 240000 }, async () => {
  const parent = await mkdtemp(resolve(tmpdir(), 'and-scene-bootstrap-')), dir = resolve(parent, 'app')
  let output = ''
  try {
    output += await run(parent, ['node', resolve(ROOT, 'skills/presentation/scaffold.mjs'), dir])
    output += await run(dir, ['npm', 'ci', '--no-audit', '--no-fund'])
    const pkg = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8'))
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', '@eslint/js', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright']) assert.ok(pkg.dependencies?.[dep] || pkg.devDependencies?.[dep], dep)
    assert.ok(!Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(d => /tailwind/.test(d)))
    for (const anchor of ['src/presentation-kit/types.ts', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts']) assert.ok((await readFile(resolve(dir, anchor), 'utf8')).length)
    assert.equal((await readFile(resolve(dir, 'src/index.css'), 'utf8')).trim(), '/* Host styling belongs here. The bootstrap intentionally supplies no presentation theme. */')
    for (const file of await readdir(resolve(ROOT, 'src/presentation-kit'), { recursive: true })) {
      if (!/\.tsx?$/.test(file)) continue
      const source = await readFile(resolve(ROOT, 'src/presentation-kit', file), 'utf8')
      assert.doesNotMatch(source, /fontFamily|fontSize|backgroundColor|boxShadow|borderRadius|tailwind|\.css['"]/i, `visual defaults in ${file}`)
    }
    await compareTree(resolve(ROOT, 'src/presentation-kit'), resolve(bootstrap, 'src/presentation-kit'))
    for (const name of ['browser.mjs', 'verify.mjs', 'inspect-presentation.mjs', 'diagnostics.mjs', 'reference.json']) assert.equal(await readFile(resolve(ROOT, 'scripts', name), 'utf8'), await readFile(resolve(dir, 'scripts', name), 'utf8'))
    output += await run(parent, ['npm', '--prefix', dir, 'run', 'verify'])
    output += await run(dir, ['npm', 'run', 'lint'])
    const sentinel = resolve(dir, 'preserved.txt'); await writeFile(sentinel, 'unchanged')
    const refused = await run(parent, ['node', resolve(ROOT, 'skills/presentation/scaffold.mjs'), dir], { expectFailure: true })
    assert.match(refused, /not empty/); assert.equal(await readFile(sentinel, 'utf8'), 'unchanged')
    await assertCleaned(output)
    await evidence('INT-001', output + '\nASSERTIONS PASS: all anchors/dependencies; root-independent materialization; unstyled bootstrap; byte parity; build/route; nonempty refusal preserves files.\n', 'I-20,I-21,I-22,I-24', 'skills/presentation/templates/bootstrap/; skills/presentation/scaffold.mjs; tests/integration.test.mjs')
  } finally { await rm(parent, { recursive: true, force: true }) }
})
test('INT-002 settled screenshot artifacts warnings and allowed subtrees', { timeout: 180000 }, async () => {
  const dir = await isolatedCopy()
  try {
    await mkdir(resolve(dir, 'src/presentations/diagnostic'), { recursive: true })
    await writeFile(resolve(dir, 'src/presentations/diagnostic/Talk.tsx'), `import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import './fixture.css'
function Diagram({ payload }: SceneProps<number>) { return <div data-fixture-beat={payload}>
<div style={{ position: 'absolute', left: 20, top: 40 }}><span>collision-A</span></div><div style={{ position: 'absolute', left: 20, top: 40 }}><span>collision-B</span></div>
<div data-presentation-allow-overlap="true"><span style={{ position: 'absolute', left: 300, top: 40 }}>allowed-A</span><span style={{ position: 'absolute', left: 300, top: 40 }}>allowed-B</span></div>
<div style={{ position: 'absolute', left: 0, top: 0, width: 20, height: 20, animation: 'arrive 0.25s forwards' }} /></div> }
const steps: Step<number>[] = [0, 1].map(i => ({ id: String(i), era: 'section'+i, title: 'Diagnostic '+i, caption: 'Caption '+i, groupKey: 'fixture', Scene: Diagram, payload: i }))
export default function Talk() { return <Presentation steps={steps} title="Diagnostic fixture" /> }`)
    await writeFile(resolve(dir, 'src/presentations/diagnostic/fixture.css'), `@keyframes arrive { from { background: rgb(255,0,0) } to { background: rgb(0,128,0) } } [data-presentation-root] { font-family: sans-serif } [data-presentation-attribution] { font-size: 8px }`)
    await writeFile(resolve(dir, 'src/presentations/index.ts'), `export const presentations = [{ slug: 'diagnostic', title: 'Diagnostic', load: () => import('./diagnostic/Talk') }]`)
    const started = Date.now()
    const output = await run(dir, ['npm', 'run', 'inspect', '--', 'diagnostic'])
    const directory = resolve(dir, 'artifacts/inspection/diagnostic/1440x900')
    const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'))
    assert.equal(manifest.length, 2)
    for (const [index, entry] of manifest.entries()) {
      assert.equal(entry.index, index); assert.ok(entry.advancedAt >= started)
      assert.ok(entry.capturedAt - entry.advancedAt >= entry.settleMs)
      assert.equal(entry.settleMs, 900)
      const png = await readFile(resolve(directory, `step-${String(index + 1).padStart(2, '0')}.png`))
      assert.equal(png.readUInt32BE(16), 1440); assert.equal(png.readUInt32BE(20), 900)
      const decoded = PNG.sync.read(png), pixel = (230 * decoded.width + 285) * 4
      assert.deepEqual([...decoded.data.subarray(pixel, pixel + 3)], [0, 128, 0], 'captured animation must be settled green')
      assert.ok(entry.warnings.some(w => w.includes(`step ${index}`) && w.includes('collision-A') && w.includes('collision-B')))
      assert.ok(!entry.warnings.some(w => /allowed-[AB]/.test(w)))
      for (const name of ['progress', 'toc']) assert.ok(entry.warnings.some(w => w.includes(`indistinct active ${name}`)), entry.warnings.join('\n'))
      assert.ok(entry.warnings.some(w => w.includes('[data-presentation-attribution]')))
    }
    assert.match(output, /warnings are advisory/); await assertCleaned(output)
    await evidence('INT-002', output + '\nASSERTIONS PASS: per-step PNG dimensions/path, post-settle captures, collision and active/attribution warnings, allowed subtree exemption, advisory success.\n', 'I-41,I-42,I-43,I-44,I-45', 'scripts/inspect-presentation.mjs; scripts/diagnostics.mjs; tests/integration.test.mjs')
  } finally { await rm(dir, { recursive: true, force: true }) }
})
test('E2E-001 reference passes whole-app production verification', { timeout: 120000 }, async () => {
  const output = await run(ROOT, ['npm', 'run', 'verify'])
  for (let i = 0; i < 9; i++) assert.match(output, new RegExp(`PASS step ${i}:`))
  assert.match(output, /127\.0\.0\.1/); assert.doesNotMatch(output, /http:\/\/localhost/)
  assert.match(output, /PASS verification how-to-make-a-presentation/)
  await assertCleaned(output)
  await evidence('E2E-001', output + '\nASSERTIONS PASS: build, canonical outline, route, all nine public indices, IPv4 endpoints, zero exit, cleanup.\n', 'I-33,I-38', 'scripts/verify.mjs; scripts/browser.mjs; src/presentations/; tests/integration.test.mjs')
})
test('E2E-002 actionable verification failures and cleanup', { timeout: 300000 }, async t => {
  const faults = [
    ['build', async dir => writeFile(resolve(dir, 'src/broken.ts'), 'const broken: number = "wrong"; export { broken }'), /FAIL build/],
    ['missing', async dir => writeFile(resolve(dir, 'src/presentations/index.ts'), 'export const presentations: { slug: string; title: string; load: () => Promise<{ default: () => null }> }[] = []'), /FAIL sample.*not registered/],
    ['order', async dir => { const p = resolve(dir, 'src/presentations/how-to-make-a-presentation/steps/index.tsx'); await writeFile(p, (await readFile(p, 'utf8')).replace('You have a topic', 'Wrong order')) }, /FAIL sample step 0/],
    ['console', async dir => { const p = resolve(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); await writeFile(p, (await readFile(p, 'utf8')).replace('return <SceneLayer', 'if (payload.beat === 3) console.error("injected console failure")\n  return <SceneLayer')) }, /FAIL render step 2.*injected console failure/],
    ['page', async dir => { const p = resolve(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); await writeFile(p, (await readFile(p, 'utf8')).replace('return <SceneLayer', 'if (payload.beat === 3) setTimeout(() => { throw new Error("injected page failure") }, 10)\n  return <SceneLayer')) }, /FAIL render step 2.*injected page failure/],
    ['render', async dir => { const p = resolve(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); await writeFile(p, (await readFile(p, 'utf8')).replace('return <SceneLayer', 'if (payload.beat === 3) throw new Error("injected render failure")\n  return <SceneLayer')) }, /FAIL render step 2/],
    ['transition', async dir => { const p = resolve(dir, 'src/presentation-kit/usePresentationNav.ts'); await writeFile(p, (await readFile(p, 'utf8')).replace('i + 1, count', 'i, count')) }, /FAIL render step 1.*transition step 1/],
  ]
  let output = '', failures = 0
  for (const [name, inject, expected] of faults) await t.test(name, async () => {
    const dir = await isolatedCopy()
    try {
      await inject(dir)
      const result = await run(dir, ['npm', 'run', 'verify'], { expectFailure: true })
      assert.match(result, expected); assert.doesNotMatch(result, /PASS verification/)
      await assertCleaned(result)
      output += `\nFAULT ${name}\n${result}`
    } catch (error) { failures++; throw error } finally { await rm(dir, { recursive: true, force: true }) }
  })
  assert.equal(failures, 0, 'verification fault checks must all pass')
  await evidence('E2E-002', output + '\nASSERTIONS PASS: build/missing/order/console/page/render/transition faults fail with phase/step; no false success; preview processes cleaned.\n', 'I-32,I-37,I-39,I-40', 'scripts/verify.mjs; scripts/browser.mjs; tests/integration.test.mjs')
})
