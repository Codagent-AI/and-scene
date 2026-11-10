import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, writeFile, rm, readdir, stat, symlink, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'
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
 const caller = await mkdtemp(path.join(tmpdir(),'and-scene-external-caller-'))
 try {
  const moduleUrl = pathToFileURL(path.join(root,'skills/presentation/scripts/scaffold.mjs')).href
  const source = `import {plan,scaffold,templateRoot} from ${JSON.stringify(moduleUrl)}; const result = await plan(${JSON.stringify(dir)}); await scaffold(result,{install:false}); console.log(JSON.stringify({cwd:process.cwd(),templateRoot,target:result.target}))`
  const { stdout } = await promisify(execFile)(process.execPath,['--input-type=module','-e',source],{cwd:caller,timeout:10000})
  const resolved = JSON.parse(stdout)
  assert.equal(resolved.cwd,await realpath(caller))
  assert.equal(resolved.target,dir)
  assert.equal(resolved.templateRoot,path.join(root,'skills/presentation/templates/bootstrap')+path.sep)
  console.log(`outside-caller template resolution: ${stdout.trim()}`)
  const installed = await run(dir,['ci','--prefer-offline']); assert.equal(installed.code,0)
  const pkg = JSON.parse(await readFile(path.join(dir,'package.json'),'utf8'))
  for (const dep of ['react','react-dom','motion','lucide-react']) assert.ok(pkg.dependencies[dep])
  for (const dep of ['vite','typescript','@vitejs/plugin-react','@types/node','@types/react','@types/react-dom','eslint','typescript-eslint','playwright']) assert.ok(pkg.devDependencies[dep])
  assert.ok(!Object.keys({...pkg.dependencies,...pkg.devDependencies}).some(d => /tailwind/i.test(d)))
  await compare('src/presentation-kit',path.join(dir,'src/presentation-kit'))
  for (const name of ['verify.mjs','browser.mjs','diagnostics.mjs','inspect-presentation.mjs','reference.json']) assert.equal(await readFile(`scripts/${name}`,'utf8'),await readFile(path.join(dir,'scripts',name),'utf8'))
  const result = await run(dir,['run','verify']); assert.equal(result.code,0)
  await assertCleaned(result.output)
 } finally { await rm(dir,{recursive:true,force:true}); await rm(caller,{recursive:true,force:true}) }
})
test('INT-002 inspection captures settled artifacts and reports only unmarked collisions plus chrome defects as advisories', {timeout:180000}, async () => {
 const dir = await copy()
 try {
  await writeFile(path.join(dir,'src/presentations/how-to-make-a-presentation/Talk.tsx'), `
import { useLayoutEffect, useState } from 'react'
import { Presentation } from '../../presentation-kit/Presentation'
function Fixture({payload}:{payload:number}) {
 const [settled,setSettled] = useState(false)
 const [started,setStarted] = useState(0)
 useLayoutEffect(()=>{setStarted(performance.now());setSettled(false);const timer=setTimeout(()=>setSettled(true),700);return ()=>clearTimeout(timer)},[payload])
 return <div data-fixture-step={payload} data-fixture-settled={settled} data-fixture-start={started} style={{position:'relative'}}><div style={{position:'absolute',left:100,top:30}}>collision alpha</div><div style={{position:'absolute',left:100,top:30}}>collision beta</div><div data-allow-overlap="true"><div style={{position:'absolute',left:100,top:80}}>allowed alpha</div><div style={{position:'absolute',left:100,top:80}}>allowed beta</div></div><button data-presentation-mode-toggle id="fixture-icon" aria-label="Fixture icon" style={{position:'absolute',left:100,top:210,width:60,height:35}}><svg width="15" height="15" /></button><span style={{position:'absolute',left:105,top:215}}>icon clash</span><button data-presentation-mode-toggle id="fixture-edge" style={{position:'absolute',left:100,top:265,width:190,height:40}}><span style={{position:'absolute',left:100,top:10}}>edge label</span></button><span style={{position:'absolute',left:105,top:270}}>edge clash</span><section data-allow-overlap="true"><button data-presentation-mode-toggle id="allowed-icon" aria-label="Allowed icon" style={{position:'absolute',left:330,top:210,width:60,height:35}}><svg /></button><span style={{position:'absolute',left:335,top:215}}>allowed icon text</span></section><div style={{position:'absolute',top:340}}>{settled ? 'settled state' : 'transitioning'}</div></div>
}
export default function Talk(){return <><style>{'[data-presentation-attribution] a {font-size:8px} [data-presentation-header] {height:100px} [data-presentation-footer] {margin-top:20px}'}</style><Presentation title="Fixture" steps={[0,1,2].map(i=>({id:String(i),era:i<2?'one':'two',title:'Fixture '+i,caption:'Caption '+i,Scene:Fixture,payload:i,groupKey:'fixture'}))}/></>}
`)
  // Observe the actual page immediately before every real screenshot call.
  // Build/startup duration and the helper's own log messages cannot satisfy this.
  await writeFile(path.join(dir,'capture-probe.mjs'), `
import { appendFile } from 'node:fs/promises'
import { chromium } from 'playwright'
const launch = chromium.launch.bind(chromium)
chromium.launch = async (...args) => {
 const browser = await launch(...args)
 const newPage = browser.newPage.bind(browser)
 browser.newPage = async (...options) => {
  const page = await newPage(...options)
  const screenshot = page.screenshot.bind(page)
  page.screenshot = async (options) => {
   const state = await page.evaluate(() => {
    const fixture = document.querySelector('[data-fixture-step]')
    return {index:Number(fixture.dataset.fixtureStep),settled:fixture.dataset.fixtureSettled === 'true',elapsed:performance.now()-Number(fixture.dataset.fixtureStart)}
   })
   await appendFile('capture-observations.jsonl', JSON.stringify({...state,path:options.path})+'\\n')
   return screenshot(options)
  }
  return page
 }
 return browser
}
const { inspect } = await import('./scripts/inspect-presentation.mjs')
await inspect('how-to-make-a-presentation')
`)
  await edit(dir,'package.json',s => { const pkg = JSON.parse(s);pkg.scripts.inspect = 'node capture-probe.mjs';return JSON.stringify(pkg) })
  const result = await run(dir,['run','inspect','--','how-to-make-a-presentation'])
  assert.equal(result.code,0,'warnings must be advisory')
  const observations = (await readFile(path.join(dir,'capture-observations.jsonl'),'utf8')).trim().split('\n').map(line => JSON.parse(line))
  assert.equal(observations.length,3)
  console.log('actual screenshot observations:',JSON.stringify(observations))
  for (let i=0;i<3;i++) {
    assert.match(result.output,new RegExp(`CAPTURE step ${i} settled 900ms`))
    assert.match(result.output,new RegExp(`WARN step ${i}: overlap.*collision alpha.*collision beta`))
    assert.match(result.output,new RegExp(`WARN step ${i}: indistinct active chrome: progress`))
    assert.match(result.output,new RegExp(`WARN step ${i}: unpolished attribution`))
    assert.match(result.output,new RegExp(`WARN step ${i}: overlap.*icon clash.*button#fixture-icon`))
    assert.match(result.output,new RegExp(`WARN step ${i}: overlap.*edge clash.*button#fixture-edge`))
    assert.equal(observations[i].index,i)
    assert.equal(observations[i].settled,true,`step ${i} captured an unsettled DOM`)
    assert.ok(observations[i].elapsed>=900,`step ${i} captured before configured settle interval: ${observations[i].elapsed}`)
    assert.match(observations[i].path,new RegExp(`step-0${i+1}\\.png$`))
    const file = path.join(dir,`artifacts/inspection/how-to-make-a-presentation/step-0${i+1}.png`)
    assert.ok((await stat(file)).size>1000)
  }
  assert.match(result.output,/indistinct active chrome: toc/)
  assert.doesNotMatch(result.output,/WARN[^\n]*allowed (alpha|beta)/)
  assert.doesNotMatch(result.output,/WARN[^\n]*(allowed-icon|allowed icon text)/)
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
