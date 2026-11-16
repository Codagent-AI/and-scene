import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, writeFile, mkdir, symlink, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { inspectPresentation } from '../scripts/inspect-presentation.mjs'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const artifacts=join(root,'.artifacts','test-logs')
await mkdir(artifacts,{recursive:true})
async function run(cmd,args,cwd,label) {
  const output=await new Promise((resolve,reject)=>{
    const child=spawn(cmd,args,{cwd,env:{...process.env,NO_COLOR:'1'},stdio:['ignore','pipe','pipe']})
    let output=''
    child.stdout.on('data',s=>{output+=s}); child.stderr.on('data',s=>{output+=s})
    child.once('error',reject)
    const timer=setTimeout(()=>child.kill('SIGTERM'),120000)
    child.once('exit',code=>{clearTimeout(timer);resolve({code,output})})
  })
  await writeFile(join(artifacts,`${label}.log`),output.output)
  return output
}
async function cloneProject() {
  const dir=await mkdtemp(join(tmpdir(),'and-scene-'))
  for(const path of ['src','scripts','index.html','package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','tests/contracts.tsx']) {
    await mkdir(dirname(join(dir,path)),{recursive:true}); await cp(join(root,path),join(dir,path),{recursive:true})
  }
  await symlink(join(root,'node_modules'),join(dir,'node_modules'),'dir')
  return dir
}
async function files(dir,prefix='') {
  const result=[]
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    const path=join(prefix,entry.name)
    if(entry.isDirectory()) result.push(...await files(join(dir,entry.name),path)); else result.push(path)
  }
  return result.sort()
}
async function assertStopped(output) {
  const matches=[...output.matchAll(/preview: (http:\/\/127\.0\.0\.1:\d+) pid=(\d+)/g)]
  for(const [,url,pid] of matches) {
    assert.ok(output.includes(`preview: stopped pid=${pid}`),'cleanup must be reported')
    await assert.rejects(fetch(url),'preview port must be closed')
  }
}
test('INT-001 materialized bootstrap is complete style-neutral and independent of caller cwd', {timeout:180000},async()=>{
  const dir=await mkdtemp(join(tmpdir(),'and-scene-bootstrap-'))
  try {
    // Absolute resolution from the installed skill directory, not process cwd.
    const skillDir=join(root,'skills/presentation')
    await cp(join(skillDir,'templates/bootstrap'),dir,{recursive:true})
    const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'))
    for(const dep of ['react','react-dom','motion','lucide-react']) assert.ok(pkg.dependencies[dep],dep)
    for(const dep of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','playwright']) assert.ok(pkg.devDependencies[dep],dep)
    assert.ok(!Object.keys({...pkg.dependencies,...pkg.devDependencies}).some(d=>/tailwind/.test(d)))
    for(const file of await files(join(root,'src/presentation-kit'))) assert.equal(await readFile(join(dir,'src/presentation-kit',file),'utf8'),await readFile(join(root,'src/presentation-kit',file),'utf8'),file)
    for(const file of ['verify.mjs','inspect-presentation.mjs',...await files(join(root,'scripts/lib')).then(xs=>xs.map(x=>'lib/'+x))]) assert.equal(await readFile(join(dir,'scripts',file),'utf8'),await readFile(join(root,'scripts',file),'utf8'),file)
    const install=await run('npm',['ci','--no-audit','--no-fund'],dir,'INT-001-install'); assert.equal(install.code,0,install.output)
    const verification=await run('npm',['run','verify'],dir,'INT-001-verify'); assert.equal(verification.code,0,verification.output)
    assert.match(verification.output,/PASS: build, example, all steps rendered/)
    await assertStopped(verification.output)
    const kitFiles=await files(join(dir,'src/presentation-kit'))
    for(const file of kitFiles) assert.doesNotMatch(await readFile(join(dir,'src/presentation-kit',file),'utf8'),/#[0-9a-f]{3,8}\b|fontFamily:|boxShadow:|backgroundColor:|tailwind/i)
    assert.equal((await readFile(join(dir,'src/index.css'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,'').trim(),'')
    console.log('INT-001: install, anchors, build, route, byte parity, dependency completeness and neutral scaffold passed')
  } finally {await rm(dir,{recursive:true,force:true})}
})
test('E2E-001 reference production verification observes all nine steps on IPv4', {timeout:120000}, async()=>{
  const result=await run('npm',['run','verify'],root,'E2E-001')
  assert.equal(result.code,0,result.output)
  for(let i=0;i<9;i++) assert.match(result.output,new RegExp(`render: step ${i} / 8 passed`))
  assert.match(result.output,/PASS: build, how-to-make-a-presentation, all steps rendered/)
  assert.match(result.output,/preview: http:\/\/127\.0\.0\.1:/)
  const source=await readFile(join(root,'scripts/lib/browser.mjs'),'utf8')
  assert.match(source,/listen\(0, HOST/); assert.match(source,/fetch\(baseURL\)/); assert.match(source,/'--host', HOST/)
  await assertStopped(result.output)
})
test('E2E-002 verification failure phases steps exit codes and subprocess cleanup', {timeout:300000},async t=>{
  const faults = {
    build: async dir=>writeFile(join(dir,'src/broken.ts'),'export const broken: number = "bad"'),
    missing: async dir=>{await rm(join(dir,'src/presentations/how-to-make-a-presentation/Talk.tsx'));await writeFile(join(dir,'src/presentations/index.ts'),`import type {ComponentType} from 'react'\nexport const presentations: {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}[]=[]`)},
    order: async dir=>edit(dir,'src/presentations/how-to-make-a-presentation/steps/index.ts',s=>s.replace('OUTLINE.map','[...OUTLINE].reverse().map')),
    console: async dir=>edit(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx',s=>s.replace('return <SceneLayer>',`if (beat === 3) console.error('injected console fault')\n  return <SceneLayer>`)),
    page: async dir=>edit(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx',s=>s.replace('return <SceneLayer>',`if (beat === 3) setTimeout(() => { throw new Error('injected page fault') }, 0)\n  return <SceneLayer>`)),
    render: async dir=>edit(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx',s=>s.replace('return <SceneLayer>',`if (beat === 3) throw new Error('injected render fault')\n  return <SceneLayer>`)),
    transition: async dir=>edit(dir,'src/presentation-kit/usePresentationNav.ts',s=>s.replace('clamp(n + 1, count)','clamp(n, count)')),
  }
  for(const [fault,inject] of Object.entries(faults)) await t.test(fault,async()=>{
    const dir=await cloneProject()
    try {
      await inject(dir)
      const result=await run('npm',['run','verify'],dir,`E2E-002-${fault}`)
      assert.notEqual(result.code,0,result.output); assert.doesNotMatch(result.output,/PASS: build,/)
      if(fault==='build') assert.match(result.output,/FAIL \[build\]/)
      else if(fault==='missing') assert.match(result.output,/FAIL \[sample\].*missing or unregistered/)
      else if(fault==='order') assert.match(result.output,/sample:.*step 0/)
      else assert.match(result.output,new RegExp(`FAIL \\[render\\].*step ${fault==='transition'?1:2}`))
      await assertStopped(result.output)
    } finally { await rm(dir,{recursive:true,force:true}) }
  })
})
async function edit(dir,path,fn) {const file=join(dir,path);await writeFile(file,fn(await readFile(file,'utf8')))}
test('INT-002 screenshot helper captures settled steps and emits advisory diagnostics with overlap exemptions', {timeout:120000},async()=>{
  const dir=await cloneProject()
  try {
    await mkdir(join(dir,'src/presentations/probe'),{recursive:true})
    await writeFile(join(dir,'src/presentations/probe/Talk.tsx'),`import {useEffect,useState} from 'react'
import {Presentation} from '../../presentation-kit/Presentation'
import type {SceneProps,Step} from '../../presentation-kit/types'
function Scene({payload}:SceneProps<number>) {
 const [settled,setSettled]=useState(0)
 useEffect(()=>{const timer=setTimeout(()=>setSettled(payload),650);return()=>clearTimeout(timer)},[payload])
 return <div><span data-entity="collision-a" style={{position:'absolute',left:20,top:20}}>collision-a</span><span data-entity="collision-b" style={{position:'absolute',left:20,top:20}}>collision-b</span><div data-presentation-allow-overlap="" style={{position:'absolute',left:200,top:80}}><span data-entity="allowed-a" style={{position:'absolute'}}>allowed-a</span><span data-entity="allowed-b" style={{position:'absolute'}}>allowed-b</span></div><span style={{position:'absolute',left:20,top:200}}>{settled===payload?'SETTLED':'MOVING'}-{payload}</span></div>
}
const steps:Step<number>[]=[1,2].map(i=>({id:String(i),era:i===1?'first':'second',title:'Probe '+i,caption:'Caption '+i,Scene,groupKey:'probe',payload:i}))
export default function Talk(){return <><style>{'[data-presentation-attribution] {font-size:8px;color:rgb(0,0,238)} [data-presentation-footer] {position:absolute;bottom:80px} [data-presentation-toc]{position:absolute;top:130px}'}</style><Presentation steps={steps} title="Probe" /></>}
`)
    await edit(dir,'src/presentations/index.ts',s=>s.replace('export const presentations: PresentationEntry[] = [',`export const presentations: PresentationEntry[] = [\n{slug:'probe',title:'Probe',load:()=>import('./probe/Talk')},`))
    const build=await run('npm',['run','build'],dir,'INT-002-build'); assert.equal(build.code,0,build.output)
    const result=await inspectPresentation({root:dir,slug:'probe',build:false})
    assert.equal(result.captures.length,2)
    for(const [index,capture] of result.captures.entries()) {
      assert.equal(capture.index,index); assert.equal(capture.settledMs,800);assert.deepEqual(capture.viewport,{width:1440,height:900})
      assert.match(capture.path,new RegExp(`step-0${index+1}\\.png$`)); assert.match(capture.sceneText,new RegExp(`SETTLED-${index+1}`));assert.doesNotMatch(capture.sceneText,/MOVING/)
      assert.ok((await readFile(capture.path)).length>1000)
      assert.ok(result.warnings.some(w=>w.includes(`step ${index}: overlap`) && w.includes('collision-a') && w.includes('collision-b')))
      assert.ok(result.warnings.some(w=>w.includes(`step ${index}: indistinct active progress`)))
      assert.ok(result.warnings.some(w=>w.includes(`step ${index}: indistinct active toc`)))
      assert.ok(result.warnings.some(w=>w.includes(`step ${index}: unpolished attribution`)))
    }
    // Intentional subtree is visible, but none of its members appear in collision warnings.
    const report=JSON.parse(await readFile(join(result.output,'report.json'),'utf8'))
    assert.equal(report.captures.length,2); assert.ok(result.warnings.length>0)
    assert.ok(!result.warnings.some(w=>w.includes('overlap') && /allowed-[ab]/.test(w)), 'allow-overlap descendants must be exempt')
    await cp(result.output,join(artifacts,'INT-002'),{recursive:true})
    console.log('INT-002: per-step screenshots, settled text, warnings and advisory success passed')
  } finally {await rm(dir,{recursive:true,force:true})}
})
