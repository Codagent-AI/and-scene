/* global Image, document */
import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { inspect } from '../scripts/inspect-presentation.mjs'
import { chromium } from 'playwright'

const execute = promisify(execFile)
const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const temporary = []
async function temp() { const dir = await mkdtemp(join(tmpdir(), 'and-scene-')); temporary.push(dir); return dir }
async function run(cwd, args = ['run', 'verify']) {
  try { const result = await execute('npm', args, { cwd, timeout: 180_000, maxBuffer: 4_000_000 }); return { ...result, code: 0 } }
  catch (error) { return { stdout: error.stdout ?? '', stderr: error.stderr ?? '', code: error.code } }
}
async function copyApp() {
  const dir = await temp()
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'artifacts', 'tests', 'skills', 'openspec'].includes(entry.name) || entry.name.startsWith('.test')) continue
    await cp(join(root, entry.name), join(dir, entry.name), { recursive: true })
  }
  await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  return dir
}
async function assertPreviewStopped(output) {
  const addresses = [...output.matchAll(/Preview stopped (http:\/\/127\.0\.0\.1:\d+)/g)].map((match) => match[1])
  for (const address of addresses) await assert.rejects(fetch(address))
}
before(async () => { await mkdir(join(root, 'artifacts'), { recursive: true }) })
after(async () => { await Promise.all(temporary.map((dir) => rm(dir, { recursive: true, force: true }))) })

test('INT-001 materialized bootstrap installs locked dependencies, builds and verifies independently with canonical parity', { timeout: 240_000 }, async () => {
  const target = await temp()
  const outside = await temp()
  const scaffoldURL = new URL('../skills/presentation/scaffold.mjs', import.meta.url).href
  await execute(process.execPath, ['--input-type=module', '-e', `const {scaffold}=await import(${JSON.stringify(scaffoldURL)}); await scaffold({cwd:${JSON.stringify(target)},install:false,confirmed:true});`], { cwd: outside, timeout: 30_000 })
  const installed = await run(target, ['ci', '--no-audit', '--no-fund'])
  assert.equal(installed.code, 0, installed.stdout + installed.stderr)
  const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) assert.ok(dependencies[name], name)
  assert.ok(!Object.keys(dependencies).some((name) => /tailwind/i.test(name)))
  for (const path of ['src/presentation-kit/types.ts', 'src/presentations/index.ts', 'package-lock.json']) await readFile(join(target, path))
  const result = await run(target, ['run', 'verify', '--', '--slug=starter'])
  assert.equal(result.code, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /PASS verification starter/)
  async function compare(path) {
    for (const entry of await readdir(join(root, path), { withFileTypes: true })) {
      const file = join(path, entry.name)
      if (entry.isDirectory()) await compare(file)
      else if (!/\.(test|spec)\./.test(file)) {
        const source = await readFile(join(target, file), 'utf8')
        assert.equal(source, await readFile(join(root, file), 'utf8'), file)
        assert.doesNotMatch(source, /\b(?:color|backgroundColor|fontFamily|fontSize|border|borderRadius|boxShadow|gap)\s*:/, `kit visual default: ${file}`)
        assert.doesNotMatch(source, /(?:import|require).*\.(?:css|scss)/, `kit style dependency: ${file}`)
      }
    }
  }
  await compare('src/presentation-kit')
  for (const name of await readdir(join(root, 'scripts'))) if (name.endsWith('.mjs')) assert.equal(await readFile(join(target, 'scripts', name), 'utf8'), await readFile(join(root, 'scripts', name), 'utf8'))
  await assertPreviewStopped(result.stdout)
})

test('E2E-001 production reference verifies all nine normative steps with IPv4 and clear success', { timeout: 180_000 }, async () => {
  const app = await copyApp()
  const result = await run(app)
  assert.equal(result.code, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /PASS verification how-to-make-a-presentation/)
  for (let index = 0; index < 9; index += 1) assert.match(result.stdout, new RegExp(`Rendered step ${index}/8`))
  assert.match(result.stdout, /Preview host=127\.0\.0\.1; readiness=http:\/\/127\.0\.0\.1:\d+; browser=http:\/\/127\.0\.0\.1:\d+/)
  await assertPreviewStopped(result.stdout)
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }]) {
    const captures = await inspect({ root: app, slug: 'how-to-make-a-presentation', build: false, ...viewport })
    for (const capture of captures) assert.deepEqual(capture.warnings, [], `step ${capture.index} at ${viewport.width}px: ${capture.warnings.join('; ')}`)
    for (const index of [0, 6, 8]) {
      const { canvas, entities } = captures[index].composition
      assert.ok(canvas.x >= -1 && canvas.y >= -1 && canvas.x + canvas.width <= viewport.width + 1 && canvas.y + canvas.height <= viewport.height + 1, `canvas fits viewport at step ${index}`)
      for (const entity of entities) assert.ok(entity.x >= canvas.x - 2 && entity.y >= canvas.y - 2 && entity.x + entity.width <= canvas.x + canvas.width + 2 && entity.y + entity.height <= canvas.y + canvas.height + 2, `${entity.name} fits canvas at step ${index}`)
    }
  }
})

for (const fault of ['build', 'missing sample', 'out-of-order sample', 'console', 'pageerror', 'transition', 'initial scene render', 'middle scene render']) {
  test(`E2E-002 ${fault} fails with actionable phase/step and cleans preview`, { timeout: 180_000 }, async () => {
    const app = await copyApp()
    if (fault === 'build') await writeFile(join(app, 'src/broken.ts'), 'const invalid: number = "type error"; export { invalid };\n')
    else if (fault === 'missing sample') {
      const path = join(app, 'src/presentations/index.ts')
      await writeFile(path, (await readFile(path, 'utf8')).replaceAll('how-to-make-a-presentation', 'missing-sample'))
      // Preserve the import so the absent registration fails the sample phase rather than compilation.
      await cp(join(app, 'src/presentations/how-to-make-a-presentation'), join(app, 'src/presentations/missing-sample'), { recursive: true })
    } else if (fault === 'out-of-order sample') {
      async function alter(directory) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
          const path = join(directory, entry.name)
          if (entry.isDirectory()) await alter(path)
          else if (/\.[tj]sx?$/.test(path)) await writeFile(path, (await readFile(path, 'utf8')).replaceAll('You have a topic', 'The skill interviews you'))
        }
      }
      await alter(join(app, 'src/presentations/how-to-make-a-presentation'))
    } else if (fault.endsWith('scene render')) {
      const path = join(app, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      const beat = fault.startsWith('initial') ? 1 : 4
      const source = await readFile(path, 'utf8')
      const signature = 'export function Scene({ payload: { beat } }: SceneProps<Beat>) {'
      assert.ok(source.includes(signature))
      await writeFile(path, source.replace(signature, `${signature}\n  if (beat === ${beat}) throw new Error('injected scene render fault at beat ${beat}');`))
    } else {
      const path = join(app, 'src/main.tsx')
      const snippets = { console: '\nconsole.error("injected console fault");\n', pageerror: '\nsetTimeout(() => { throw new Error("injected page fault") }, 100);\n', transition: '\nwindow.addEventListener("keydown", (event) => event.stopImmediatePropagation(), true);\n' }
      await writeFile(path, (await readFile(path, 'utf8')) + snippets[fault])
    }
    const result = await run(app)
    const output = result.stdout + result.stderr
    assert.notEqual(result.code, 0, output)
    assert.doesNotMatch(output, /PASS verification/)
    if (fault === 'build') assert.match(output, /FAIL build/)
    else if (fault.includes('sample')) assert.match(output, /FAIL sample/)
    else if (fault.endsWith('scene render')) {
      const index = fault.startsWith('initial') ? 0 : 3
      assert.match(output, new RegExp(`FAIL render step ${index}`))
      assert.match(output, /injected scene render fault/)
      assert.match(output, /presentation step hooks missing after render failure/)
      if (index > 0) assert.match(output, /Rendered step 2\/8/)
    }
    else if (fault === 'transition') assert.match(output, /FAIL transition step 1/)
    else assert.match(output, /FAIL render step 0/)
    await assertPreviewStopped(output)
    if (['console', 'pageerror', 'transition'].includes(fault) || fault.endsWith('scene render')) assert.match(output, /Preview stopped/)
  })
}

test('INT-002 settled screenshot artifacts and advisory overlap/chrome/attribution diagnostics', { timeout: 180_000 }, async () => {
  const app = await copyApp()
  await assert.rejects(inspect({ root: app, slug: 'not-registered', build: false }), /not registered/)
  await assert.rejects(inspect({ root: app, slug: '../invalid', build: false }), /registered presentation slug/)
  await assert.rejects(inspect({ root: app, slug: 'how-to-make-a-presentation', build: false, settleMs: -1 }), /settle interval/)
  await assert.rejects(inspect({ root: app, slug: 'how-to-make-a-presentation', build: false, width: 0 }), /viewport dimensions/)
  await mkdir(join(app, 'src/presentations/diagnostic'), { recursive: true })
  await writeFile(join(app, 'src/presentations/diagnostic/Talk.tsx'), `import {useState,useRef,useLayoutEffect} from 'react';
export default function Diagnostic(){const [index,setIndex]=useState(0);const moving=useRef<HTMLDivElement>(null);
useLayoutEffect(()=>{const animation=moving.current!.animate([{transform:'translateX(0px)'},{transform:'translateX('+(200+index*50)+'px)'}],{duration:700,fill:'forwards'});return()=>animation.cancel()},[index]);return <main style={{minHeight:"100vh"}} data-step-count="2" data-step-index={index} onKeyDown={e=>{if(e.key==='ArrowRight')setIndex(1)}} tabIndex={0} ref={el=>{el?.focus()}}>
<div style={{position:'absolute',top:40,left:40}} id="collision-a">unmarked alpha {index}</div><div style={{position:'absolute',top:40,left:40}} id="collision-b">unmarked beta</div>
<div data-presentation-allow-overlap style={{position:'absolute',top:100,left:40}}><span style={{position:'absolute'}} id="allowed-a">intentional alpha</span><span style={{position:'absolute'}} id="allowed-b">intentional beta</span></div>
<div data-presentation-allow-overlap style={{position:'absolute',top:130,left:600}}><span style={{position:'absolute',width:100,height:30}} id="marked-outside">marked outside</span></div>
<button data-presentation-next id="outside-control" style={{position:'absolute',top:130,left:600,width:100,height:30}}>outside</button>
<div data-presentation-allow-overlap style={{position:'absolute',top:170,left:600}}><span style={{position:'absolute',width:100,height:30}} id="other-marked-a">first group</span></div>
<div data-presentation-allow-overlap style={{position:'absolute',top:170,left:600}}><span style={{position:'absolute',width:100,height:30}} id="other-marked-b">second group</span></div>
<button data-presentation-prev id="padded-a" style={{position:'absolute',top:350,left:600,width:100,height:30,textAlign:'left'}}>A</button>
<button data-presentation-next id="padded-b" style={{position:'absolute',top:350,left:680,width:100,height:30,textAlign:'right'}}>B</button>
<button data-presentation-next id="nested-control" style={{position:'absolute',top:400,left:600,width:120,height:30}}><span id="own-label">own label</span></button>
<div data-presentation-canvas style={{position:'absolute',top:500,left:40,width:600,height:100}}><div ref={moving} data-entity="settling" style={{position:'absolute',left:20,top:20,width:24,height:24,background:'rgb(0,255,0)'}} /></div>
<div style={{opacity:0}}><span id="hidden-a" style={{position:'absolute',top:40,left:40}}>hidden first</span><span id="hidden-b" style={{position:'absolute',top:40,left:40}}>hidden second</span></div>
<div style={{position:'absolute',top:400,left:40}} id="icon-collision">icon collision</div><button data-presentation-next aria-label="icon-next" style={{position:'absolute',top:400,left:40,width:20,height:20}} />
<nav style={{position:'absolute',top:200}}><button data-presentation-progress data-active="true">active</button><button data-presentation-progress data-active="false">inactive</button></nav>
<a data-presentation-attribution href="https://github.com/Codagent-AI/and-scene" style={{position:'absolute',top:300,fontSize:8}}>made by and-scene</a></main>}`)
  const registryPath = join(app, 'src/presentations/index.ts')
  const registry = await readFile(registryPath, 'utf8')
  // Append a registered fixture to the same explicit registry, preserving reference routing.
  const arrayEnd = registry.lastIndexOf(']')
  assert.ok(arrayEnd >= 0)
  await writeFile(registryPath, registry.slice(0, arrayEnd).replace(/,\s*$/, '') + ",{slug:'diagnostic',title:'Diagnostics',load:()=>import('./diagnostic/Talk')}" + registry.slice(arrayEnd))
  const built = await run(app, ['run', 'build'])
  assert.equal(built.code, 0, built.stdout + built.stderr)
  const results = await inspect({ root: app, slug: 'diagnostic', build: false, settleMs: 150 })
  assert.equal(results.length, 2)
  for (const [index, result] of results.entries()) {
    assert.equal(result.index, index)
    assert.ok(result.waitedMs >= 150, 'configured interval passes before screenshot starts')
    const moving = result.composition.entities.find(entity => entity.name === 'settling')
    assert.ok(Math.abs(moving.x - (260 + index * 50)) < 1, 'capture snapshot observes the final animated position')
    assert.equal(result.filename, `step-0${index + 1}.png`)
    const png = await readFile(join(app, 'artifacts/inspection/diagnostic/1440x960', result.filename))
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
    const warnings = result.warnings.join('\n')
    assert.match(warnings, /overlap: collision-a \/ collision-b/)
    assert.doesNotMatch(warnings, /allowed-a|allowed-b|hidden-a|hidden-b/)
    assert.match(warnings, /overlap: icon-collision \/ icon-next/)
    assert.match(warnings, /overlap: marked-outside \/ outside-control/)
    assert.match(warnings, /overlap: other-marked-a \/ other-marked-b/)
    assert.match(warnings, /overlap: padded-a \/ padded-b/)
    assert.doesNotMatch(warnings, /nested-control|own-label/)
    assert.doesNotMatch(warnings, /overlap: (padded-a \/ padded-a|padded-b \/ padded-b)/)
    assert.match(warnings, /indistinct active chrome/)
    assert.match(warnings, /unpolished attribution.*data-presentation-attribution/)
  }
  const decoder = await chromium.launch({ headless: true })
  try {
    const page = await decoder.newPage()
    for (const [index, result] of results.entries()) {
      const png = await readFile(join(app, 'artifacts/inspection/diagnostic/1440x960', result.filename))
      const pixels = await page.evaluate(async ({ base64, x }) => {
        const image = new Image()
        image.src = 'data:image/png;base64,' + base64
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = image.width; canvas.height = image.height
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0)
        return [...context.getImageData(x, 530, 1, 1).data]
      }, { base64: png.toString('base64'), x: 270 + index * 50 })
      assert.deepEqual(pixels, [0, 255, 0, 255], 'PNG contains the box at its settled destination')
    }
  } finally { await decoder.close() }
  assert.notDeepEqual(await readFile(join(app, 'artifacts/inspection/diagnostic/1440x960/step-01.png')), await readFile(join(app, 'artifacts/inspection/diagnostic/1440x960/step-02.png')))
})
