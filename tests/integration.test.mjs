import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, mkdir, readFile, writeFile, rm, readdir, symlink } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { materialize, bootstrapDirectory } from '../skills/presentation/scaffold.mjs'
import { inspect } from '../scripts/inspect-presentation.mjs'
const root = process.cwd()
const evidence = process.env.EVIDENCE_DIR
async function save(name, text) { if (evidence) await writeFile(join(evidence, name), text) }
async function temporary() { await mkdir('.test-work', { recursive: true }); return mkdtemp(resolve('.test-work/run-')) }
async function copyProject() {
  const dir = await temporary()
  for (const name of await readdir(root)) {
    if (!['node_modules','.git','dist','.test-work','.presentation-artifacts'].includes(name)) await cp(join(root,name),join(dir,name),{recursive:true})
  }
  await symlink(join(root,'node_modules'),join(dir,'node_modules'),'dir')
  return dir
}
function command(cwd, args, executable = process.execPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, env: process.env })
    let output = ''
    child.stdout.on('data',s=>output+=s); child.stderr.on('data',s=>output+=s)
    const timeout = setTimeout(()=>child.kill('SIGTERM'),180000)
    child.on('error',reject); child.on('exit',code=>{clearTimeout(timeout);resolve({code,output})})
  })
}
async function compareTrees(a,b) {
  const names = await readdir(a,{withFileTypes:true})
  assert.deepEqual(names.map(e=>e.name).sort(),(await readdir(b)).sort())
  for(const e of names) if(e.isDirectory()) await compareTrees(join(a,e.name),join(b,e.name)); else assert.equal(await readFile(join(a,e.name),'utf8'),await readFile(join(b,e.name),'utf8'),e.name)
}
test('INT-001 materialized bootstrap installs builds and verifies outside source with byte parity and neutral contracts', {timeout:180000}, async () => {
  const dir = await temporary()
  try {
    await materialize(dir)
    await assert.rejects(()=>materialize(dir),/Refusing to overwrite/)
    const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'))
    for(const dep of ['react','react-dom','motion','lucide-react']) assert.ok(pkg.dependencies[dep],dep)
    for(const dep of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright']) assert.ok(pkg.devDependencies[dep],dep)
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    for(const path of ['src/presentation-kit/Presentation.tsx','src/presentations/index.ts','package-lock.json']) assert.ok((await readFile(join(dir,path))).length)
    await compareTrees(join(root,'src/presentation-kit'),join(bootstrapDirectory,'src/presentation-kit'))
    for(const file of ['browser.mjs','verify.mjs','reference.mjs','diagnostics.mjs','inspect-presentation.mjs']) assert.equal(await readFile(join(root,'scripts',file),'utf8'),await readFile(join(dir,'scripts',file),'utf8'))
    const install=await command(dir,['ci','--no-audit','--no-fund'],'npm'); await save('INT-001-install.log',install.output); assert.equal(install.code,0,install.output)
    const verify=await command(dir,['run','verify'],'npm'); await save('INT-001-verify.log',verify.output); assert.equal(verify.code,0,verify.output); assert.match(verify.output,/PASS step 0\/0/)
    const kit=(await readFile(join(dir,'src/presentation-kit/nodes/primitives.tsx'),'utf8'))
    assert.ok(!/#[0-9a-f]{3,8}|fontFamily|boxShadow|border:/.test(kit))
  } finally { await rm(dir,{recursive:true,force:true}) }
})
test('INT-002 helper captures settled step screenshots and reports only unexempted overlap plus active and attribution defects', {timeout:180000}, async () => {
  const dir=await copyProject()
  try {
    const fixture=join(dir,'src/presentations/inspection-fixture'); await mkdir(fixture,{recursive:true})
    await writeFile(join(fixture,'Talk.tsx'),`import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<number>) { return <div data-presentation-allow-overlap={payload===1 ? '' : undefined}><span style={{position:'absolute',left:50,top:50}}>Collision A</span><span style={{position:'absolute',left:50,top:50}}>Collision B</span></div> }
const steps: Step<number>[] = [0,1,2].map(payload=>({id:String(payload),era:String(payload),title:'Inspection '+payload,caption:'Fixture caption '+payload,Scene,payload,groupKey:'fixture'}))
export default function Talk() { return <div><style>{'[data-presentation-header]{position:absolute;top:10px;left:20px}[data-presentation-footer]{position:absolute;bottom:50px;left:100px}[data-presentation-toc]{position:absolute;right:20px;top:15px}[data-presentation-mode-toggle]{position:absolute;right:20px;top:55px}[data-presentation-attribution]{font-size:8px}'}</style><Presentation title="Fixture" steps={steps}/></div> }
`)
    await writeFile(join(dir,'src/presentations/index.ts'),"export const presentations = [{slug:'inspection-fixture',title:'Fixture',load:()=>import('./inspection-fixture/Talk')}]\n")
    const captures=[]
    const result=await inspect({slug:'inspection-fixture',cwd:dir,settle:900,onCapture: data=>captures.push(data)})
    assert.equal(captures.length,3)
    for(const capture of captures) {
      assert.ok(capture.elapsed>=900); assert.deepEqual(capture.viewport,{width:1440,height:900})
      const png=await readFile(capture.file); assert.equal(png.subarray(1,4).toString(),'PNG'); assert.equal(png.readUInt32BE(16),1440); assert.equal(png.readUInt32BE(20),900)
    }
    assert.deepEqual((await readdir(result.directory)).sort(),['01.png','02.png','03.png'])
    assert.ok(result.warnings.some(w=>w.includes('step 0: overlap') && w.includes('Collision')))
    assert.ok(!result.warnings.some(w=>w.includes('step 1: overlap') && w.includes('Collision')))
    assert.ok(result.warnings.some(w=>w.includes('indistinct active [data-presentation-progress]')))
    assert.ok(result.warnings.some(w=>w.includes('indistinct active [data-presentation-toc]')))
    assert.ok(result.warnings.some(w=>w.includes('style [data-presentation-attribution]')))
    await save('INT-002-artifacts.log',JSON.stringify({captures,warnings:result.warnings},null,2))
  } finally { await rm(dir,{recursive:true,force:true}) }
})
test('E2E-001 reference production verification reports every index and clear pass on IPv4', {timeout:180000}, async () => {
  const result=await command(root,['run','verify'],'npm'); await save('E2E-001.log',result.output)
  assert.equal(result.code,0,result.output)
  for(let n=0;n<9;n++) assert.match(result.output,new RegExp(`PASS step ${n}/8`))
  assert.match(result.output,/preview http:\/\/127\.0\.0\.1:/); assert.match(result.output,/PASS verification/); assert.match(result.output,/preview cleaned/)
})
for(const fault of ['build','missing','order','console','page','transition']) test(`E2E-002 ${fault} fault exits nonzero with actionable phase step and cleaned preview`, {timeout:180000}, async () => {
  const dir=await copyProject()
  try {
    const talk=join(dir,'src/presentations/how-to-make-a-presentation/Talk.tsx')
    if(fault==='build') await writeFile(talk,'const broken: number = "wrong"; export default broken\n')
    if(fault==='missing') await writeFile(join(dir,'src/presentations/index.ts'),"export const presentations = [] as {slug:string;title:string;load:()=>Promise<{default:()=>React.ReactNode}>}[]\n")
    if(fault==='order') {
      const path=join(dir,'src/presentations/how-to-make-a-presentation/steps/index.ts')
      await writeFile(path,(await readFile(path,'utf8')).replace('outline.map','[...outline].reverse().map'))
    }
    if(fault==='console'||fault==='page') {
      const path=join(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      await writeFile(path,(await readFile(path,'utf8')).replace('return <SceneLayer>',`${fault==='console' ? "if (payload === 2) console.error('injected console fault')" : "if (payload === 2) throw new Error('injected page fault')"}\n  return <SceneLayer>`))
    }
    if(fault==='transition') {
      const path=join(dir,'src/presentation-kit/usePresentationNav.ts')
      await writeFile(path,(await readFile(path,'utf8')).replace('i + 1','i + 0'))
    }
    const result=await command(dir,['run','verify'],'npm'); await save(`E2E-002-${fault}.log`,result.output)
    assert.notEqual(result.code,0,result.output); assert.match(result.output,/FAIL/); assert.ok(!result.output.includes('PASS verification'))
    if(fault==='build') assert.match(result.output,/FAIL build/)
    else if(fault==='missing'||fault==='order') assert.match(result.output,/FAIL sample/)
    else assert.match(result.output,new RegExp(`step ${fault==='transition'?1:2}`))
    if(!['build','missing'].includes(fault)) {
      const match=result.output.match(/preview http:\/\/127\.0\.0\.1:(\d+) pid=(\d+)/); assert.ok(match,result.output)
      assert.match(result.output,/preview cleaned/)
      assert.throws(()=>process.kill(Number(match[2]),0))
      await assert.rejects(()=>fetch(`http://127.0.0.1:${match[1]}`))
    }
  } finally { await rm(dir,{recursive:true,force:true}) }
})
