import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repository = fileURLToPath(new URL('../', import.meta.url))
const evidence = process.env.EVIDENCE_DIR
const evidencePrefix = process.env.EVIDENCE_PREFIX ?? ''
async function command(cwd, args, name, timeout = 120000) {
  const child = spawn('npm', args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', d => { output += d }); child.stderr.on('data', d => { output += d })
  const timer = setTimeout(() => child.kill('SIGTERM'), timeout)
  const code = await new Promise((resolveCode, reject) => { child.on('exit', resolveCode); child.on('error', reject) })
  clearTimeout(timer)
  if (evidence) await writeFile(join(evidence, `${evidencePrefix}${name}.log`), `Command: npm ${args.join(' ')}\nCwd: ${cwd}\n${output}\nExit: ${code}\n`)
  return { code, output }
}
async function files(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(entries.map(async e => e.isDirectory() ? files(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]))).flat().sort()
}
async function parity(source, target) {
  const list = await files(source)
  assert.deepEqual(await files(target), list)
  for (const f of list) assert.deepEqual(await readFile(join(target, f)), await readFile(join(source, f)), `snapshot drift: ${f}`)
}
async function checkout(prefix) {
  const cwd = await mkdtemp(join(tmpdir(), prefix))
  for (const f of ['src', 'scripts', 'package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts']) await cp(join(repository, f), join(cwd, f), { recursive: true })
  // Fault tests share already-installed dependencies; source/build outputs stay isolated.
  const { symlink } = await import('node:fs/promises')
  await symlink(join(repository, 'node_modules'), join(cwd, 'node_modules'), 'dir')
  return cwd
}
async function replace(cwd, path, from, to) {
  const p = join(cwd, path), s = await readFile(p, 'utf8')
  assert.ok(s.includes(from), `fault injection target missing: ${from}`)
  await writeFile(p, s.replace(from, to))
}

test('INT-001 materialized bootstrap is complete, portable, aligned and style-neutral', { timeout: 180000 }, async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  try {
    await cp(join(repository, 'skills/presentation/templates/bootstrap'), cwd, { recursive: true })
    await parity(join(repository, 'src/presentation-kit'), join(cwd, 'src/presentation-kit'))
    for (const f of ['browser-session.mjs', 'verify.mjs', 'inspect-presentation.mjs', 'visual-diagnostics.mjs', 'reference-outline.json']) assert.deepEqual(await readFile(join(repository, 'scripts', f)), await readFile(join(cwd, 'scripts', f)))
    const pkg = JSON.parse(await readFile(join(cwd, 'package.json')))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) assert.ok(pkg.dependencies[name], name)
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright']) assert.ok(pkg.devDependencies[name], name)
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    for (const f of await files(join(cwd, 'src/presentation-kit'))) {
      const source = await readFile(join(cwd, 'src/presentation-kit', f), 'utf8')
      assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b|fontFamily:|boxShadow:|borderRadius:|backgroundColor:|padding:|className="[^"]+"/i, f)
    }
    assert.doesNotMatch(await readFile(join(cwd, 'src/index.css'), 'utf8'), /\{/) // no scaffold visual rules
    assert.equal((await command(cwd, ['ci', '--ignore-scripts'], 'INT-001-install')).code, 0)
    const result = await command(cwd, ['run', 'verify'], 'INT-001')
    assert.equal(result.code, 0, result.output); assert.match(result.output, /PASS: build, sample, render \(starter\)/)
    assert.match(result.output, /127\.0\.0\.1/); assert.match(result.output, /render: step 0 clean/)
    if (evidence) await writeFile(join(evidence, `${evidencePrefix}INT-001-assertions.log`), 'INT-001 PASS: external temporary materialization; npm ci from lock; all anchors/dependencies; byte parity for kit/scripts; style-neutral dependency/source checks; starter production build and render.\n')
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

test('INT-002 inspection captures settled artifacts and advisory diagnostics with overlap exemptions', { timeout: 120000 }, async () => {
  const cwd = await checkout('and-scene-inspection-')
  try {
    await writeFile(join(cwd, 'src/presentations/how-to-make-a-presentation/Talk.tsx'), `import { useLayoutEffect, useRef } from 'react'
import { Presentation } from '../../presentation-kit/Presentation'
import type { Step, SceneProps } from '../../presentation-kit/types'
function Scene({ payload }: SceneProps<number>) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const animation = ref.current!.animate([{transform:'translateX(0px)'},{transform:'translateX(12px)'}], {duration:400,fill:'forwards'})
    animation.id = 'inspection-transition-'+payload
    const long = ref.current!.animate([{opacity:1},{opacity:0.99}], {duration:1800,fill:'forwards'})
    long.id = 'inspection-long-'+payload
    return () => { animation.cancel(); long.cancel() }
  }, [payload])
  return <div ref={ref}>
  <div style={{position:'absolute',left:100,top:100}}>collision-alpha-{payload}</div>
  <div style={{position:'absolute',left:100,top:100}}>collision-beta-{payload}</div>
  <button aria-label="icon-previous" style={{position:'absolute',left:650,top:100,width:32,height:32}}><svg aria-hidden="true"><path d="M0 0L10 10"/></svg></button>
  <button aria-label="icon-next" style={{position:'absolute',left:650,top:100,width:32,height:32}}><svg aria-hidden="true"><path d="M0 0L10 10"/></svg></button>
  <div data-presentation-allow-overlap="" style={{position:'absolute',left:400,top:100}}><span>intentional-one</span><span style={{position:'absolute',left:0}}>intentional-two</span></div>
</div> }
const steps: Step<number>[] = [0,1,2].map(i=>({id:String(i),era:'era-'+i,title:'Fixture '+i,caption:'Fixture caption '+i,Scene,payload:i,groupKey:'fixture'}))
export default function Talk(){return <><style>{'[data-presentation-attribution]{font-size:8px} [data-presentation-progress-entry],[data-presentation-toc-entry]{color:black;background:white;font-weight:400;border:0;outline:0;box-shadow:none;opacity:1;transform:none} [data-presentation-active="true"]{border-color:red;outline-color:red} [data-presentation-active="false"]{border-color:blue;outline-color:blue}'}</style><Presentation title="Inspection fixture" steps={steps}/></>}
`)
    const result = await command(cwd, ['run', 'inspect', '--', 'how-to-make-a-presentation'], 'INT-002')
    assert.equal(result.code, 0, result.output)
    const directory = join(cwd, 'artifacts/inspection/how-to-make-a-presentation')
    const report = JSON.parse(await readFile(join(directory, 'report.json')))
    assert.equal(report.length, 3)
    for (let i = 0; i < report.length; i++) {
      const item = report[i]
      assert.equal(item.index, i); assert.equal(item.screenshot, `step-0${i + 1}.png`); assert.equal(item.settle, 850)
      const png = await readFile(join(directory, item.screenshot))
      assert.equal(png.readUInt32BE(16), 1440); assert.equal(png.readUInt32BE(20), 900)
      assert.ok(item.captureStartedAt - item.transitionObservedAt >= item.settle, `step ${i}: capture before configured post-transition delay`)
      const animation = item.animations.find(a => a.id === `inspection-transition-${i}`)
      assert.ok(animation, `step ${i}: actual fixture transition missing`)
      assert.equal(animation.duration, 400)
      assert.equal(animation.playState, 'finished', `step ${i}: transition not settled before capture`)
      assert.ok(animation.currentTime >= animation.duration)
      assert.ok(item.captureStartedAt >= animation.startTime + animation.duration)
      const long = item.animations.find(a => a.id === `inspection-long-${i}`)
      assert.ok(long, `step ${i}: long fixture animation missing`)
      assert.equal(long.playState, 'finished', `step ${i}: animation longer than the settle interval captured mid-flight`)
      assert.ok(item.warnings.some(w => w.includes('icon-previous') && w.includes('icon-next')))
      if (i > 0) assert.ok(item.capturedAt - report[i-1].capturedAt >= 850)
      assert.ok(item.warnings.some(w => w.includes(`collision-alpha-${i}`) && w.includes(`collision-beta-${i}`)))
      assert.ok(!item.warnings.some(w => w.includes('intentional-one') || w.includes('intentional-two')))
      assert.ok(item.warnings.some(w => w.includes('indistinct active chrome: progress-entry')))
      assert.ok(item.warnings.some(w => w.includes('indistinct active chrome: toc-entry')))
      assert.ok(item.warnings.some(w => w.includes('unpolished attribution') && w.includes('[data-presentation-attribution]')))
      assert.match(result.output, new RegExp('ADVISORY step '+i+':'))
    }
    if (evidence) await writeFile(join(evidence, `${evidencePrefix}INT-002-assertions.log`), 'INT-002 PASS: three 1440x900 PNGs, ordered predictable paths, >=850ms after each observed step transition; real 400ms Web Animations transitions finished before capture (start/current/duration/playState recorded), per-step text/text, text/chrome and icon-only chrome/chrome warnings, explicit subtree exemptions, active progress/contents warnings, small-attribution hook guidance, advisory success exit.\n'+JSON.stringify(report,null,2))
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

test('E2E-001 canonical reference passes production verification', { timeout: 120000 }, async () => {
  const cwd = await checkout('and-scene-success-')
  try {
    const result = await command(cwd, ['run', 'verify'], 'E2E-001')
    assert.equal(result.code, 0, result.output)
    assert.match(result.output, /PASS: build, sample, render/)
    assert.match(result.output, /host\/probe\/browser http:\/\/127\.0\.0\.1:/)
    for (let i = 0; i < 9; i++) assert.match(result.output, new RegExp(`render: step ${i} clean`))
    assert.match(result.output, /preview: cleaned up/)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

const talk = 'src/presentations/how-to-make-a-presentation/Talk.tsx'
const scene = 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'
const cases = [
  ['build', async cwd => replace(cwd, talk, 'export default', 'const invalid: string = 1; console.log(invalid)\nexport default'), /build: npm run build exited/],
  ['missing', async cwd => writeFile(join(cwd, 'src/presentations/index.ts'), "import type { ComponentType } from 'react'\nexport const presentations: {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}[] = []\n"), /render: step 0/],
  ['order', async cwd => { const p = join(cwd, 'src/presentations/how-to-make-a-presentation/outline.json'); const rows = JSON.parse(await readFile(p)); [rows[0],rows[1]] = [rows[1],rows[0]]; await writeFile(p, JSON.stringify(rows)) }, /sample: step 0 title/],
  ['count', async cwd => { const p = join(cwd, 'src/presentations/how-to-make-a-presentation/outline.json'); const rows = JSON.parse(await readFile(p)); rows.pop(); await writeFile(p, JSON.stringify(rows)) }, /render: step 0: sample: invalid step count 8, expected 9/],
  ['console', async cwd => replace(cwd, scene, 'return <SceneLayer>', "if (beat === 2) console.error('injected console fault')\n  return <SceneLayer>"), /render: step 1:.*injected console fault/],
  ['runtime', async cwd => replace(cwd, scene, 'return <SceneLayer>', "if (beat === 2) throw new Error('injected render fault')\n  return <SceneLayer>"), /render: step 1/],
  ['pageerror', async cwd => replace(cwd, scene, 'return <SceneLayer>', "if (beat === 2) setTimeout(() => { throw new Error('injected uncaught fault') }, 20)\n  return <SceneLayer>"), /render: step 1:.*injected uncaught fault/],
  ['transition', async cwd => replace(cwd, 'src/presentation-kit/usePresentationNav.ts', 'clampIndex(i + 1, count)', 'clampIndex(i, count)'), /render: step 1/],
]
for (const [name, inject, expected] of cases) test(`E2E-002 ${name} fault fails with actionable phase and cleanup`, { timeout: 120000 }, async () => {
  const cwd = await checkout(`and-scene-fault-${name}-`)
  try {
    await inject(cwd)
    const result = await command(cwd, ['run', 'verify'], `E2E-002-${name}`)
    assert.notEqual(result.code, 0, result.output); assert.match(result.output, /FAIL:/); assert.match(result.output, expected); assert.doesNotMatch(result.output, /PASS:/)
    if (name !== 'build') {
      assert.match(result.output, /preview: cleaned up/)
      const url = result.output.match(/host\/probe\/browser (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
      assert.ok(url)
      await assert.rejects(fetch(url))
    }
  } finally { await rm(cwd, { recursive: true, force: true }) }
})
