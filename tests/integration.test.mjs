import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, writeFile, readdir, rm, symlink, stat } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { materialize, bootstrapDirectory } from '../skills/presentation/materialize.mjs'
const ROOT = process.cwd()
const npmCLI = process.env.npm_execpath ?? '/usr/lib/node_modules/npm/bin/npm-cli.js'
const temporary = () => mkdtemp(path.join(os.tmpdir(), 'and-scene-'))
async function command(cwd, args, expected = 0) {
  const child = spawn(process.execPath, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''; child.stdout.on('data', x => { output += x }); child.stderr.on('data', x => { output += x })
  const timer = setTimeout(() => child.kill('SIGKILL'), 150000)
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve) }).finally(() => clearTimeout(timer))
  console.log(output)
  assert.equal(expected === 0 ? code === 0 : code !== 0, true, `exit ${code}; ${output}`)
  return output
}
async function copyApp() {
  const target = await temporary()
  for (const file of ['src', 'scripts', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) await cp(path.join(ROOT, file), path.join(target, file), { recursive: true })
  await symlink(path.join(ROOT, 'node_modules'), path.join(target, 'node_modules'), 'dir')
  return target
}
async function compareTree(a, b) {
  const names = (await readdir(a)).filter(name => !/\.test\./.test(name))
  assert.deepEqual((await readdir(b)).filter(name => !/\.test\./.test(name)), names)
  for (const name of names) { const left = path.join(a, name), right = path.join(b, name); if ((await stat(left)).isDirectory()) await compareTree(left, right); else assert.equal(await readFile(left, 'utf8'), await readFile(right, 'utf8'), `template drift: ${name}`) }
}
function assertCleanup(output) {
  const pids = [...output.matchAll(/preview: http:\/\/127\.0\.0\.1:\d+ pid=(\d+)/g)].map(match => Number(match[1]))
  for (const pid of pids) assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
  assert.ok(output.includes('cleanup: browser and preview stopped'))
}
test('INT-001 materialized bootstrap is complete and style-neutral', { timeout: 180000 }, async () => {
  const parent = await temporary(); const target = path.join(parent, 'app')
  try {
    // CLI is invoked with an external working directory, not the repository root.
    await command(parent, [path.join(ROOT, 'skills/presentation/materialize.mjs'), target])
    await assert.rejects(materialize(target), /empty resolved target/)
    await compareTree(path.join(ROOT, 'src/presentation-kit'), path.join(target, 'src/presentation-kit'))
    for (const name of ['verify.mjs', 'inspect-presentation.mjs', 'browser.mjs', 'diagnostics.mjs', 'reference.json']) assert.equal(await readFile(path.join(ROOT, 'scripts', name), 'utf8'), await readFile(path.join(target, 'scripts', name), 'utf8'))
    const pkg = JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) assert.ok(pkg.dependencies[name])
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) assert.ok(pkg.devDependencies[name])
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    assert.equal((await readFile(path.join(target, 'src/index.css'), 'utf8')).trim(), '/* Host styles are opt-in. */')
    assert.ok(await stat(path.join(target, 'src/presentations/index.ts')))
    await command(target, [npmCLI, 'ci', '--no-audit', '--no-fund'])
    const output = await command(target, [npmCLI, 'run', 'verify']); assert.match(output, /PASS: build, render \(example\)/); assertCleanup(output)
    console.log(`INT-001: independent template root ${bootstrapDirectory}; byte parity, anchors, dependencies, build and route smoke PASS`)
  } finally { await rm(parent, { recursive: true, force: true }) }
})
const diagnosticFixture = `import { useEffect, useState } from 'react'
export default function Talk() {
 const [step, setStep] = useState(0); const [ready, setReady] = useState(false)
 useEffect(() => { setReady(false); const timer = setTimeout(() => setReady(true), 350); return () => clearTimeout(timer) }, [step])
 useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') setStep(s => Math.min(1, s + 1)) }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [])
 return <main data-presentation-root="" data-step-count="2" data-step-index={step} style={{height:900}}>
 <span style={{position:'absolute',left:40,top:40}}>settled {ready ? step : 'not-ready'}</span><span style={{position:'absolute',left:40,top:40}}>collision</span>
 <div data-presentation-allow-overlap=""><span style={{position:'absolute',left:40,top:100}}>intentional one</span><span style={{position:'absolute',left:40,top:100}}>intentional two</span></div>
 <nav data-presentation-progress="" style={{position:'absolute',top:200}}><button data-presentation-active="true">active</button><button data-presentation-active="false">inactive</button></nav>
 <nav data-presentation-toc="" style={{position:'absolute',top:250}}><button data-presentation-active="true">era one</button><button data-presentation-active="false">era two</button></nav>
 <div data-presentation-attribution="" style={{position:'absolute',top:300}}><a style={{fontSize:9}} href="https://github.com/Codagent-AI/and-scene">made by and-scene</a></div>
 </main>
}`
test('INT-002 screenshots are settled predictable artifacts and diagnostics stay advisory', { timeout: 180000 }, async () => {
  const target = await temporary()
  try {
    await cp(bootstrapDirectory, target, { recursive: true }); await symlink(path.join(ROOT, 'node_modules'), path.join(target, 'node_modules'), 'dir')
    await writeFile(path.join(target, 'src/presentations/example/Talk.tsx'), diagnosticFixture)
    const output = await command(target, ['scripts/inspect-presentation.mjs', 'example', '--settle', '500'])
    assertCleanup(output); assert.match(output, /warnings are advisory/)
    const dir = path.join(target, '.presentation-artifacts/example/1440x900'); const report = JSON.parse(await readFile(path.join(dir, 'report.json'), 'utf8')); assert.equal(report.length, 2)
    for (const [step, item] of report.entries()) {
      assert.equal(item.file, `step-0${step + 1}.png`); assert.ok(item.elapsedBeforeCapture >= 500); assert.equal(item.settle, 500)
      const png = await readFile(path.join(dir, item.file)); assert.equal(png.subarray(1, 4).toString(), 'PNG'); assert.equal(png.readUInt32BE(16), 1440); assert.equal(png.readUInt32BE(20), 900)
      assert.ok(item.warnings.some(w => w.includes(`step ${step}: overlap: settled ${step} / collision`)))
      assert.ok(item.warnings.some(w => w.includes(`step ${step}: indistinct active progress`))); assert.ok(item.warnings.some(w => w.includes(`step ${step}: indistinct active toc`))); assert.ok(item.warnings.some(w => w.includes(`step ${step}: unpolished attribution`)))
      assert.ok(item.warnings.every(w => !w.includes('intentional') && !w.includes('not-ready')))
    }
    console.log('INT-002: 2 settled desktop PNGs, collisions, subtree exemptions, active progress/ToC, attribution, advisory exit PASS')
  } finally { await rm(target, { recursive: true, force: true }) }
})
test('E2E-001 reference presentation passes production verification', { timeout: 180000 }, async () => {
  const output = await command(ROOT, [npmCLI, 'run', 'verify']); for (let i = 0; i < 9; i++) assert.ok(output.includes(`render: step ${i}/8 PASS`)); assert.match(output, /PASS: build, reference sample, render/); assert.match(output, /http:\/\/127\.0\.0\.1:/); assertCleanup(output)
})
test('E2E-002 verification failures identify phase and step and clean preview processes', { timeout: 300000 }, async () => {
  const cases = [
    { name: 'build', file: 'src/main.tsx', edit: text => text + '\nconst broken: number = "build failure"\n', message: /FAIL: build:/ },
    { name: 'missing sample', file: 'src/presentations/how-to-make-a-presentation/metadata.json', edit: text => text, message: /FAIL: sample:/, remove: true },
    { name: 'out-of-order sample', file: 'src/presentations/how-to-make-a-presentation/metadata.json', edit: text => JSON.stringify(JSON.parse(text).reverse()), message: /FAIL: sample:/ },
    { name: 'console', file: 'src/presentations/how-to-make-a-presentation/steps/index.tsx', edit: text => text.replace('return <SceneLayer>', "if (payload === 3) console.error('injected console fault'); return <SceneLayer>"), message: /FAIL: render: step 2: console:.*injected console fault/ },
    { name: 'pageerror', file: 'src/presentations/how-to-make-a-presentation/steps/index.tsx', edit: text => text.replace('return <SceneLayer>', "if (payload === 3) setTimeout(() => { throw new Error('injected page fault') }, 0); return <SceneLayer>"), message: /FAIL: render: step 2: pageerror:.*injected page fault/ },
    { name: 'render', file: 'src/presentations/how-to-make-a-presentation/steps/index.tsx', edit: text => text.replace('return <SceneLayer>', "if (payload === 3) throw new Error('injected render fault'); return <SceneLayer>"), message: /FAIL: render: step 2:/ },
    { name: 'transition', file: 'src/presentation-kit/usePresentationNav.ts', edit: text => text.replace('if ([\'ArrowRight\', \' \', \'PageDown\'].includes(event.key))', "if ([' ', 'PageDown'].includes(event.key))"), message: /FAIL: render: step 1: transition:/ },
  ]
  for (const fault of cases) {
    const target = await copyApp()
    try {
      const file = path.join(target, fault.file); await writeFile(file, fault.edit(await readFile(file, 'utf8')))
      // Missing runtime artifact must survive the TypeScript build so the sample phase rejects it.
      if (fault.remove) await rm(path.join(target, 'src/presentations/how-to-make-a-presentation/Talk.tsx'))
      if (fault.remove) await writeFile(path.join(target, 'src/presentations/index.ts'), `import type { ComponentType } from 'react'\nexport const presentations: { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }[] = []\n`)
      const output = await command(target, [npmCLI, 'run', 'verify'], 1); assert.match(output, fault.message, fault.name)
      if (['console', 'pageerror', 'render', 'transition'].includes(fault.name)) assertCleanup(output)
      console.log(`E2E-002 ${fault.name}: expected actionable failure PASS`)
    } finally { await rm(target, { recursive: true, force: true }) }
  }
})
