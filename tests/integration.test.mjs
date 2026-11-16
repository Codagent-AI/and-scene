import test from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, writeFile, rm, symlink, readdir, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { materialize } from '../skills/presentation/materialize.mjs'

const root = resolve(import.meta.dirname,'..')
const evidence = process.env.EVIDENCE_DIR ?? resolve(root,'.test-artifacts')
const { mkdir } = await import('node:fs/promises'); await mkdir(evidence,{recursive:true})
async function run(cwd, args, name, success = true) {
  const start=Date.now()
  const result=await new Promise((resolve,reject)=>{
    const child=spawn(args[0],args.slice(1),{cwd,env:process.env,stdio:['ignore','pipe','pipe']})
    let output='';child.stdout.on('data',c=>{output+=c});child.stderr.on('data',c=>{output+=c})
    child.on('error',reject);child.on('close',code=>resolve({code,output}))
  })
  await writeFile(join(evidence,`${name}.log`),`Command: ${args.join(' ')}\nCWD: ${cwd}\nExit: ${result.code}\nDuration: ${Date.now()-start}ms\n${result.output}`)
  assert.equal(result.code===0,success,`${name}: ${result.output}`)
  return result.output
}
async function files(dir) {
  const names=[]
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    if(entry.name==='node_modules'||entry.name==='dist')continue
    const path=join(dir,entry.name)
    if(entry.isDirectory()) for(const child of await files(path)) names.push(join(entry.name,child))
    else names.push(entry.name)
  }
  return names.sort()
}
async function parity() {
  const canonical=join(root,'src/presentation-kit'), template=join(root,'skills/presentation/templates/bootstrap/src/presentation-kit')
  assert.deepEqual(await files(canonical),await files(template))
  for(const file of await files(canonical)) assert.equal(await readFile(join(canonical,file),'utf8'),await readFile(join(template,file),'utf8'),file)
  for(const file of ['verify.mjs','inspect-presentation.mjs','browser.mjs','diagnostics.mjs']) assert.equal(await readFile(join(root,'scripts',file),'utf8'),await readFile(join(root,'skills/presentation/templates/bootstrap/scripts',file),'utf8'),file)
}
async function copyApp() {
  const dir=await mkdtemp(join(tmpdir(),'and-scene-test-'))
  for(const file of ['src','scripts','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','package.json','package-lock.json'])await cp(join(root,file),join(dir,file),{recursive:true})
  await symlink(join(root,'node_modules'),join(dir,'node_modules'),'dir')
  return dir
}
async function cleaned(output) {
  const ports=[...output.matchAll(/CLEANUP preview (\d+)/g)].map(m=>m[1])
  assert.ok(ports.length,'Cleanup message required')
  for(const port of ports) await assert.rejects(fetch(`http://127.0.0.1:${port}`))
}
test('INT-001 materialized bootstrap is independent complete aligned and style neutral', {timeout:180000},async()=>{
  const dir=await mkdtemp(join(tmpdir(),'and-scene-bootstrap-'))
  try {
    await parity()
    // Invoke the actual distributable entry point from a working directory outside the repository.
    await run(tmpdir(),[process.execPath,join(root,'skills/presentation/materialize.mjs'),dir],'INT-001-materialize')
    const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'))
    for(const dep of ['react','react-dom','motion','lucide-react','vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright'])assert.ok(pkg.dependencies?.[dep]||pkg.devDependencies?.[dep],dep)
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    assert.ok(await stat(join(dir,'src/presentation-kit/Presentation.tsx')))
    assert.ok((await readFile(join(dir,'src/presentations/index.ts'),'utf8')).includes("slug: 'example'"))
    const css=await readFile(join(dir,'src/index.css'),'utf8');assert.ok(!css.includes('{'))
    for(const file of await files(join(dir,'src/presentation-kit'))) {
      const text=await readFile(join(dir,'src/presentation-kit',file),'utf8')
      assert.ok(!/#[0-9a-f]{3,8}\b|fontFamily:|background:|boxShadow:|border:|tailwind|--theme/i.test(text),file)
    }
    await run(dir,['npm','ci','--no-audit','--no-fund'],'INT-001-install')
    const output=await run(dir,['npm','run','verify'],'INT-001-verify')
    assert.match(output,/PASS/);assert.match(output,/STEP 1 OK/);await cleaned(output)
    await assert.rejects(materialize(dir),/empty target/)
    await writeFile(join(evidence,'INT-001-contracts.log'),'PASS INT-001: canonical/template byte parity, script parity, complete dependency set, contract anchors, no kit styling defaults, skill-relative materialization, nonempty target rejection, local production build/render and cleanup.\n')
  } finally {await rm(dir,{recursive:true,force:true})}
})
test('E2E-001 reference presentation passes production verification', {timeout:180000},async()=>{
  const dir=await copyApp()
  try {
    const output=await run(dir,['npm','run','verify'],'E2E-001')
    for(let i=0;i<9;i++)assert.match(output,new RegExp(`STEP ${i} OK`))
    assert.match(output,/127\.0\.0\.1/);assert.match(output,/PASS build \+ sample \+ render/);await cleaned(output)
  } finally {await rm(dir,{recursive:true,force:true})}
})
test('INT-002 screenshots settle and diagnostics are advisory with subtree exemptions', {timeout:180000},async()=>{
  const dir=await copyApp()
  try {
    const fixture=join(dir,'src/presentations/diagnostic-fixture');await mkdir(fixture,{recursive:true})
    await writeFile(join(fixture,'Talk.tsx'),`import { Presentation, type SceneProps, type Step } from '../../presentation-kit'
function Scene({payload}:SceneProps<number>){return <><span style={{position:'absolute',left:50,top:50}}>Collision A</span><span style={{position:'absolute',left:50,top:50}}>Collision B</span><div data-presentation-allow-overlap="true"><span style={{position:'absolute',left:250,top:50}}>Allowed A</span><span style={{position:'absolute',left:250,top:50}}>Allowed B</span></div><span style={{position:'absolute',left:500,top:100}}>Beat {payload}</span></>}
const steps:Step<number>[]=[0,1].map(i=>({id:String(i),era:'section '+i,title:'Test '+i,caption:'Capture fixture.',Scene,payload:i,groupKey:'fixture'}))
export default function Talk(){return <Presentation title="Fixture" steps={steps}/>}`)
    await writeFile(join(dir,'src/presentations/index.ts'),(await readFile(join(dir,'src/presentations/index.ts'),'utf8')).replace('= [{','= [{ slug: \'diagnostic-fixture\', title: \'Diagnostic fixture\', load: () => import(\'./diagnostic-fixture/Talk\') },{'))
    const output=await run(dir,['npm','run','inspect','--','diagnostic-fixture'],'INT-002')
    assert.match(output,/CAPTURED 2 steps/);assert.match(output,/ADVISORY step 0: overlap.*Collision A.*Collision B/)
    assert.match(output,/ADVISORY step 1: indistinct active progress-entry/);assert.match(output,/indistinct active toc-entry/)
    assert.match(output,/unpolished attribution/);assert.ok(!output.includes('overlap span:Allowed'))
    const report=JSON.parse(await readFile(join(dir,'.inspection/diagnostic-fixture/report.json'),'utf8'))
    assert.deepEqual(report.map(s=>s.file),['step-01.png','step-02.png'])
    assert.ok(report[1].capturedAt-report[0].capturedAt>=850)
    for(const row of report) {assert.equal(row.settle,850);assert.ok((await stat(join(dir,'.inspection/diagnostic-fixture',row.file))).size>1000);assert.ok(row.warnings.some(w=>w.includes('overlap')))}
    await cleaned(output)
    await cp(join(dir,'.inspection/diagnostic-fixture/report.json'),join(evidence,'INT-002-report.json'))
    await writeFile(join(evidence,'INT-002-assertions.log'),'PASS INT-002: predictable PNGs per step, settle>=850ms before screenshots, step-specific overlap/active/attribution warnings, allowed subtree exempt, advisory exit zero, cleanup.\n')
  } finally {await rm(dir,{recursive:true,force:true})}
})
const faults=[
  ['build',async dir=>writeFile(join(dir,'src/broken.ts'),'const broken: number = "wrong"; export { broken }\n'),/FAIL build/],
  ['missing',async dir=>{await rm(join(dir,'src/presentations/how-to-make-a-presentation'),{recursive:true});await writeFile(join(dir,'src/presentations/index.ts'),'import type { ComponentType } from "react"\nexport const presentations: {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}[] = []\n')},/FAIL sample/],
  ['unregistered',async dir=>writeFile(join(dir,'src/presentations/index.ts'),'import type { ComponentType } from "react"\nexport const presentations: {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}[] = []\n'),/FAIL sample: Missing reference sample registration/],
  ['malformed',async dir=>{const p=join(dir,'src/presentations/how-to-make-a-presentation/outline.ts');await writeFile(p,(await readFile(p,'utf8')).replace('You have a topic','Wrong title'))},/FAIL render: step 0: .*title differs/],
  ['out-of-order',async dir=>{const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/index.ts');await writeFile(p,(await readFile(p,'utf8')).replace('outline.map','[outline[1],outline[0],...outline.slice(2)].map'))},/FAIL render: step 0: .*title differs/],
  ['console',async dir=>inject(dir,"if (payload.beat === 2) console.error('injected console failure')"),/FAIL render: step 1: injected console failure/],
  ['pageerror',async dir=>inject(dir,"if (payload.beat === 2) setTimeout(() => { throw new Error('injected page failure') }, 10)"),/FAIL render: step 1: injected page failure/],
  ['render',async dir=>inject(dir,"if (payload.beat === 2) throw new Error('injected render failure')"),/FAIL render: step 1:/],
  ['transition',async dir=>{const p=join(dir,'src/presentation-kit/usePresentationNav.ts');await writeFile(p,(await readFile(p,'utf8')).replace('setPosition(n => clamp(n + 1, count))','setPosition(n => n)'))},/FAIL render: step 1:/],
]
async function inject(dir,code){const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('return <SceneLayer>',`${code}\n  return <SceneLayer>`))}
for(const [name,injectFault,expected] of faults) test(`E2E-002 ${name} fault exits nonzero with actionable failure and cleanup`,{timeout:120000},async()=>{
  const dir=await copyApp()
  try {
    await injectFault(dir)
    const output=await run(dir,['npm','run','verify'],`E2E-002-${name}`,false)
    assert.match(output,expected);assert.ok(!output.includes('PASS build'))
    if(!['build','missing','unregistered'].includes(name))await cleaned(output)
  } finally {await rm(dir,{recursive:true,force:true})}
})
