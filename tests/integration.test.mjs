import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { resolve, relative, sep, isAbsolute } from 'node:path'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { projectRoot } from '../scripts/browser.mjs'
import { observeBrowserProcesses } from './process-resources.mjs'

const work = resolve(projectRoot, '.test-work')
await mkdir(work, { recursive: true })
const directories = []
async function temp(prefix, external = false) {
  const path = await mkdtemp(resolve(external ? tmpdir() : work, prefix))
  directories.push(path)
  if (external) {
    const location = relative(await realpath(projectRoot), await realpath(path))
    assert.ok(location.startsWith('..' + sep) || isAbsolute(location), 'Bootstrap must be outside the source repository')
    console.log(`ISOLATED bootstrap location: ${path}`)
  }
  return path
}
after(async () => { for (const path of directories) await rm(path, { force: true, recursive: true }) })
async function run(cwd, bin, args, { expected = 0, timeout = 180000, checkResources = false } = {}) {
  return new Promise((accept, reject) => {
    const proc = spawn(bin, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
    const verifyResources = checkResources ? observeBrowserProcesses(proc.pid) : null
    let output = ''
    const collect = data => { output += data; process.stdout.write(data) }
    proc.stdout.on('data', collect); proc.stderr.on('data', collect)
    const timer = setTimeout(() => { try { process.kill(-proc.pid, 'SIGTERM') } catch { /* exited */ } reject(new Error(`Timed out: ${args.join(' ')}`)) }, timeout)
    proc.on('error', error => { clearTimeout(timer); reject(error) })
    proc.on('close', async code => {
      clearTimeout(timer)
      try {
        if (verifyResources) await verifyResources(output)
        if (expected === 0) assert.equal(code, 0, output); else assert.notEqual(code, 0, output)
        accept(output)
      } catch (error) { reject(error) }
    })
  })
}
async function files(dir) { return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(async e => e.isDirectory() ? files(resolve(dir, e.name)) : [resolve(dir, e.name)]))).flat() }
async function parity(source, target) {
  const names = await files(source)
  assert.equal((await files(target)).length, names.length)
  for (const path of names) assert.deepEqual(await readFile(path), await readFile(resolve(target, path.slice(source.length + 1))), `Drift: ${path}`)
}
async function copyApp(prefix) {
  const target = await temp(prefix)
  for (const name of ['src','scripts','index.html','package.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts']) await cp(resolve(projectRoot,name),resolve(target,name), { recursive: true })
  await symlink(resolve(projectRoot, 'node_modules'), resolve(target, 'node_modules'), 'dir')
  return target
}
const sample = 'src/presentations/how-to-make-a-presentation'

test('INT-001 materialized bootstrap builds and verifies outside the source repository', { timeout: 240000 }, async () => {
  const bundle = await temp('and-scene-skill-', true)
  await cp(resolve(projectRoot, 'skills/presentation'), bundle, { recursive: true })
  const target = await temp('and-scene-bootstrap-', true)
  const snapshot = resolve(bundle, 'templates/bootstrap')
  await cp(snapshot, target, { recursive: true })
  await parity(resolve(projectRoot,'src/presentation-kit'), resolve(target,'src/presentation-kit'))
  for (const script of ['verify.mjs','inspect-presentation.mjs','browser.mjs','diagnostics.mjs','reference.mjs']) assert.deepEqual(await readFile(resolve(projectRoot,'scripts',script)), await readFile(resolve(target,'scripts',script)))
  const pkg = JSON.parse(await readFile(resolve(target, 'package.json')))
  for (const name of ['react','react-dom','motion','lucide-react']) assert.ok(pkg.dependencies[name])
  for (const name of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright']) assert.ok(pkg.devDependencies[name])
  assert.ok(!Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(name => /tailwind/i.test(name)))
  const kitFiles = await files(resolve(target,'src/presentation-kit'))
  for (const file of kitFiles) {
    const source = await readFile(file, 'utf8')
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b|fontFamily:|boxShadow:|borderRadius:|backgroundColor:|tailwind/i, file)
  }
  assert.doesNotMatch(await readFile(resolve(target,'src/index.css'),'utf8'), /color:|font:|border:|shadow|--[a-z]/)
  await cp(resolve(projectRoot, 'skills/presentation/templates/presentation'), resolve(target,'src/presentations/demo'), { recursive: true })
  await writeFile(resolve(target,'src/presentations/index.ts'), "import type { RegistryEntry } from '../presentation-kit/types'\nexport const presentations: RegistryEntry[] = [{ slug: 'demo', title: 'Demo', load: () => import('./demo/Talk') }]\n")
  const talkFile = resolve(target, 'src/presentations/demo/Talk.tsx')
  await writeFile(talkFile, (await readFile(talkFile, 'utf8')).replace('initialMode="browse"', 'initialMode="present"'))
  await run(target, 'npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'])
  const localRequire = createRequire(resolve(target, 'package.json'))
  for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react', 'playwright', 'typescript']) {
    const file = await realpath(localRequire.resolve(dependency))
    assert.ok(file.startsWith(resolve(target, 'node_modules') + sep), `${dependency} must resolve inside the isolated installation: ${file}`)
    console.log(`ISOLATED dependency ${dependency}: ${file}`)
  }
  const log = await run(target, 'npm', ['run','verify','--','--route','demo'])
  assert.match(log, /PASS verify demo: 1 steps/)
  // Invoke the distributable copier from an unrelated cwd to prove relative template resolution.
  const copied = await temp('and-scene-copied-', true)
  await run(target, process.execPath, [resolve(bundle,'bootstrap.mjs'),'--target',copied,'--anchors','build,kit,index'])
  assert.ok((await readFile(resolve(copied,'src/presentation-kit/Presentation.tsx'))).length)
  const sentinel = resolve(copied, 'vite.config.ts')
  await writeFile(sentinel, 'existing custom build\n')
  const refusal = await run(target, process.execPath, [resolve(bundle,'bootstrap.mjs'),'--target',copied,'--anchors','build'], { expected: 1 })
  assert.match(refusal, /Refusing to overwrite/)
  assert.equal(await readFile(sentinel, 'utf8'), 'existing custom build\n')
})

test('INT-002 screenshots settle and warnings remain advisory with scoped overlap exemptions', { timeout: 120000 }, async () => {
  const target = await copyApp('inspect-')
  await mkdir(resolve(target,'src/presentations/diagnostic'), { recursive: true })
  const fixture = `import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Scene({payload}: SceneProps<number>) { return <div><span style={{position:'absolute',left:20,top:20}}>collision one</span><span style={{position:'absolute',left:20,top:20}}>collision two</span><div aria-hidden="true"><span style={{position:'absolute',left:350,top:20}}>painted one</span><span style={{position:'absolute',left:350,top:20}}>painted two</span></div><div aria-hidden="true" data-presentation-allow-overlap=""><span style={{position:'absolute',left:200,top:20}}>allowed one</span><span style={{position:'absolute',left:200,top:20}}>allowed two</span></div><span style={{position:'absolute',left:500,top:100,transition:'transform .3s',transform:'translateX('+payload*10+'px)'}}>Settled {payload}</span></div> }
const steps: Step<number>[] = [0,1].map(i=>({id:String(i),era:'era'+i,title:'Fixture '+i,caption:'Caption '+i,Scene,payload:i,groupKey:'fixture'}))
export default function Talk(){return <Presentation steps={steps} title="Diagnostics"/>}`
  await writeFile(resolve(target,'src/presentations/diagnostic/Talk.tsx'), fixture)
  await writeFile(resolve(target,'src/presentations/index.ts'), "export const presentations = [{slug:'diagnostic',title:'Diagnostic',load:()=>import('./diagnostic/Talk')}]\n")
  const output = await run(target,'npm',['run','inspect','--','diagnostic'])
  assert.match(output, /ADVISORY step 0: overlap/)
  assert.match(output, /ADVISORY step 0: overlap span:painted one \/ span:painted two/)
  assert.doesNotMatch(output, /overlap[^\n]*allowed/)
  assert.match(output, /step 1: indistinct active progress/)
  assert.match(output, /step 1: indistinct active toc/)
  assert.match(output, /unpolished attribution.*data-presentation-attribution/)
  const artifacts = resolve(target,'artifacts/inspections/diagnostic')
  const report = JSON.parse(await readFile(resolve(artifacts,'report.json')))
  assert.deepEqual(report.viewport, {width:1440,height:900})
  assert.equal(report.steps.length,2)
  for (const step of report.steps) {
    assert.ok(step.elapsedBeforeCapture >= step.settle)
    assert.ok(step.warnings.length > 0)
    const png = await readFile(resolve(artifacts,step.file))
    assert.equal(png.subarray(1,4).toString(),'PNG')
    assert.equal(png.readUInt32BE(16),1440)
  }
  assert.deepEqual((await readdir(artifacts)).sort(), ['report.json','step-01.png','step-02.png'])
})

test('E2E-001 reference presentation passes production verification', { timeout: 120000 }, async () => {
  const output = await run(projectRoot,'npm',['run','verify'], { checkResources: true })
  assert.match(output,/PASS verify how-to-make-a-presentation: 9 steps/)
  for(let index=0; index<9; index++) assert.match(output,new RegExp(`STEP ${index} OK`))
  assert.match(output,/PREVIEW http:\/\/127\.0\.0\.1:/)
  assert.match(output,/CLEANUP preview pid=/)
  assert.doesNotMatch(output,/localhost/)
})

test('E2E-002 verification faults are actionable and preview processes are cleaned', { timeout: 420000 }, async t => {
  const cases = [
    ['build', async root => { await writeFile(resolve(root,sample,'Talk.tsx'),'export default THIS IS INVALID') }, /FAIL build step 0/],
    ['missing sample', async root => { await writeFile(resolve(root,'src/presentations/index.ts'),"import type { RegistryEntry } from '../presentation-kit/types'\nexport const presentations: RegistryEntry[] = []\n") }, /FAIL sample step 0: Missing registered/],
    ['out-of-order sample', async root => { const file=resolve(root,sample,'steps/index.ts'); const text=await readFile(file,'utf8'); await writeFile(file,text.replace('You have a topic','Wrong first title')) }, /FAIL sample step 9: Reference sample/],
    ['console error', async root => { const file=resolve(root,sample,'steps/Scene.tsx'); const text=await readFile(file,'utf8'); await writeFile(file,"import { useEffect } from 'react'\n"+text.replace('return <SceneLayer>',"useEffect(() => { if (beat === 2) console.error('injected console failure') }, [beat])\n  return <SceneLayer>")) }, /FAIL render step 1: injected console failure/],
    ['page error', async root => { const file=resolve(root,sample,'steps/Scene.tsx'); const text=await readFile(file,'utf8'); await writeFile(file,"import { useEffect } from 'react'\n"+text.replace('return <SceneLayer>',"useEffect(() => { if (beat === 2) setTimeout(() => { throw new Error('injected page failure') }, 0) }, [beat])\n  return <SceneLayer>")) }, /FAIL render step 1: injected page failure/],
    ['render error', async root => { const file=resolve(root,sample,'steps/Scene.tsx'); const text=await readFile(file,'utf8'); await writeFile(file,text.replace('return <SceneLayer>',"if (beat === 2) throw new Error('injected render failure')\n  return <SceneLayer>")) }, /FAIL (render|transition) step 1/],
    ['stalled transition', async root => { const file=resolve(root,'src/presentation-kit/usePresentationNav.ts'); const text=await readFile(file,'utf8'); await writeFile(file,text.replace("['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp']", "[' ', 'PageDown', 'ArrowLeft', 'PageUp']")) }, /FAIL transition step 1/],
  ]
  for (const [name, mutate, expected] of cases) await t.test(name, async () => {
    const target=await copyApp('fault-'); await mutate(target)
    const output=await run(target,'npm',['run','verify'], {expected:1, checkResources:true})
    assert.match(output,expected); assert.doesNotMatch(output,/PASS verify/)
    const pid=output.match(/PREVIEW .* pid=(\d+)/)?.[1]
    if(pid) { assert.match(output,/CLEANUP preview pid=/); assert.throws(()=>process.kill(Number(pid),0), /ESRCH/) }
  })
})
