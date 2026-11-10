import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdir, readFile, writeFile, readdir, rm, symlink, access, mkdtemp } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { inspect } from '../scripts/inspect-presentation.mjs'
const root = resolve(import.meta.dirname, '..'), work = join(root, '.test-work')
await mkdir(work, { recursive: true })
after(async () => { await rm(work, { recursive: true, force: true }) })
function command(cwd, args, timeout = 180000) {
 return new Promise((resolve, reject) => {
  const child = spawn(args[0], args.slice(1), { cwd, env: process.env })
  let output = ''
  child.stdout.on('data', c => { output += c }); child.stderr.on('data', c => { output += c })
  const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`Timeout ${args.join(' ')}\n${output}`)) }, timeout)
  child.on('error', reject)
  child.on('exit', code => { clearTimeout(timer); resolve({ code, output }) })
 })
}
async function copyApp(name) {
 const dir = join(work, name); await mkdir(dir, { recursive: true })
 for (const path of ['src','scripts','index.html','package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts']) await cp(join(root,path),join(dir,path),{recursive:true})
 await symlink(join(root,'node_modules'),join(dir,'node_modules'),'dir')
 return dir
}
async function files(dir) { const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(async e=>e.isDirectory()?(await files(join(dir,e.name))).map(f=>`${e.name}/${f}`):[e.name]))).flat() }
function assertCleanup(output, browserExpected = true) {
 const starts=[...output.matchAll(/preview host\/probe: .*; pid=(\d+)/g)].map(x=>x[1])
 for(const pid of starts) { assert.match(output,new RegExp(`preview cleaned: pid=${pid}`)); assert.throws(()=>process.kill(Number(pid),0)) }
 const browsers=[...output.matchAll(/browser started: pid=(\d+)/g)].map(x=>x[1])
 if(browserExpected) assert.ok(browsers.length>0,'expected an actual Chromium process')
 for(const pid of browsers) {
  assert.match(output,new RegExp(`browser cleaned: pid=${pid}; contexts=0; connected=false`))
  assert.throws(()=>process.kill(Number(pid),0),{code:'ESRCH'},`Chromium process ${pid} must have exited`)
 }
 console.log(`ASSERT cleanup: ${browsers.length} Chromium process(es) exited, contexts closed, connections closed; ${starts.length} preview process(es) exited`)
}
test('INT-001 materialized bootstrap is complete, style-neutral and aligned outside caller cwd', {timeout:180000}, async t=>{
 const dir=await mkdtemp(join(tmpdir(),'and-scene-bootstrap-'));t.after(()=>rm(dir,{recursive:true,force:true}));assert.ok(!dir.startsWith(root));await cp(join(root,'skills/presentation/templates/bootstrap'),dir,{recursive:true})
 const install=await command(dir,['npm','ci','--ignore-scripts']);assert.equal(install.code,0,install.output)
 const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'))
 for(const dep of ['react','react-dom','motion','lucide-react','vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright']) assert.ok(pkg.dependencies?.[dep]||pkg.devDependencies?.[dep],dep)
 assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
 for(const file of await files(join(root,'src/presentation-kit'))) assert.equal(await readFile(join(dir,'src/presentation-kit',file),'utf8'),await readFile(join(root,'src/presentation-kit',file),'utf8'),file)
 for(const file of ['verify.mjs','inspect-presentation.mjs','browser.mjs','diagnostics.mjs','reference-outline.json']) assert.equal(await readFile(join(dir,'scripts',file),'utf8'),await readFile(join(root,'scripts',file),'utf8'),file)
 assert.equal((await readFile(join(dir,'src/index.css'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,'').trim(),'')
 for(const file of await files(join(dir,'src/presentation-kit'))) {
  const source=await readFile(join(dir,'src/presentation-kit',file),'utf8')
  assert.doesNotMatch(source,/#[0-9a-f]{3,8}\b|fontFamily:|backgroundColor:|boxShadow:|borderRadius:|tailwind/)
 }
 const verified=await command(dir,['npm','run','verify']);assert.equal(verified.code,0,verified.output);console.log(verified.output)
 await access(join(dir,'src/presentations/index.ts'));await access(join(dir,'src/presentation-kit/Presentation.tsx'))
 assertCleanup(verified.output)
})
test('E2E-001 reference presentation passes production verification', {timeout:180000}, async()=>{
 const dir=await copyApp('success'),result=await command(dir,['npm','run','verify'])
 assert.equal(result.code,0,result.output);assert.match(result.output,/PASS verification/)
 for(let i=0;i<9;i++) assert.match(result.output,new RegExp(`PASS render step ${i}/8`))
 assert.match(result.output,/preview host\/probe: http:\/\/127\.0\.0\.1:/);assert.match(result.output,/browser URL: http:\/\/127\.0\.0\.1:/)
 assertCleanup(result.output);console.log(result.output)
})
test('E2E-002 verification faults are actionable and clean up previews', {timeout:300000}, async t=>{
 const faults=[
  ['build',async d=>writeFile(join(d,'src/broken.ts'),'const broken: number = "wrong"\n'),/FAIL build:/],
  ['missing',async d=>{await rm(join(d,'src/presentations/how-to-make-a-presentation'),{recursive:true});await writeFile(join(d,'src/presentations/index.ts'),`import type { ComponentType } from 'react'
export const presentations: {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}[] = []
export function resolvePresentation(path:string) { return presentations.find(p=>p.slug===path.slice(1)) }
`)},/FAIL sample:/],
  ['order',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/outline.json');const x=JSON.parse(await readFile(p,'utf8'));x.reverse();await writeFile(p,JSON.stringify(x))},/FAIL sample.*step 0/],
  ['malformed',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/outline.json');const x=JSON.parse(await readFile(p,'utf8'));x.pop();await writeFile(p,JSON.stringify(x))},/FAIL sample.*count/],
  ['console',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/steps/index.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('return <SceneLayer>','if (beat === 3) console.error("injected console fault")\n  return <SceneLayer>'))},/FAIL render step 2: console:/],
  ['pageerror',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/steps/index.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('return <SceneLayer>','if (beat === 3) setTimeout(() => { throw new Error("injected page fault") }, 100)\n  return <SceneLayer>'))},/FAIL render step 2: pageerror:/],
  ['render',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/steps/index.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('return <SceneLayer>','if (beat === 1) throw new Error("injected render fault")\n  return <SceneLayer>'))},/FAIL render step 0:/],
  ['transition',async d=>{const p=join(d,'src/presentation-kit/usePresentationNav.ts');await writeFile(p,(await readFile(p,'utf8')).replace('clamp(n + 1, count)','clamp(n, count)'))},/FAIL transition step 1:/],
 ]
 for(const [name,inject,pattern] of faults.filter(([name])=>!process.env.FAULT_CASE || name===process.env.FAULT_CASE)) await t.test(name,async()=>{
  const dir=await copyApp(`fault-${name}`);await inject(dir)
  const result=await command(dir,['npm','run','verify'])
  assert.notEqual(result.code,0,result.output);assert.match(result.output,pattern);assert.doesNotMatch(result.output,/PASS verification/);assertCleanup(result.output,['console','pageerror','render','transition'].includes(name))
  console.log(`${name}: ${result.output}`)
 })
})
test('INT-002 helper captures settled artifacts and step-specific advisory diagnostics', {timeout:180000},async()=>{
 const dir=await copyApp('inspection')
 const fixture=`import { Presentation } from '../../presentation-kit'
 import type { SceneProps, Step } from '../../presentation-kit'
 function Scene({payload}:SceneProps<number>){return <div><div style={{position:'absolute',left:40,top:40}}>collision A {payload}</div><div style={{position:'absolute',left:40,top:40}}>collision B</div><section data-presentation-allow-overlap><div style={{position:'absolute',left:400,top:40}}>allowed A</div><div style={{position:'absolute',left:400,top:40}}>allowed B</div></section><nav data-presentation-navigation style={{position:'absolute',left:40,top:40}}><button aria-label="Icon next"><svg width="24" height="24"><path d="M0 0 L20 20" /></svg></button></nav><section data-presentation-allow-overlap style={{position:'absolute',left:40,top:40}}><nav data-presentation-navigation><button aria-label="Exempt icon"><svg width="24" height="24" /></button></nav></section><span style={{animation:'settle .2s linear'}}>settling</span></div>}
 const steps:Step<number>[]=[0,1].map(i=>({id:'s'+i,era:'era'+i,title:'Title '+i,caption:'Caption '+i,Scene,payload:i,groupKey:'same'}))
 export default function Talk(){return <><style>{'@keyframes settle { from { opacity:0 } to { opacity:1 } } [data-presentation-attribution]{font-size:9px} [data-presentation-footer]{padding:20px} [data-presentation-toc]{position:absolute;top:20px;right:20px}'}</style><Presentation steps={steps} title="Fixture" /></>}`
 await writeFile(join(dir,'src/presentations/how-to-make-a-presentation/Talk.tsx'),fixture)
 const {directory,records}=await inspect({cwd:dir,slug:'how-to-make-a-presentation',settle:800})
 assert.equal(records.length,2)
 for(const r of records){
  const png=await readFile(join(directory,r.file));assert.equal(png.subarray(1,4).toString(),'PNG')
  assert.ok(r.capturedAt-r.transitionObservedAt>=r.settle)
  assert.ok(r.warnings.some(w=>w.includes('overlap: collision A')&&w.includes('collision B')),JSON.stringify(r.warnings))
  assert.ok(!r.warnings.some(w=>w.includes('allowed')||w.includes('Exempt icon')),JSON.stringify(r.warnings))
  assert.ok(r.warnings.some(w=>w.includes('collision A')&&w.includes('Icon next')),JSON.stringify(r.warnings))
  for(const kind of ['[data-presentation-progress]','[data-presentation-toc]']) assert.ok(r.warnings.some(w=>w.includes('indistinct active')&&w.includes(kind)),JSON.stringify(r.warnings))
  assert.ok(r.warnings.some(w=>w.includes('unpolished attribution')))
 }
 assert.match(directory,/\.presentation-artifacts\/how-to-make-a-presentation\/1440x900$/)
 const report=JSON.parse(await readFile(join(directory,'report.json'),'utf8'));assert.deepEqual(report,records)
})
