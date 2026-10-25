import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, rm, readFile, writeFile, mkdir, symlink, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'

const root = process.cwd()
const evidence = process.env.EVIDENCE_DIR
async function command(cwd, name, args, timeout = 180000) {
  return new Promise((yes, no) => {
    const child = spawn(name,args,{cwd,env:process.env,stdio:['ignore','pipe','pipe']})
    let output = ''
    child.stdout.on('data',data => { output += data }); child.stderr.on('data',data => { output += data })
    const timer = setTimeout(() => { child.kill('SIGTERM'); no(new Error(`Timeout ${name} ${args.join(' ')}\n${output}`)) },timeout)
    child.on('error',error => { clearTimeout(timer); no(error) })
    child.on('exit',code => { clearTimeout(timer); yes({code,output}) })
  })
}
async function save(name, result) {
  if (evidence) await writeFile(join(evidence, name), typeof result === 'string' ? result : JSON.stringify(result,null,2))
}
async function isolated(run, bootstrap = false) {
  const dir = await mkdtemp(join(tmpdir(),'and-scene-integration-'))
  try {
    if (bootstrap) await cp(join(root,'skills/presentation/templates/bootstrap'),dir,{recursive:true})
    else {
      for (const file of ['src','public','scripts','package.json','package-lock.json','index.html','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts']) await cp(join(root,file),join(dir,file),{recursive:true})
      await symlink(join(root,'node_modules'),join(dir,'node_modules'),'dir')
    }
    await run(dir)
  } finally { await rm(dir,{recursive:true,force:true}) }
}
async function compareTrees(a,b) {
  const entries = await readdir(a,{withFileTypes:true})
  assert.deepEqual((await readdir(a)).sort(),(await readdir(b)).sort())
  for (const entry of entries) {
    if (entry.isDirectory()) await compareTrees(join(a,entry.name),join(b,entry.name))
    else assert.equal(await readFile(join(a,entry.name),'utf8'),await readFile(join(b,entry.name),'utf8'),entry.name)
  }
}
function assertCleanup(output) {
  const started = [...output.matchAll(/preview: host=127\.0\.0\.1 readiness=http:\/\/127\.0\.0\.1:\d+ pid=(\d+)/g)].map(m=>Number(m[1]))
  for (const pid of started) {
    assert.match(output,new RegExp(`preview: cleaned pid=${pid}`))
    assert.throws(()=>process.kill(pid,0),`preview ${pid} must have exited`)
  }
}

test('INT-001 materialized bootstrap is complete and style-neutral', {timeout:240000}, async () => isolated(async dir => {
  const install = await command(dir,'npm',['ci']); await save('INT-001-install.log',install); assert.equal(install.code,0,install.output)
  const verify = await command(dir,'npm',['run','verify']); await save('INT-001-verify.log',verify); assert.equal(verify.code,0,verify.output)
  assert.match(verify.output,/starter/); assert.match(verify.output,/PASS:/); assertCleanup(verify.output)
  const pkg = JSON.parse(await readFile(join(dir,'package.json'),'utf8'))
  for (const dependency of ['react','react-dom','motion','lucide-react','vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','globals','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','playwright']) assert.ok(pkg.dependencies?.[dependency] || pkg.devDependencies?.[dependency],dependency)
  assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
  await compareTrees(join(root,'src/presentation-kit'),join(dir,'src/presentation-kit'))
  await compareTrees(join(root,'scripts'),join(dir,'scripts'))
  assert.match(await readFile(join(dir,'src/presentations/index.ts'),'utf8'),/slug:/)
  const { detectAnchors } = await import('../skills/presentation/scaffold.mjs')
  assert.deepEqual(await detectAnchors(dir),{build:true,kit:true,index:true})
  const scaffoldFromElsewhere = await command(tmpdir(),process.execPath,['--input-type=module','-e',`import {templateRoot} from ${JSON.stringify(new URL('../skills/presentation/scaffold.mjs',import.meta.url).href)}; console.log(templateRoot)`])
  assert.equal(scaffoldFromElsewhere.code,0,scaffoldFromElsewhere.output); assert.match(scaffoldFromElsewhere.output,/skills\/presentation\/templates\/bootstrap/)
  const css = await readFile(join(dir,'src/index.css'),'utf8'); assert.ok(!css.includes('{'),'no scaffold theme')
  await save('INT-001-contracts.log','INT-001: anchors and complete dependencies present; kit and scripts byte-aligned; caller-independent template root; no Tailwind dependency or host theme. Build and route smoke logs: INT-001-verify.log.\n')
},true))

test('INT-002 screenshot helper produces settled artifacts and advisory diagnostics', {timeout:180000}, async () => isolated(async dir => {
  const fixture = `import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Scene({payload}:SceneProps<number>) { return <>
<div style={{position:'absolute',left:100,top:100}}>Unmarked first</div><div style={{position:'absolute',left:100,top:100}}>Unmarked second</div>
<div data-presentation-allow-overlap="" style={{position:'absolute',left:300,top:200}}><span>Allowed first</span><span style={{position:'absolute',left:0,top:0}}>Allowed second</span></div>
<div style={{display:'none'}}>Hidden collision</div><span>{payload}</span>
</> }
const steps:Step<number>[] = [0,1,2].map(i=>({id:String(i),era:i===2?'second':'first',title:'Fixture '+i,caption:'Fixture caption '+i,Scene,payload:i,groupKey:'fixture'}))
export default function Talk(){return <Presentation steps={steps} title="Diagnostics fixture" attribution={<a data-presentation-attribution="" href="https://example.com" style={{fontSize:8}}>made by and-scene</a>}/>}
`
  await mkdir(join(dir,'src/presentations/diagnostics')); await writeFile(join(dir,'src/presentations/diagnostics/Talk.tsx'),fixture)
  const registry = join(dir,'src/presentations/index.ts')
  await writeFile(registry,(await readFile(registry,'utf8')).replace('export const presentations: RegistryEntry[] = [',"export const presentations: RegistryEntry[] = [\n {slug:'diagnostics',title:'Diagnostics',load:()=>import('./diagnostics/Talk')},"))
  const result = await command(dir,'npm',['run','inspect','--','diagnostics','--settle=900']); await save('INT-002-inspect.log',result)
  assert.equal(result.code,0,result.output); assertCleanup(result.output)
  const artifactDir=join(dir,'artifacts/inspection/diagnostics')
  const report=JSON.parse(await readFile(join(artifactDir,'report.json'),'utf8'))
  assert.equal(report.length,3)
  for (const [index,capture] of report.entries()) {
    assert.equal(capture.index,index); assert.equal(capture.file,`${String(index+1).padStart(2,'0')}.png`)
    assert.ok(capture.capturedAt-capture.transitionAt>=900)
    const png=await readFile(join(artifactDir,capture.file)); assert.equal(png.readUInt32BE(16),1440);assert.equal(png.readUInt32BE(20),900)
    assert.ok(capture.warnings.some(w=>w.includes('Unmarked first') && w.includes('Unmarked second')))
    assert.ok(!capture.warnings.some(w=>w.includes('Allowed first') || w.includes('Allowed second') || w.includes('Hidden collision')))
    assert.ok(capture.warnings.some(w=>w.includes('indistinct progress')))
    assert.ok(capture.warnings.some(w=>w.includes('indistinct toc')))
    assert.ok(capture.warnings.some(w=>w.includes('undersized') && w.includes('[data-presentation-attribution]')))
    assert.match(result.output,new RegExp(`WARN step ${index}:`))
  }
  assert.match(result.output,/warnings are advisory/)
  await save('INT-002-report.json',report)
}))

test('E2E-001 reference presentation passes production verification', {timeout:180000}, async () => {
  const result = await command(root,'npm',['run','verify']); await save('E2E-001-verify.log',result)
  assert.equal(result.code,0,result.output); assert.match(result.output,/PASS:/); assert.match(result.output,/host=127\.0\.0\.1 readiness=http:\/\/127\.0\.0\.1:/)
  assert.match(result.output,/browser: url=http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
  for (let i=0;i<9;i++) assert.match(result.output,new RegExp(`render: step ${i} / 9 clean`))
  assertCleanup(result.output)
})

for (const fault of ['build','missing','order','console','page','render','transition']) {
  test(`E2E-002 ${fault} failure identifies phase and step and cleans subprocesses`, {timeout:180000}, async () => isolated(async dir => {
    if (fault==='build') await writeFile(join(dir,'src/broken.ts'),'const broken: number = "bad"; export {broken}')
    if (fault==='missing') {
      const registry=join(dir,'src/presentations/index.ts'); await writeFile(registry,(await readFile(registry,'utf8')).replace("  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },",''))
    }
    if (fault==='order') {
      const file=join(dir,'src/presentations/how-to-make-a-presentation/outline.json'), outline=JSON.parse(await readFile(file,'utf8'))
      ;[outline[1],outline[2]]=[outline[2],outline[1]]; await writeFile(file,JSON.stringify(outline))
    }
    if (['console','page','render'].includes(fault)) {
      const file=join(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      const injection = fault==='console' ? "if(beat===4) console.error('injected console fault')" : fault==='page' ? "if(beat===4) setTimeout(()=>{throw new Error('injected page fault')},0)" : "if(beat===4) throw new Error('injected render fault')"
      await writeFile(file,(await readFile(file,'utf8')).replace('  return <SceneLayer>',`  ${injection}\n  return <SceneLayer>`))
    }
    if (fault==='transition') {
      const file=join(dir,'src/presentation-kit/usePresentationNav.ts')
      await writeFile(file,(await readFile(file,'utf8')).replace('Math.min(count - 1, i + 1)','Math.min(count - 1, i)'))
    }
    const result=await command(dir,'npm',['run','verify']); await save(`E2E-002-${fault}.log`,result)
    assert.notEqual(result.code,0,result.output); assert.match(result.output,/FAIL:/); assert.ok(!result.output.includes('PASS:'))
    if(fault==='build') assert.match(result.output,/build: whole-application build failed/)
    if(['missing','order'].includes(fault)) assert.match(result.output,/sample:/)
    if(['console','page','render'].includes(fault)) assert.match(result.output,/browser: step 3/)
    if(fault==='transition') assert.match(result.output,/transition: step 1/)
    assertCleanup(result.output)
  }))
}
