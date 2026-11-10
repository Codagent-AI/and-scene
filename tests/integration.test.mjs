import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, writeFile, rm, readdir, stat, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
const root = process.cwd()
async function run(cwd, args, timeout = 180000) {
 return await new Promise((resolve, reject) => {
  const child = spawn('npm', args, { cwd, env: process.env, stdio: ['ignore','pipe','pipe'] })
  let output = ''
  child.stdout.on('data', data => { output += data })
  child.stderr.on('data', data => { output += data })
  const timer = setTimeout(() => { child.kill(); reject(new Error(`timed out ${args}: ${output}`)) },timeout)
  child.on('error',reject)
  child.on('exit',code => { clearTimeout(timer); console.log(output); resolve({code,output}) })
 })
}
async function copy() {
 const dir = await mkdtemp(path.join(tmpdir(),'and-scene-e2e-'))
 for (const file of ['src','scripts','package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json']) await cp(path.join(root,file),path.join(dir,file),{recursive:true})
 await symlink(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir')
 return dir
}
async function edit(dir,file,fn) { const p = path.join(dir,file); await writeFile(p,fn(await readFile(p,'utf8'))) }
async function assertCleaned(output) {
 const addresses = [...output.matchAll(/preview ready (http:\/\/127\.0\.0\.1:\d+)/g)]
 for (const [,url] of addresses) await assert.rejects(fetch(url), `preview leaked ${url}`)
 if (addresses.length) assert.match(output,/preview cleaned up/)
}
async function compare(a,b) {
 for (const entry of await readdir(a,{withFileTypes:true})) {
  if (entry.isDirectory()) await compare(path.join(a,entry.name),path.join(b,entry.name))
  else assert.equal(await readFile(path.join(a,entry.name),'utf8'),await readFile(path.join(b,entry.name),'utf8'),entry.name)
 }
}
test('INT-001 materialized bootstrap builds and verifies outside repository with parity and no required framework', {timeout:180000}, async () => {
 const dir = await mkdtemp(path.join(tmpdir(),'and-scene-bootstrap-'))
 try {
  await cp('skills/presentation/templates/bootstrap',dir,{recursive:true})
  const installed = await run(dir,['ci','--prefer-offline']); assert.equal(installed.code,0)
  const pkg = JSON.parse(await readFile(path.join(dir,'package.json'),'utf8'))
  for (const dep of ['react','react-dom','motion','lucide-react']) assert.ok(pkg.dependencies[dep])
  for (const dep of ['vite','typescript','@vitejs/plugin-react','@types/node','@types/react','@types/react-dom','eslint','typescript-eslint','playwright']) assert.ok(pkg.devDependencies[dep])
  assert.ok(!Object.keys({...pkg.dependencies,...pkg.devDependencies}).some(d => /tailwind/i.test(d)))
  await compare('src/presentation-kit',path.join(dir,'src/presentation-kit'))
  for (const name of ['verify.mjs','browser.mjs','diagnostics.mjs','inspect-presentation.mjs','reference.json']) assert.equal(await readFile(`scripts/${name}`,'utf8'),await readFile(path.join(dir,'scripts',name),'utf8'))
  const result = await run(dir,['run','verify']); assert.equal(result.code,0)
  await assertCleaned(result.output)
 } finally { await rm(dir,{recursive:true,force:true}) }
})
test('INT-002 inspection captures settled artifacts and reports only unmarked collisions plus chrome defects as advisories', {timeout:180000}, async () => {
 const dir = await copy()
 try {
  await writeFile(path.join(dir,'src/presentations/how-to-make-a-presentation/Talk.tsx'), `
import { useEffect, useState } from 'react'
import { Presentation } from '../../presentation-kit/Presentation'
function Fixture({payload}:{payload:number}) {
 const [settled,setSettled] = useState(false)
 useEffect(()=>{setSettled(false);const timer=setTimeout(()=>setSettled(true),700);return ()=>clearTimeout(timer)},[payload])
 return <div style={{position:'relative'}}><div style={{position:'absolute',left:100,top:30}}>collision alpha</div><div style={{position:'absolute',left:100,top:30}}>collision beta</div><div data-allow-overlap="true"><div style={{position:'absolute',left:100,top:80}}>allowed alpha</div><div style={{position:'absolute',left:100,top:80}}>allowed beta</div></div><div style={{position:'absolute',top:150}}>{settled ? 'settled state' : 'transitioning'}</div></div>
}
export default function Talk(){return <><style>{'[data-presentation-attribution] a {font-size:8px} [data-presentation-header] {height:100px} [data-presentation-footer] {margin-top:20px}'}</style><Presentation title="Fixture" steps={[0,1,2].map(i=>({id:String(i),era:i<2?'one':'two',title:'Fixture '+i,caption:'Caption '+i,Scene:Fixture,payload:i,groupKey:'fixture'}))}/></>}
`)
  const start = Date.now()
  const result = await run(dir,['run','inspect','--','how-to-make-a-presentation'])
  assert.equal(result.code,0,'warnings must be advisory')
  assert.ok(Date.now()-start>=2700)
  for (let i=0;i<3;i++) {
    assert.match(result.output,new RegExp(`CAPTURE step ${i} settled 900ms`))
    assert.match(result.output,new RegExp(`WARN step ${i}: overlap.*collision alpha.*collision beta`))
    assert.match(result.output,new RegExp(`WARN step ${i}: indistinct active chrome: progress`))
    assert.match(result.output,new RegExp(`WARN step ${i}: unpolished attribution`))
    const file = path.join(dir,`artifacts/inspection/how-to-make-a-presentation/step-0${i+1}.png`)
    assert.ok((await stat(file)).size>1000)
  }
  assert.match(result.output,/indistinct active chrome: toc/)
  assert.doesNotMatch(result.output,/WARN[^\n]*allowed (alpha|beta)/)
  await assertCleaned(result.output)
 } finally { await rm(dir,{recursive:true,force:true}) }
})
test('E2E-001 reference production verification observes every canonical step on IPv4 with clear pass and cleanup', {timeout:180000}, async () => {
 const result = await run(root,['run','verify'])
 assert.equal(result.code,0)
 for (let i=0;i<9;i++) assert.match(result.output,new RegExp(`PASS step ${i}:`))
 assert.match(result.output,/preview ready http:\/\/127\.0\.0\.1:/)
 assert.match(result.output,/PASS verification/)
 await assertCleaned(result.output)
})
test('E2E-002 faulty copies fail with phase and step diagnostics and clean preview processes', {timeout:360000}, async t => {
 const faults = [
 ['build','src/main.tsx',s=>s+'\nconst broken: number = "wrong"\n',/FAIL build/],
 ['missing sample','src/presentations/index.ts',s=>s.replace("slug: 'how-to-make-a-presentation'","slug: 'missing'"),/FAIL sample/],
 ['out of order sample','src/presentations/how-to-make-a-presentation/metadata.json',s=>JSON.stringify(JSON.parse(s).reverse()),/FAIL sample/],
 ['console error','src/presentations/how-to-make-a-presentation/steps/Scene.tsx',s=>s.replace('return <SceneLayer>',"if (beat === 2) console.error('injected console error')\n return <SceneLayer>"),/FAIL render step 1:.*injected console error/],
 ['page error','src/presentations/how-to-make-a-presentation/steps/Scene.tsx',s=>s.replace('return <SceneLayer>',"if (beat === 2) setTimeout(() => { throw new Error('injected page error') }, 20)\n return <SceneLayer>"),/FAIL render step 1:.*injected page error/],
 ['render error','src/presentations/how-to-make-a-presentation/steps/Scene.tsx',s=>s.replace('return <SceneLayer>',"if (beat === 2) throw new Error('injected render error')\n return <SceneLayer>"),/FAIL render step 1:/],
 ['stalled transition','src/presentation-kit/usePresentationNav.ts',s=>s.replace('Math.min(Math.max(0, count - 1), i + 1)','Math.min(Math.max(0, count - 1), i)'),/FAIL render step 1:/],
 ]
 for (const [name,file,mutate,diagnostic] of faults) await t.test(name, async () => {
  const dir = await copy()
  try {
   await edit(dir,file,mutate)
   const result = await run(dir,['run','verify'])
   assert.notEqual(result.code,0)
   assert.match(result.output,diagnostic)
   assert.doesNotMatch(result.output,/PASS verification/)
   await assertCleaned(result.output)
  } finally { await rm(dir,{recursive:true,force:true}) }
 })
})
