import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, mkdir, readFile, writeFile, rm, readdir, symlink } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { materialize, bootstrapDirectory } from '../skills/presentation/scaffold.mjs'
import { inspect } from '../scripts/inspect-presentation.mjs'
import { withPreview, openPresentation, advance, SETTLE_MS } from '../scripts/browser.mjs'
const root = process.cwd()
const evidence = process.env.EVIDENCE_DIR
async function save(name, text) { if (evidence) await writeFile(join(evidence, `resolve-${name}`), text) }
async function saveResult(name, result) { await save(name, `Command: ${JSON.stringify(result.command)}\nCwd: ${result.cwd}\n${result.output}\nExit: ${result.code}\n`) }
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
    child.on('error',reject); child.on('exit',code=>{clearTimeout(timeout);resolve({code,output,command:[executable,...args],cwd})})
  })
}
async function compareTrees(a,b) {
  const names = await readdir(a,{withFileTypes:true})
  assert.deepEqual(names.map(e=>e.name).sort(),(await readdir(b)).sort())
  for(const e of names) if(e.isDirectory()) await compareTrees(join(a,e.name),join(b,e.name)); else assert.equal(await readFile(join(a,e.name),'utf8'),await readFile(join(b,e.name),'utf8'),e.name)
}
test('INT-001 materialized bootstrap installs builds and verifies outside source with byte parity and neutral contracts', {timeout:180000}, async () => {
  const dir = await temporary()
  const unrelated = await mkdtemp(join(tmpdir(), 'and-scene-caller-'))
  try {
    const helper = pathToFileURL(join(root, 'skills/presentation/scaffold.mjs')).href
    const invocation = await command(unrelated, ['--input-type=module', '-e', `import { materialize, bootstrapDirectory } from ${JSON.stringify(helper)}; await materialize(process.argv[1]); console.log(JSON.stringify({cwd:process.cwd(),bootstrapDirectory}));`, dir])
    await saveResult('INT-001-cwd.log', invocation)
    assert.equal(invocation.code, 0, invocation.output)
    const lookup = JSON.parse(invocation.output.trim())
    assert.equal(lookup.cwd, unrelated)
    assert.ok(!lookup.cwd.startsWith(root))
    assert.equal(lookup.bootstrapDirectory, bootstrapDirectory)
    await cp(join(root,'skills/presentation/templates/presentation'),join(dir,'src/presentations/template-contract'),{recursive:true})
    const registry=join(dir,'src/presentations/index.ts')
    await writeFile(registry,(await readFile(registry,'utf8')).replace('export const presentations = [', "export const presentations = [{slug:'template-contract',title:'Template contract',load:()=>import('./template-contract/Talk')},"))
    await assert.rejects(()=>materialize(dir),/Refusing to overwrite/)
    const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'))
    for(const dep of ['react','react-dom','motion','lucide-react']) assert.ok(pkg.dependencies[dep],dep)
    for(const dep of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright']) assert.ok(pkg.devDependencies[dep],dep)
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    for(const path of ['src/presentation-kit/Presentation.tsx','src/presentations/index.ts','package-lock.json']) assert.ok((await readFile(join(dir,path))).length)
    await compareTrees(join(root,'src/presentation-kit'),join(bootstrapDirectory,'src/presentation-kit'))
    for(const file of ['browser.mjs','verify.mjs','reference.mjs','diagnostics.mjs','inspect-presentation.mjs']) assert.equal(await readFile(join(root,'scripts',file),'utf8'),await readFile(join(dir,'scripts',file),'utf8'))
    const install=await command(dir,['ci','--no-audit','--no-fund'],'npm'); await saveResult('INT-001-install.log',install); assert.equal(install.code,0,install.output)
    const verify=await command(dir,['run','verify'],'npm'); await saveResult('INT-001-verify.log',verify); assert.equal(verify.code,0,verify.output); assert.match(verify.output,/PASS step 0\/0/)
    const templateCheck=await command(dir,['--input-type=module','-e',"import { verify } from './scripts/verify.mjs'; await verify({slug:'template-contract',canonical:false,build:false})"]); await saveResult('INT-001-template.log',templateCheck); assert.equal(templateCheck.code,0,templateCheck.output)
    const kit=(await readFile(join(dir,'src/presentation-kit/nodes/primitives.tsx'),'utf8'))
    assert.ok(!/#[0-9a-f]{3,8}|fontFamily|boxShadow|border:/.test(kit))
  } finally { await rm(dir,{recursive:true,force:true}); await rm(unrelated,{recursive:true,force:true}) }
})
test('INT-002 helper captures settled step screenshots and reports only unexempted overlap plus active and attribution defects', {timeout:180000}, async () => {
  const dir=await copyProject()
  try {
    const fixture=join(dir,'src/presentations/inspection-fixture'); await mkdir(fixture,{recursive:true})
    await writeFile(join(fixture,'Talk.tsx'),`import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function SettlingProbe() {
  const [settled,setSettled]=useState(false)
  useEffect(()=>{ const timer=setTimeout(()=>setSettled(true),850); return ()=>clearTimeout(timer) },[])
  return <div style={{position:'fixed',left:1000,top:500,width:20,height:20,background:settled?'rgb(0, 200, 0)':'rgb(200, 0, 0)'}} />
}
function Scene({ payload }: SceneProps<number>) {
  const [host,setHost]=useState<HTMLElement|null>(null)
  useEffect(()=>{ const root=document.querySelector<HTMLElement>('[data-presentation]')!; root.dataset.fixtureVariant=String(payload); setHost(root) },[payload])
  return <>
    {payload<2 && <div data-presentation-allow-overlap={payload===1 ? '' : undefined}><span style={{position:'absolute',left:50,top:50}}>Collision A</span><span style={{position:'absolute',left:50,top:50}}>Collision B</span></div>}
    {host && createPortal(<><SettlingProbe key={payload}/>{payload===0 && <span data-entity="chrome-collision" style={{position:'fixed',left:20,top:10}}>Chrome collision</span>}</>,host)}
  </>
}
const steps: Step<number>[] = [0,1,2,3].map(payload=>({id:String(payload),era:String(payload),title:'Inspection '+payload,caption:'Fixture caption '+payload,Scene,payload,groupKey:'fixture'}))
export default function Talk() { return <div><style>{'[data-presentation-header]{position:absolute;top:10px;left:20px}[data-presentation-footer]{position:absolute;bottom:50px;left:100px}[data-presentation-toc]{position:absolute;right:20px;top:15px}[data-presentation-mode-toggle]{position:absolute;right:20px;top:55px}[data-presentation-attribution]{font-size:8px}[data-fixture-variant="1"] [data-presentation-active="true"]{background:#164d35;color:white;font-weight:700}[data-fixture-variant="1"] [data-presentation-attribution]{font-size:14px;color:#164d35;text-decoration:none}[data-fixture-variant="2"] [data-presentation-attribution]{font-size:16px;color:rgb(0,0,238);text-decoration:underline}[data-fixture-variant="3"] [data-presentation-attribution]{display:none}'}</style><Presentation title="Fixture" steps={steps}/></div> }
`)
    await writeFile(join(dir,'src/presentations/index.ts'),"export const presentations = [{slug:'inspection-fixture',title:'Fixture',load:()=>import('./inspection-fixture/Talk')}]\n")
    const captures=[]
    const result=await inspect({slug:'inspection-fixture',cwd:dir,settle:1100,onCapture: async ({index,file,viewport,elapsedBeforeCapture,page})=>{
      assert.ok(elapsedBeforeCapture>=1100, `step ${index}: configured settle interval must elapse before screenshot starts`)
      const png=await readFile(file)
      // Decode the saved PNG in Chromium: this tests what was captured, not a
      // timestamp sampled after a wait or the DOM's state after the screenshot.
      const pixel=await page.evaluate(async base64=>{
        const image=new Image(); image.src='data:image/png;base64,'+base64; await image.decode()
        const canvas=document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height
        const context=canvas.getContext('2d'); context.drawImage(image,0,0)
        return Array.from(context.getImageData(1010,510,1,1).data)
      },png.toString('base64'))
      assert.deepEqual(pixel,[0,200,0,255],`step ${index} screenshot must contain the settled green probe, never the pending red probe`)
      captures.push({index,file,viewport,elapsedBeforeCapture,pixel})
    }})
    assert.equal(captures.length,4)
    for(const capture of captures) {
      assert.deepEqual(capture.viewport,{width:1440,height:900})
      const png=await readFile(capture.file); assert.equal(png.subarray(1,4).toString(),'PNG'); assert.equal(png.readUInt32BE(16),1440); assert.equal(png.readUInt32BE(20),900)
    }
    assert.deepEqual((await readdir(result.directory)).sort(),['01.png','02.png','03.png','04.png'])
    const at=step=>result.warnings.filter(w=>w.startsWith(`step ${step}:`))
    assert.ok(at(0).some(w=>w.includes('overlap span[Collision A] / span[Collision B]')))
    assert.ok(at(0).some(w=>w.includes('overlap') && w.includes('chrome-collision') && w.includes('data-presentation-marker')))
    for (const step of [0,2,3]) {
      assert.ok(at(step).includes(`step ${step}: indistinct active [data-presentation-progress]`))
      assert.ok(at(step).includes(`step ${step}: indistinct active [data-presentation-toc]`))
      assert.ok(at(step).includes(`step ${step}: style [data-presentation-attribution]: missing, undersized or browser-default attribution`))
    }
    assert.deepEqual(at(1),[], 'allowed overlap, distinct active controls, and polished attribution produce no warnings')
    await save('INT-002-artifacts.log',JSON.stringify({test:'INT-002',captures,warnings:result.warnings,assertions:'step-specific text/text and text/chrome collisions; allowed subtree, distinct active and polished attribution negative controls; undersized/browser-default/missing attribution; actual PNG pixels settled green'},null,2))
  } finally { await rm(dir,{recursive:true,force:true}) }
})
test('E2E-001 reference production verification reports every index and clear pass on IPv4', {timeout:180000}, async () => {
  const result=await command(root,['run','verify'],'npm'); await saveResult('E2E-001.log',result)
  assert.equal(result.code,0,result.output)
  for(let n=0;n<9;n++) assert.match(result.output,new RegExp(`PASS step ${n}/8`))
  assert.match(result.output,/preview http:\/\/127\.0\.0\.1:/); assert.match(result.output,/PASS verification/); assert.match(result.output,/preview cleaned/)
  // Reuse the production build above for real-layout regressions of F-001/F-002.
  // All steps use the same fixed model; test text size and bounds after fitting.
  const phoneSteps=[]
  await withPreview(root, async (browser, base) => {
    const page=await browser.newPage({viewport:{width:390,height:844}})
    const count=await openPresentation(page,base,'how-to-make-a-presentation')
    for(let index=0;index<count;index++) {
      if(index) await advance(page,index)
      await page.waitForTimeout(SETTLE_MS)
      const state=await page.evaluate(()=>{
        const canvas=document.querySelector('[data-presentation-canvas]')
        const bounds=canvas.getBoundingClientRect()
        const scale=bounds.width/880
        const walker=document.createTreeWalker(canvas,NodeFilter.SHOW_TEXT)
        const labels=[]
        while(walker.nextNode()) {
          const node=walker.currentNode, text=node.textContent.trim()
          if(!text) continue
          const range=document.createRange(); range.selectNodeContents(node)
          const rect=range.getBoundingClientRect()
          const size=parseFloat(getComputedStyle(node.parentElement).fontSize)*scale
          const card=node.parentElement.closest('.entity-card,.entity-verify')
          const cardBounds=card?.getBoundingClientRect()
          const insideCard=!cardBounds || (rect.left>=cardBounds.left-1 && rect.right<=cardBounds.right+1 && rect.top>=cardBounds.top-1 && rect.bottom<=cardBounds.bottom+1)
          const owner=node.parentElement.closest('[data-entity]')?.getAttribute('data-entity')
          const allowed=!!node.parentElement.closest('[data-presentation-allow-overlap]')
          labels.push({text,size,owner,allowed,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,insideCard,inside:rect.left>=bounds.left-1 && rect.right<=bounds.right+1 && rect.top>=bounds.top-1 && rect.bottom<=bounds.bottom+1})
        }
        return {scale,width:canvas.style.width,height:canvas.style.height,labels}
      })
      assert.equal(state.width,'880px'); assert.equal(state.height,'380px')
      assert.ok(Math.abs(state.scale-342/880)<0.001)
      for(const label of state.labels) {
        assert.ok(label.size>=12,`step ${index}: ${label.text} is only ${label.size}px after fitting`)
        assert.ok(label.inside,`step ${index}: ${label.text} extends outside the fixed canvas`)
        assert.ok(label.insideCard,`step ${index}: ${label.text} extends outside its card`)
      }
      for(let a=0;a<state.labels.length;a++) for(let b=a+1;b<state.labels.length;b++) {
        const first=state.labels[a], second=state.labels[b]
        if(first.allowed || second.allowed || first.owner===second.owner) continue
        const dx=Math.max(0,first.left-second.right,second.left-first.right)
        const dy=Math.max(0,first.top-second.bottom,second.top-first.bottom)
        assert.ok(Math.hypot(dx,dy)>=3,`step ${index}: ${first.owner} / ${second.owner} labels overlap or lack a 3px reading gap`)
      }
      assert.ok(state.labels.length>0)
      phoneSteps.push({index,...state})
    }
    await page.close()
  })
  await save('E2E-001-phone-readability.log',JSON.stringify(phoneSteps,null,2))
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
    const result=await command(dir,['run','verify'],'npm'); await saveResult(`E2E-002-${fault}.log`,result)
    assert.notEqual(result.code,0,result.output); assert.match(result.output,/FAIL/); assert.ok(!result.output.includes('PASS verification'))
    if(fault==='build') assert.match(result.output,/FAIL build/)
    else if(fault==='missing'||fault==='order') assert.match(result.output,/FAIL sample/)
    else if(fault==='console') assert.match(result.output,/step 2: console: injected console fault/)
    else if(fault==='page') { assert.match(result.output,/step 2: page: injected page fault/); assert.ok(!result.output.includes('transition failed')) }
    else { assert.match(result.output,/step 1: transition failed/); assert.ok(!result.output.includes('injected page fault')) }
    if(!['build','missing'].includes(fault)) {
      const match=result.output.match(/preview http:\/\/127\.0\.0\.1:(\d+) pid=(\d+)/); assert.ok(match,result.output)
      assert.match(result.output,/preview cleaned/)
      assert.throws(()=>process.kill(Number(match[2]),0))
      await assert.rejects(()=>fetch(`http://127.0.0.1:${match[1]}`))
    }
  } finally { await rm(dir,{recursive:true,force:true}) }
})
