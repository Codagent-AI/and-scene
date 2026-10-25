import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, writeFile, mkdir, rm, readdir, symlink, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { inspectPresentation } from '../scripts/inspect-presentation.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = resolve(root, 'skills/presentation/templates/bootstrap')
async function command(cmd, args, cwd, limit = 120000) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, NO_COLOR: '1' }, detached: true })
    let output = ''
    const timer = setTimeout(() => { process.kill(-child.pid, 'SIGKILL'); reject(new Error(`timeout ${cmd}: ${output}`)) }, limit)
    child.stdout.on('data', data => { output += data })
    child.stderr.on('data', data => { output += data })
    child.on('error', error => { clearTimeout(timer); reject(error) })
    child.on('close', code => { clearTimeout(timer); console.log(output); resolve({ code, output }) })
  })
}
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(entries.map(async e => e.isDirectory() ? (await files(join(dir, e.name))).map(p => join(e.name, p)) : [e.name]))).flat().sort()
}
async function temporary(action) {
  const dir = await mkdtemp(join(tmpdir(), 'and-scene-'))
  try { return await action(dir) } finally { await rm(dir, { recursive: true, force: true }) }
}
async function copyApp(dir, source = root) {
  for (const path of ['src', 'scripts', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) await cp(join(source,path),join(dir,path),{recursive:true})
  await symlink(join(root,'node_modules'), join(dir,'node_modules'), 'dir')
}
function cleaned(output) {
  const started = [...output.matchAll(/PREVIEW .* PID (\d+)/g)].map(m => m[1])
  for (const pid of started) {
    assert.ok(output.includes(`CLEANUP preview PID ${pid}`), `cleanup reported for ${pid}`)
    assert.throws(() => process.kill(Number(pid), 0), { code: 'ESRCH' })
  }
}

test('INT-001 materialized bootstrap installs builds verifies outside source and stays neutral/aligned', { timeout: 180000 }, async () => {
  await temporary(async dir => {
    const app = join(dir,'app'), caller = join(dir,'caller')
    await cp(bootstrap, app, { recursive: true }); await mkdir(caller)
    const installed = await command('npm', ['ci','--prefer-offline','--no-audit','--no-fund'], app)
    assert.equal(installed.code,0)
    const pkg = JSON.parse(await readFile(join(app,'package.json'),'utf8'))
    for (const dep of ['react','react-dom','motion','lucide-react','vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright']) assert.ok(pkg.dependencies?.[dep] || pkg.devDependencies?.[dep], dep)
    assert.ok(!Object.keys({...pkg.dependencies,...pkg.devDependencies}).some(dep => /tailwind/.test(dep)))
    for (const anchor of ['vite.config.ts','src/presentation-kit/Presentation.tsx','src/presentations/index.ts']) assert.ok((await stat(join(app,anchor))).isFile())
    const canonicalFiles = await files(join(root,'src/presentation-kit'))
    assert.deepEqual(await files(join(app,'src/presentation-kit')),canonicalFiles)
    for (const path of canonicalFiles) assert.equal(await readFile(join(app,'src/presentation-kit',path),'utf8'), await readFile(join(root,'src/presentation-kit',path),'utf8'), path)
    for (const path of await files(join(root,'scripts'))) assert.equal(await readFile(join(app,'scripts',path),'utf8'),await readFile(join(root,'scripts',path),'utf8'),path)
    assert.equal(await readFile(join(app,'src/index.css'),'utf8'),'/* Host geometry only. Author all presentation styles locally. */\nbody { margin: 0; }\n')
    const result = await command(process.execPath, [join(app,'scripts/verify.mjs'),'--slug','example'], caller)
    assert.equal(result.code,0); assert.match(result.output,/PASS verify example/)
    assert.match(result.output,/STEP 0 PASS/); assert.match(result.output,/STEP 1 PASS/)
    cleaned(result.output)
  })
})

test('INT-002 screenshots settle and emit only advisory overlap active-chrome attribution warnings', { timeout: 120000 }, async () => {
  await temporary(async dir => {
    await copyApp(dir, bootstrap)
    await writeFile(join(dir,'src/presentations/example/Talk.tsx'), `import { useEffect } from 'react'
import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import './fixture.css'
function Scene({payload}: SceneProps<number>) {
 useEffect(() => {
  const started = performance.now()
  document.documentElement.dataset.transitionStarted = String(started)
  const timer = setTimeout(() => { document.documentElement.dataset.settledStep = String(payload) }, 700)
  return () => clearTimeout(timer)
 }, [payload])
 return <div className={'variant-'+payload}>
  <span className="collision-a">unmarked first</span><span className="collision-b">unmarked second</span>
  <div data-presentation-allow-overlap><span className="allowed-a">allowed first</span><span className="allowed-b">allowed second</span></div>
 </div>
}
const steps: Step<number>[] = [0,1,2].map(n=>({id:String(n),era:'era '+n,title:'Title '+n,caption:'Caption '+n,Scene,payload:n,groupKey:'test'}))
export default function Talk(){return <Presentation title="Diagnostics" steps={steps}/>}
`)
    await writeFile(join(dir,'src/presentations/example/fixture.css'), `
.collision-a,.collision-b {position:absolute;top:40px;left:40px;font-size:20px}
.allowed-a,.allowed-b {position:absolute;top:140px;left:40px;font-size:20px}
[data-presentation-attribution] {font-size:8px}
[data-presentation]:has(.variant-1) [data-presentation-attribution] {font-size:16px}
[data-presentation]:has(.variant-2) [data-presentation-attribution] {display:none}
`)
    const build = await command('npm',['run','build'],dir)
    assert.equal(build.code,0)
    // Add a browser capture assertion without changing the helper's production behavior.
    const { chromium } = await import('playwright')
    const original = chromium.launch.bind(chromium)
    const times = []
    chromium.launch = async (...args) => {
      const browser = await original(...args), newPage = browser.newPage.bind(browser)
      browser.newPage = async (...args) => {
        const page = await newPage(...args), capture = page.screenshot.bind(page)
        page.screenshot = async (...args) => {
          const measured = await page.evaluate(() => ({ index: document.querySelector('[data-step-index]').getAttribute('data-step-index'), settled: document.documentElement.dataset.settledStep, elapsed: performance.now()-Number(document.documentElement.dataset.transitionStarted) }))
          assert.equal(measured.index, measured.settled)
          assert.ok(measured.elapsed >= 850, `capture after configured delay: ${JSON.stringify(measured)}`)
          times.push(measured)
          return capture(...args)
        }
        return page
      }
      return browser
    }
    let result
    try { result = await inspectPresentation({ cwd:dir,slug:'example',skipBuild:true }) }
    finally { chromium.launch = original }
    assert.equal(result.length,3); assert.equal(times.length,3)
    for (const item of result) {
      assert.ok((await stat(item.path)).size > 0)
      assert.ok(item.path.endsWith(`artifacts/inspection/example/step-${String(item.index+1).padStart(2,'0')}.png`))
      assert.ok(item.warnings.some(w => w.includes(`step ${item.index}: overlap`) && w.includes('unmarked first') && w.includes('unmarked second')))
      assert.ok(!item.warnings.some(w => w.includes('allowed first') || w.includes('allowed second')))
      for (const hook of ['progress-step','toc-entry']) assert.ok(item.warnings.some(w=>w.includes(`indistinct active chrome data-presentation-${hook}`)))
      assert.ok(item.warnings.some(w=>w.includes('attribution')&&w.includes('[data-presentation-attribution]')))
    }
    assert.deepEqual((await readdir(join(dir,'artifacts/inspection/example'))).sort(),['step-01.png','step-02.png','step-03.png'])
    console.log('INT-002 advisory-only capture PASS; settled timings', times)
  })
})

test('E2E-001 reference presentation passes whole-app production verification on IPv4', { timeout: 120000 }, async () => {
  const result = await command('npm',['run','verify'],root)
  assert.equal(result.code,0); assert.match(result.output,/PASS verify how-to-make-a-presentation/)
  for (let i=0;i<9;i++) assert.match(result.output,new RegExp(`STEP ${i} PASS`))
  assert.match(result.output,/PREVIEW http:\/\/127\.0\.0\.1:\d+ PID \d+; readiness http:\/\/127\.0\.0\.1:/)
  assert.doesNotMatch(result.output,/localhost/)
  cleaned(result.output)
})

test('E2E-002 faulty copies fail by phase and step and clean up preview processes', { timeout: 240000 }, async t => {
  const faults = [
    ['build', async dir => { await writeFile(join(dir,'src/broken.ts'),'const broken: string = 123; export { broken }') }, /FAIL build/],
    ['missing sample', async dir => { await writeFile(join(dir,'src/presentations/index.ts'),`import type {ComponentType} from 'react'\nexport const presentations: {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}[]=[]\nexport function resolvePresentation(pathname:string){return presentations.find(p=>'/'+p.slug===pathname)}`) }, /FAIL sample\/registry.*Missing registered/],
    ['wrong order', async dir => { const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/index.ts'); await writeFile(p,(await readFile(p,'utf8')).replace('outline.map(', '[...outline].reverse().map(')) }, /FAIL render step 0.*Reference outline differs/],
    ['malformed count', async dir => { const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/index.ts'); await writeFile(p,(await readFile(p,'utf8')).replace('outline.map(', 'outline.slice(0, 8).map(')) }, /Malformed step count 8/],
    ['console error', async dir => { const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/StoryScene.tsx'); await writeFile(p,(await readFile(p,'utf8')).replace('  return <SceneLayer>', "  if (payload.length > 2) console.error('injected console failure')\n  return <SceneLayer>")) }, /FAIL render step 1.*injected console failure/],
    ['page error', async dir => { const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/StoryScene.tsx'); await writeFile(p,"import { useEffect } from 'react'\n"+(await readFile(p,'utf8')).replace('  return <SceneLayer>', "  useEffect(() => { if (payload.length > 2) setTimeout(() => { throw new Error('injected page failure') }, 20) }, [payload])\n  return <SceneLayer>")) }, /FAIL render step 1.*injected page failure/],
    ['render error', async dir => { const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/StoryScene.tsx'); await writeFile(p,(await readFile(p,'utf8')).replace('  return <SceneLayer>', "  throw new Error('injected render failure')\n  return <SceneLayer>")) }, /FAIL render step 0.*injected render failure/],
    ['transition stall', async dir => { const p=join(dir,'src/presentation-kit/usePresentationNav.ts'); await writeFile(p,(await readFile(p,'utf8')).replace('clamp(i + 1, count)', 'clamp(i, count)')) }, /FAIL render step 1.*step 1/],
  ]
  for (const [name,inject,expected] of faults) await t.test(name,async()=>temporary(async dir=>{
    await copyApp(dir); await inject(dir)
    const result=await command('npm',['run','verify'],dir)
    assert.notEqual(result.code,0)
    assert.match(result.output,expected)
    assert.doesNotMatch(result.output,/PASS verify/)
    cleaned(result.output)
  }))
})
