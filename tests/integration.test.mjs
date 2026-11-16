import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const temp = resolve(root, '.test-tmp/integration')
await mkdir(temp, { recursive: true })
const fixtures = await mkdtemp(join(temp, 'run-'))
after(async () => { await rm(fixtures, { recursive: true, force: true }) })
async function command(cwd, executable, args, timeout = 180000) {
  return new Promise((done, reject) => {
    const child = spawn(executable, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', d => { output += d })
    child.stderr.on('data', d => { output += d })
    const timer = setTimeout(() => child.kill('SIGKILL'), timeout)
    child.on('error', reject)
    child.on('exit', (code, signal) => { clearTimeout(timer); done({ code, signal, output }) })
  })
}
async function succeeds(cwd, exe, args, timeout) {
  const result = await command(cwd, exe, args, timeout)
  assert.equal(result.code, 0, result.output)
  return result.output
}
async function copyApp(name) {
  const target = join(fixtures, name)
  await mkdir(target, { recursive: true })
  for (const file of ['package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'src', 'scripts']) await cp(join(root, file), join(target, file), { recursive: true })
  await symlink(resolve(root, 'node_modules'), join(target, 'node_modules'), 'dir')
  return target
}
async function assertPreviewClosed(output) {
  const origins = [...output.matchAll(/preview: (http:\/\/127\.0\.0\.1:\d+) pid=(\d+)/g)]
  for (const [,origin,pid] of origins) {
    assert.ok(output.includes(`preview: cleaned ${origin}`), output)
    assert.throws(() => process.kill(Number(pid), 0), /ESRCH/)
    await assert.rejects(fetch(origin), /fetch failed/)
  }
}
async function allFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async e => e.isDirectory() ? (await allFiles(join(directory, e.name))).map(f => `${e.name}/${f}`) : [e.name]))
  return nested.flat()
}
test('INT-001 materialized bootstrap complete style-neutral cwd-independent and aligned', { timeout: 240000 }, async t => {
  const outside = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  t.after(async () => { await rm(outside, { recursive: true, force: true }) })
  const target = join(outside, 'app')
  const materializer = join(root, 'skills/presentation/scripts/materialize.mjs')
  await succeeds(outside, process.execPath, [materializer, target])
  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  for (const dep of ['react','react-dom','motion','lucide-react']) assert.ok(manifest.dependencies[dep], dep)
  for (const dep of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','globals','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','playwright']) assert.ok(manifest.devDependencies[dep], dep)
  assert.ok(!JSON.stringify(manifest).toLowerCase().includes('tailwind'))
  for (const file of await allFiles(join(root, 'src/presentation-kit'))) assert.equal(await readFile(join(target, 'src/presentation-kit', file), 'utf8'), await readFile(join(root, 'src/presentation-kit', file), 'utf8'), file)
  for (const file of ['browser.mjs','verify.mjs','inspect-presentation.mjs','diagnostics.mjs','reference.mjs']) assert.equal(await readFile(join(target, 'scripts', file), 'utf8'), await readFile(join(root, 'scripts', file), 'utf8'), file)
  const kit = (await Promise.all((await allFiles(join(target, 'src/presentation-kit'))).map(f => readFile(join(target, 'src/presentation-kit', f), 'utf8')))).join('\n')
  assert.doesNotMatch(kit, /(?:fontFamily|fontSize|backgroundColor|boxShadow|borderRadius|color)\s*:/)
  const css = await readFile(join(target, 'src/index.css'), 'utf8')
  assert.doesNotMatch(css, /(?:color|font|border|shadow|--[a-z])\s*:/)
  await succeeds(target, 'npm', ['ci', '--no-audit', '--no-fund'])
  const output = await succeeds(target, 'npm', ['run','verify','--','example'])
  assert.match(output, /PASS verify example/)
  await assertPreviewClosed(output)
  const refusal = await command(outside, process.execPath, [materializer, target])
  assert.notEqual(refusal.code, 0)
  assert.match(refusal.output, /non-empty/)
  assert.equal(await readFile(join(target, 'src/index.css'), 'utf8'), css)
  console.log('INT-001 evidence: fresh npm ci, build, route example, external cwd, exact kit/scripts parity, neutral CSS, collision refusal PASS')
})

test('INT-002 settled screenshots advisory collision exemptions active and attribution diagnostics', { timeout: 180000 }, async () => {
  const target = await copyApp('inspection')
  await mkdir(join(target, 'src/presentations/diagnostic'), { recursive: true })
  await writeFile(join(target, 'src/presentations/diagnostic/Talk.tsx'), `
import { Presentation } from '../../presentation-kit/Presentation'
import type { SceneProps, Step } from '../../presentation-kit/types'
import './fixture.css'
function Diagram({ payload }: SceneProps<number>) { return <div data-variant={payload} data-presentation-allow-overlap={payload === 1 ? '' : undefined}><span style={{position:'absolute',left:40,top:40,whiteSpace:'pre',fontFamily:'monospace'}}>Alpha collision{payload === 1 ? '                              ' : ''}</span><span style={{position:'absolute',left:40,top:40,whiteSpace:'pre',fontFamily:'monospace'}}>{payload === 1 ? '                              ' : ''}Beta collision</span></div> }
const steps: Step<number>[] = [0,1,2].map(i => ({ id: String(i), era: i === 2 ? 'last' : 'first', title: 'Diagnostic '+i, caption: 'Fixture caption.', Scene: Diagram, groupKey: 'fixture', payload: i }))
export default function Talk() { return <Presentation steps={steps} title="Diagnostic" /> }
`)
  await writeFile(join(target, 'src/presentations/diagnostic/fixture.css'), `
[data-presentation-header] { padding:20px; } [data-presentation-caption] { margin:20px; }
[data-presentation-toc] { position:absolute; right:20px; top:120px; }
[data-presentation-toc] button, [data-presentation-progress] button { color:black; background:white; font:14px Arial; border:1px solid black; }
[data-presentation-attribution] a { font-size:8px; }
[data-presentation]:has([data-variant="2"]) [data-presentation-active="true"] { background:black; color:white; font-weight:bold; }
[data-presentation]:has([data-variant="2"]) [data-presentation-attribution] a { font:12px Arial; color:rgb(30,60,50); text-decoration:none; }
`)
  await writeFile(join(target, 'src/presentations/index.ts'), "export const presentations = [{ slug: 'diagnostic', title:'Diagnostic', load: () => import('./diagnostic/Talk') }]\n")
  await succeeds(target, 'npm', ['run','build'])
  const output = await succeeds(target, 'npm', ['run','inspect','--','diagnostic'])
  const directory = join(target, 'artifacts/inspection/diagnostic/1440x900')
  const report = JSON.parse(await readFile(join(directory, 'report.json'), 'utf8'))
  assert.equal(report.length, 3)
  for (let i = 0; i < report.length; i++) {
    assert.equal(report[i].index, i)
    assert.equal(report[i].file, `step-0${i + 1}.png`)
    const png = await readFile(join(directory, report[i].file))
    assert.equal(png.readUInt32BE(16), 1440); assert.equal(png.readUInt32BE(20), 900)
    assert.ok(png.length > 1000)
    if (i) assert.ok(report[i].capturedAt - report[i - 1].capturedAt >= report[i].settle)
    assert.equal(report[i].settle, 850)
  }
  assert.ok(report[0].warnings.some(w => /overlap:.*Alpha collision.*Beta collision/.test(w)), JSON.stringify(report))
  assert.ok(!report[1].warnings.some(w => /Alpha collision|Beta collision/.test(w)), JSON.stringify(report))
  for (const kind of ['progress','toc']) {
    assert.ok(report[0].warnings.some(w => w.includes(`indistinct active ${kind}`)))
    assert.ok(!report[2].warnings.some(w => w.includes(`indistinct active ${kind}`)))
  }
  assert.ok(report[0].warnings.some(w => /attribution.*data-presentation-attribution/.test(w)))
  assert.ok(!report[2].warnings.some(w => w.startsWith('attribution:')))
  assert.match(output, /WARN step 0:/)
  assert.match(output, /warnings are advisory/)
  await assertPreviewClosed(output)
  console.log('INT-002 evidence: 3 PNGs at 1440x900, >=850ms captures, overlap/exemption, defective and polished active/attribution, advisory exit zero PASS')
})

test('E2E-001 reference passes npm run verify production gate', { timeout: 180000 }, async () => {
  const target = await copyApp('reference')
  const output = await succeeds(target, 'npm', ['run','verify'])
  assert.match(output, /PASS verify how-to-make-a-presentation/)
  for (let i = 0; i < 9; i++) assert.match(output, new RegExp(`render: step ${i} / 9 OK`))
  assert.match(output, /http:\/\/127\.0\.0\.1:/)
  assert.doesNotMatch(output, /localhost|FAIL/)
  await assertPreviewClosed(output)
  console.log(output)
})

test('E2E-002 verification faults name phase and step and clean preview', { timeout: 360000 }, async t => {
  const faults = [
    ['build', async target => { await writeFile(join(target,'src/broken.ts'), 'export const broken: number = "bad"\n') }, /FAIL build:/],
    ['missing', async target => { await writeFile(join(target,'src/presentations/index.ts'), 'export const presentations: {slug:string;title:string;load:()=>Promise<{default:()=>null}>}[] = []\n') }, /FAIL sample: missing registered route/],
    ['order', async target => { const p=join(target,'src/presentations/how-to-make-a-presentation/steps/index.ts'); await writeFile(p,(await readFile(p,'utf8')).replace('outline.map','[...outline].reverse().map')) }, /FAIL sample: outline mismatch at step 0/],
    ['count', async target => { const p=join(target,'src/presentations/how-to-make-a-presentation/steps/index.ts'); await writeFile(p,(await readFile(p,'utf8')).replace('outline.map','outline.slice(0,8).map')) }, /FAIL render: step 0: invalid step count 8/],
    ['console', async target => { const p=join(target,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); await writeFile(p,(await readFile(p,'utf8')).replace('return <SceneLayer>', 'if (beat === 2) console.error("injected console fault")\n  return <SceneLayer>')) }, /FAIL render: step 1: injected console fault/],
    ['pageerror', async target => { const p=join(target,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); await writeFile(p,(await readFile(p,'utf8')).replace('return <SceneLayer>', 'if (beat === 2) setTimeout(() => { throw new Error("injected page fault") }, 10)\n  return <SceneLayer>')) }, /FAIL render: step 1: injected page fault/],
    ['render', async target => { const p=join(target,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); await writeFile(p,(await readFile(p,'utf8')).replace('return <SceneLayer>', 'if (beat === 2) throw new Error("injected render fault")\n  return <SceneLayer>')) }, /FAIL render: step 1: injected render fault/],
    ['transition', async target => { const p=join(target,'src/presentation-kit/usePresentationNav.ts'); await writeFile(p,(await readFile(p,'utf8')).replace('clamp(n + 1, count)','clamp(n, count)')) }, /FAIL render: step 1: transition: step 1 did not advance/],
  ]
  const selected = process.env.VERIFY_FAULT ? faults.filter(([name]) => name === process.env.VERIFY_FAULT) : faults
  assert.ok(selected.length, 'VERIFY_FAULT must identify a known fault')
  for (const [name, mutate, expected] of selected) await t.test(name, async () => {
    const target = await copyApp(`fault-${name}`)
    await mutate(target)
    const result = await command(target, 'npm', ['run','verify'])
    assert.notEqual(result.code, 0, result.output)
    assert.match(result.output, expected)
    assert.doesNotMatch(result.output, /PASS verify/)
    await assertPreviewClosed(result.output)
    console.log(`E2E-002 ${name}: ${result.output.match(/FAIL .*/)?.[0]}; subprocess cleanup PASS`)
  })
})
