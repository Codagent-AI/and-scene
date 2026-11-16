import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, writeFile, mkdir, symlink, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { withBrowser, walkSteps } from '../scripts/lib/browser.mjs'
import { textContainment } from './helpers/text-containment.mjs'
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
    const skillDir=join(root,'skills/presentation')
    // Invoke the public resolver in another process whose cwd contains no templates.
    const lookup=await run(process.execPath,[join(skillDir,'templates.mjs'),'bootstrap'],dir,'INT-001-lookup-bootstrap')
    assert.equal(lookup.code,0,lookup.output)
    assert.equal(resolve(lookup.output.trim()),join(skillDir,'templates/bootstrap'))
    const presentation=await run(process.execPath,[join(skillDir,'templates.mjs'),'presentation'],dir,'INT-001-lookup-presentation')
    assert.equal(presentation.code,0,presentation.output)
    assert.equal(resolve(presentation.output.trim()),join(skillDir,'templates/presentation'))
    const invalid=await run(process.execPath,[join(skillDir,'templates.mjs'),'unknown'],dir,'INT-001-lookup-invalid')
    assert.notEqual(invalid.code,0); assert.match(invalid.output,/Expected bootstrap or presentation/)
    await cp(lookup.output.trim(),dir,{recursive:true})
    const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'))
    for(const dep of ['react','react-dom','motion','lucide-react']) assert.ok(pkg.dependencies[dep],dep)
    for(const dep of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','playwright']) assert.ok(pkg.devDependencies[dep],dep)
    assert.ok(!Object.keys({...pkg.dependencies,...pkg.devDependencies}).some(d=>/tailwind/.test(d)))
    assert.deepEqual(await files(join(dir,'src/presentation-kit')),await files(join(root,'src/presentation-kit')))
    for(const file of await files(join(root,'src/presentation-kit'))) assert.equal(await readFile(join(dir,'src/presentation-kit',file),'utf8'),await readFile(join(root,'src/presentation-kit',file),'utf8'),file)
    for(const file of ['verify.mjs','inspect-presentation.mjs',...await files(join(root,'scripts/lib')).then(xs=>xs.map(x=>'lib/'+x))]) assert.equal(await readFile(join(dir,'scripts',file),'utf8'),await readFile(join(root,'scripts',file),'utf8'),file)
    const install=await run('npm',['ci','--no-audit','--no-fund'],dir,'INT-001-install'); assert.equal(install.code,0,install.output)
    const lint=await run('npm',['run','lint'],dir,'INT-001-lint'); assert.equal(lint.code,0,lint.output)
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
  // A-001 regression: use actual production font metrics and bounding boxes,
  // reusing the build above. This runs with E2E-001, never in the fast unit gate.
  await withBrowser(root, async (page, base) => {
    await walkSteps(page, `${base}/how-to-make-a-presentation`, async (page, step) => {
      if (![0, 2, 3, 8].includes(step)) return
      for (const font of ['default', 'wide fallback']) {
        const override = font === 'default' ? null : await page.addStyleTag({ content: '.field-guide .kit, .field-guide .verify, .field-guide .verify strong, .field-guide .ghost, .field-guide .ghost small { font-family: "DejaVu Sans", monospace; } .field-guide .morph small { font-family: "DejaVu Sans Mono", monospace; }' })
        try {
          const metrics = await page.evaluate(() => {
            const canvas = document.querySelector('[data-presentation-canvas]')
            const rect = canvas.getBoundingClientRect()
            const scale = rect.width / parseFloat(canvas.style.width)
            const bounds = box => ({ left: box.left, right: box.right, top: box.top, bottom: box.bottom })
            const labels = [...canvas.querySelectorAll('*')].flatMap(element => [...element.childNodes]
              .filter(node => node.nodeType === 3 && node.textContent.trim())
              .map(node => {
                const range = document.createRange(); range.selectNode(node)
                const text = range.getBoundingClientRect()
                const owner = element.closest('[data-entity]')
                return { text: node.textContent.trim(), lineCount: [...range.getClientRects()].filter(box => box.width > 0 && box.height > 0).length, pixels: parseFloat(getComputedStyle(element).fontSize) * scale,
                  bounds: bounds(text), owner: owner ? bounds(owner.getBoundingClientRect()) : null, ownerId: owner?.getAttribute('data-entity'),
                  allowedOverlap: !!element.closest('[data-presentation-allow-overlap]') }
              }))
            return { scale, heightScale: rect.height / parseFloat(canvas.style.height), canvas: bounds(rect), labels }
          })
          assert.ok(Math.abs(metrics.scale - metrics.heightScale) < 0.001, 'canvas scales uniformly')
          assert.ok(metrics.labels.length > 0)
          assert.equal(metrics.labels.filter(label => label.text === 'morph').length, step < 2 ? 0 : step === 2 ? 1 : 2, `step ${step}/${font}: morph labels present`)
          for (const label of metrics.labels) {
            if (label.text === 'morph') assert.equal(label.lineCount, 1, `step ${step}/${font}: morph must remain one word on one line`)
            assert.ok(label.pixels >= 12, `step ${step}/${font}: undersized ${label.text}: ${label.pixels}px`)
            assert.ok(label.owner, `step ${step}/${font}: label has no entity owner: ${label.text}`)
            const fit = textContainment(label.bounds, label.owner, metrics.canvas, label.allowedOverlap)
            assert.ok(fit.fitsCanvas, `step ${step}/${font}: text outside canvas: ${label.text}`)
            assert.ok(fit.fitsOwner, `step ${step}/${font}: text outside ${label.ownerId}: ${label.text}`)
          }
        } finally {
          await override?.evaluate(element => element.remove())
        }
      }
    })
  }, { width: 390, height: 900 })
})
test('E2E-002 verification failure phases steps exit codes and subprocess cleanup', {timeout:300000},async t=>{
  const faults = {
    build: async dir=>writeFile(join(dir,'src/broken.ts'),'export const broken: number = "bad"'),
    missing: async dir=>{await rm(join(dir,'src/presentations/how-to-make-a-presentation/Talk.tsx'));await writeFile(join(dir,'src/presentations/index.ts'),`import type {ComponentType} from 'react'\nexport const presentations: {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}[]=[]`)},
    unregistered: async dir=>edit(dir,'src/presentations/index.ts',s=>s.replace(/  \{ slug: 'how-to-make-a-presentation'.*\n/, "  // how-to-make-a-presentation is mentioned but NOT registered.\n")),
    title: async dir=>edit(dir,'src/presentations/how-to-make-a-presentation/outline.ts',s=>s.replace('You have a topic','Wrong title')),
    caption: async dir=>edit(dir,'src/presentations/how-to-make-a-presentation/outline.ts',s=>s.replace('It starts with you, a topic, and mild overconfidence.','Wrong caption.')),
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
      else if(['missing','unregistered'].includes(fault)) assert.match(result.output,/FAIL \[sample\].*missing or unregistered/)
      else if(['order','title','caption'].includes(fault)) assert.match(result.output,/FAIL \[sample\].*sample:.*step 0/)
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
    await writeFile(join(dir,'src/presentations/probe/Talk.tsx'),`import {useEffect,useState,useRef} from 'react'
import {Presentation} from '../../presentation-kit/Presentation'
import type {SceneProps,Step} from '../../presentation-kit/types'
function Scene({payload}:SceneProps<number>) {
 const [settled,setSettled]=useState(0)
 const status=useRef<HTMLSpanElement>(null)
 useEffect(()=>{
   const animation=status.current!.animate([{opacity:0.2},{opacity:1}],{duration:1100})
   animation.finished.then(()=>setSettled(payload),()=>{})
   return()=>animation.cancel()
 },[payload])
 return <div><span data-entity="collision-a" style={{position:'absolute',left:20,top:20}}>collision-a</span><span data-entity="collision-b" style={{position:'absolute',left:20,top:20}}>collision-b</span><div data-presentation-allow-overlap="" style={{position:'absolute',left:200,top:80}}><span data-entity="allowed-a" style={{position:'absolute'}}>allowed-a</span><span data-entity="allowed-b" style={{position:'absolute'}}>allowed-b</span></div><span ref={status} style={{position:'absolute',left:20,top:200}}>{settled===payload?'SETTLED':'MOVING'}-{payload}</span></div>
}
const steps:Step<number>[]=[1,2].map(i=>({id:String(i),era:i===1?'first':'second',title:'Probe '+i,caption:'Caption '+i,Scene,groupKey:'probe',payload:i}))
export default function Talk(){return <><style>{'[data-presentation-attribution] {font-size:8px;color:rgb(0,0,238)} [data-presentation-footer] {position:absolute;bottom:80px} [data-presentation-toc]{position:absolute;top:130px}'}</style><Presentation steps={steps} title="Probe" /></>}
`)
    await edit(dir,'src/presentations/index.ts',s=>s.replace('export const presentations: PresentationEntry[] = [',`export const presentations: PresentationEntry[] = [\n{slug:'probe',title:'Probe',load:()=>import('./probe/Talk')},`))
    const build=await run('npm',['run','build'],dir,'INT-002-build'); assert.equal(build.code,0,build.output)
    const result=await inspectPresentation({root:dir,slug:'probe',build:false,settle:1300})
    assert.equal(result.captures.length,2)
    for(const [index,capture] of result.captures.entries()) {
      assert.equal(capture.index,index); assert.equal(capture.settledMs,1300);assert.deepEqual(capture.viewport,{width:1440,height:900})
      assert.match(capture.path,new RegExp(`step-0${index+1}\\.png$`)); assert.match(capture.sceneText,new RegExp(`SETTLED-${index+1}`));assert.doesNotMatch(capture.sceneText,/MOVING/)
      assert.ok((await readFile(capture.path)).length>1000)
      // Snapshot metadata is measured before page.screenshot, after the 1100ms Web Animation.
      // With a default 800ms wait substituted for configured 1300ms, step 2 is still MOVING.
      assert.ok(capture.capturedAt>0)
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
