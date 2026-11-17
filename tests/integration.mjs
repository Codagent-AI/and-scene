import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, rm, symlink, readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
const root = fileURLToPath(new URL('../', import.meta.url))
async function command(cwd, args) {
  const child = spawn('npm', args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', data => { output += data }); child.stderr.on('data', data => { output += data })
  const timer = setTimeout(() => child.kill('SIGTERM'), 120000)
  const [code] = await once(child, 'exit'); clearTimeout(timer)
  return { code, output }
}
async function disposable(action, template = false) {
  const dir = await mkdtemp(join(tmpdir(), 'and-scene-'))
  try {
    if (template) await cp(resolve(root, 'skills/presentation/templates/bootstrap'), dir, { recursive: true })
    else {
      for (const file of ['src', 'scripts', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'presentation.config.json']) await cp(resolve(root, file), resolve(dir, file), { recursive: true })
      await symlink(resolve(root, 'node_modules'), resolve(dir, 'node_modules'), 'dir')
    }
    return await action(dir)
  } finally { await rm(dir, { recursive: true, force: true }) }
}
async function compareTree(a, b) {
  const names = (await readdir(a)).sort(); assert.deepEqual(names, (await readdir(b)).sort())
  for (const name of names) { const aa = join(a, name), bb = join(b, name); if ((await stat(aa)).isDirectory()) await compareTree(aa, bb); else assert.equal(await readFile(aa, 'utf8'), await readFile(bb, 'utf8'), `byte parity: ${name}`) }
}
function assertCleanup(output) {
  const pids = [...output.matchAll(/preview http:\/\/127\.0\.0\.1:\d+ pid=(\d+)/g)].map(m => Number(m[1]))
  for (const pid of pids) { assert.match(output, new RegExp(`preview cleaned pid=${pid}`)); assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' }) }
}
async function recordRows(numbers, evidence, code) {
  // Optional implementation evidence sink; normal project tests do not mutate specs.
  if (!process.env.AND_SCENE_EVIDENCE || !process.env.AND_SCENE_CHECKLIST) return
  const file = process.env.AND_SCENE_CHECKLIST
  let text = await readFile(file, 'utf8')
  for (const n of numbers) {
    const previous = text.split('\n').find(line => line.startsWith(`| I-${n} |`))
    const cells = previous.split('|')
    cells[5] = ` ${code} `
    const earlier = cells[6].trim()
    cells[6] = ` ${earlier === 'Not yet run.' ? '' : earlier + ' '}${evidence} `
    cells[7] = ' verified '
    text = text.replace(previous, cells.join('|'))
  }
  await writeFile(file, text)
}
const save = async (name, output) => {
  if (process.env.AND_SCENE_EVIDENCE) await writeFile(resolve(process.env.AND_SCENE_EVIDENCE, name), output)
}
test('INT-001 materialized bootstrap is complete and style-neutral', { timeout: 180000 }, async () => {
  await disposable(async dir => {
    const install = await command(dir, ['ci', '--no-audit', '--no-fund']); await save('INT-001-install.log', install.output); assert.equal(install.code, 0, install.output)
    const result = await command(dir, ['run', 'verify']); await save('INT-001-verify.log', result.output); assert.equal(result.code, 0, result.output); assert.match(result.output, /PASS build \+ sample \+ render/); assertCleanup(result.output)
    const lint = await command(dir, ['run', 'lint']); assert.equal(lint.code, 0, lint.output)
    const pkg = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8'))
    for (const dep of ['react','react-dom','motion','lucide-react','vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright']) assert.ok(pkg.dependencies[dep] || pkg.devDependencies[dep], dep)
    assert.ok(!JSON.stringify(pkg).includes('tailwind'))
    await compareTree(resolve(root, 'src/presentation-kit'), resolve(dir, 'src/presentation-kit'))
    for (const file of ['browser.mjs','verify.mjs','inspect-presentation.mjs','diagnostics.mjs','validation.mjs']) assert.equal(await readFile(resolve(root,'scripts',file),'utf8'),await readFile(resolve(dir,'scripts',file),'utf8'))
    const css = await readFile(resolve(dir,'src/index.css'),'utf8'); assert.ok(!/[{}]/.test(css))
    for (const file of ['src/presentations/index.ts','src/main.tsx','src/presentation-kit/Presentation.tsx']) assert.ok((await stat(resolve(dir,file))).isFile())
    await save('INT-001-contracts.txt', 'INT-001 materialized bootstrap: npm ci; local verify production route and clean server exit; lint; all dependency assertions; complete kit tree byte comparison; all shared browser script bytes aligned; neutral CSS and no framework dependency; all three anchor files present. PASS\n')
    await recordRows([8,26,27,28,29,35,56], '`INT-001-contracts.txt`, `INT-001-install.log`, `INT-001-verify.log` — INT-001 materialized bootstrap is complete and style-neutral.', 'skills/presentation/templates/bootstrap/; scripts/; tests/integration.mjs')
  }, true)
})
test('INT-002 screenshot helper emits settled artifacts and advisory warnings', { timeout: 120000 }, async () => {
  await disposable(async dir => {
    const talk = `import { useState, useEffect } from 'react'
import { Presentation } from '../../presentation-kit'
function Scene() { return <div><span style={{position:'absolute',left:50,top:50}}>Collision A</span><span style={{position:'absolute',left:50,top:50}}>Collision B</span><div data-presentation-allow-overlap><span style={{position:'absolute',left:150,top:150}}>Allowed A</span><span style={{position:'absolute',left:150,top:150}}>Allowed B</span></div></div> }
export default function Talk() { const [ready,setReady]=useState(false); useEffect(()=>{ const id=setTimeout(()=>setReady(true),100); return ()=>clearTimeout(id) },[]); return <div style={{fontFamily:'Arial'}} data-ready={ready}><style>{'[data-presentation-attribution]{font-size:8px}'}</style><Presentation title="Fixture" steps={[{id:'a',era:'first',title:'First',caption:'Caption one',Scene,payload:undefined},{id:'b',era:'second',title:'Second',caption:'Caption two',Scene,payload:undefined}]} /></div> }
`
    await writeFile(resolve(dir,'src/presentations/how-to-make-a-presentation/Talk.tsx'),talk)
    await writeFile(resolve(dir,'presentation.config.json'),JSON.stringify({slug:'how-to-make-a-presentation',reference:false}))
    const cli = await command(dir,['run','inspect','--','how-to-make-a-presentation']); await save('INT-002-cli.log',cli.output); assert.equal(cli.code,0,cli.output); assert.match(cli.output,/ADVISORY step 1/); assertCleanup(cli.output)
    const report = JSON.parse(await readFile(resolve(dir,'artifacts/inspection/how-to-make-a-presentation/1440x900/report.json'),'utf8'))
    assert.equal(report.length,2)
    for (const row of report) {
      assert.ok(row.waitedMs>=900); assert.match(row.file,/artifacts\/inspection\/how-to-make-a-presentation\/1440x900\/step-0[12]\.png$/)
      const png=await readFile(row.file); assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]); assert.equal(png.readUInt32BE(16),1440); assert.equal(png.readUInt32BE(20),900)
      assert.ok(row.warnings.some(w=>w.includes('Collision A')&&w.includes('Collision B'))); assert.ok(!row.warnings.some(w=>w.includes('Allowed')))
      assert.ok(row.warnings.some(w=>w.includes('indistinct active progress'))); assert.ok(row.warnings.some(w=>w.includes('indistinct active toc'))); assert.ok(row.warnings.some(w=>w.includes('unpolished attribution')))
    }
    await save('INT-002-report.json',JSON.stringify(report,null,2))
    await recordRows([37,51,52,53,54,55], '`INT-002-cli.log`, `INT-002-report.json` — INT-002 screenshot helper emits settled artifacts and advisory warnings; PNG dimensions, timing, diagnostic variants and advisory exit asserted.', 'scripts/inspect-presentation.mjs; scripts/diagnostics.mjs; tests/integration.mjs')
  })
})
test('E2E-001 reference presentation passes production verification', { timeout: 120000 }, async () => {
  const result = await command(root,['run','verify']); await save('E2E-001.log',result.output); assert.equal(result.code,0,result.output)
  for(let i=0;i<9;i++) assert.match(result.output,new RegExp(`render PASS step ${i}/8`))
  assert.match(result.output,/preview http:\/\/127\.0\.0\.1:/); assert.match(result.output,/PASS build \+ sample \+ render/); assertCleanup(result.output)
  await recordRows([35,40,41,47,48], '`E2E-001.log` — E2E-001 reference presentation passes production verification: whole-app build, normative metadata, all nine indices, IPv4 preview, zero exit and cleanup.', 'scripts/verify.mjs; scripts/browser.mjs; tests/integration.mjs')
})
test('E2E-002 verification failures are actionable and cleaned up', { timeout: 360000 }, async t => {
  const faults = [
    ['build', async dir=>writeFile(resolve(dir,'src/broken.ts'),'const x: number = "broken"; export { x }'), /FAIL build phase/],
    ['missing', async dir=>writeFile(resolve(dir,'src/presentations/index.ts'),`import type { ComponentType } from 'react'\nexport const presentations: {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}[]=[]\nexport const findPresentation=(_path:string)=>presentations[0]\n`), /FAIL sample\/route phase step 0/],
    ['order', async dir=>{ const file=resolve(dir,'src/presentations/how-to-make-a-presentation/metadata.ts'); const text=await readFile(file,'utf8'); await writeFile(file,text.replace('You have a topic','Wrong opening')) }, /FAIL sample phase step 0/],
    ['console', async dir=>{ const file=resolve(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); const text=await readFile(file,'utf8'); await writeFile(file,text.replace('return <SceneLayer>',`if (payload.beat === 2) console.error('injected console fault')\n  return <SceneLayer>`)) }, /FAIL render phase step 1:.*injected console fault/],
    ['page', async dir=>{ const file=resolve(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); const text=await readFile(file,'utf8'); await writeFile(file,text.replace('return <SceneLayer>',`if (payload.beat === 2) setTimeout(() => { throw new Error('injected page fault') }, 10)\n  return <SceneLayer>`)) }, /FAIL render phase step 1:.*injected page fault/],
    ['render', async dir=>{ const file=resolve(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'); const text=await readFile(file,'utf8'); await writeFile(file,text.replace('return <SceneLayer>',`if (payload.beat === 2) throw new Error('injected render fault')\n  return <SceneLayer>`)) }, /FAIL (render|transition) phase step 1/],
    ['transition', async dir=>{ const file=resolve(dir,'src/presentation-kit/usePresentationNav.ts'); const text=await readFile(file,'utf8'); await writeFile(file,text.replace('i + 1, count','i + 0, count')) }, /FAIL transition phase step 1/],
  ]
  for(const [name,inject,expected] of faults) await t.test(name,async()=>disposable(async dir=>{
    await inject(dir)
    const result=await command(dir,['run','verify']); await save(`E2E-002-${name}.log`,result.output)
    assert.notEqual(result.code,0,result.output); assert.match(result.output,expected); assert.ok(!result.output.includes('PASS build + sample + render verification')); assertCleanup(result.output)
    const coverage = { build: [40], missing: [46], order: [46], console: [49], page: [49], render: [49], transition: [49] }
    await recordRows(coverage[name], '`E2E-002-' + name + '.log` — E2E-002/' + name + ' fault: nonzero exit, phase/step context, no false success and cleanup asserted.', 'scripts/verify.mjs; scripts/browser.mjs; tests/integration.mjs')
  }))
  await save('E2E-002-contracts.txt', 'E2E-002 build/missing/order/console/page/render/transition variants all passed with nonzero exits, phase/step context, no false success and process cleanup.\n')
  await recordRows([50], '`E2E-001.log`, `E2E-002-contracts.txt` and per-fault E2E-002 logs — named success and failure/cleanup assertions.', 'scripts/verify.mjs; scripts/browser.mjs; tests/integration.mjs')
})
