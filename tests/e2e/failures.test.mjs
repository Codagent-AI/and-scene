import {test} from 'node:test'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { disposable,run,edit,remove,assertStopped } from '../harness.mjs'
const base='src/presentations/how-to-make-a-presentation/'
const previewArgs="['node_modules/vite/bin/vite.js', 'preview', '--host', HOST, '--port', String(port), '--strictPort']"
const cases=[
 {name:'preview startup',phase:'preview',detail:'preview startup failed',inject:dir=>edit(dir,'scripts/browser.mjs',s=>s.replace(previewArgs, "['-e', 'process.exit(23)']"))},
 {name:'preview readiness',phase:'preview',detail:'preview readiness failed',inject:dir=>edit(dir,'scripts/browser.mjs',s=>s.replace(previewArgs, "['-e', 'setInterval(() => {}, 1000)']").replace('i < 100','i < 3'))},
 {name:'build',phase:'build',inject:dir=>writeFile(path.join(dir,'src/broken.ts'),'const broken: number = "invalid"; export { broken }')},
 {name:'missing registration',phase:'sample',inject:dir=>edit(dir,'src/presentations/index.ts',s=>s.replace("slug: 'how-to-make-a-presentation'","slug: 'missing'"))},
 {name:'out-of-order metadata',phase:'sample',inject:dir=>edit(dir,base+'steps/metadata.ts',s=>s.replace('You have a topic','Wrong opening'))},
 {name:'console first step',phase:'render',step:0,inject:dir=>edit(dir,base+'steps/Scene.tsx',s=>s.replace('return <SceneLayer>',"if (beat === 1) console.error('injected console failure'); return <SceneLayer>"))},
 {name:'page later step',phase:'render',step:3,inject:dir=>edit(dir,base+'steps/Scene.tsx',s=>s.replace('return <SceneLayer>',"if (beat === 4) throw new Error('injected page failure'); return <SceneLayer>"))},
 {name:'stalled transition',phase:'transition',step:1,inject:dir=>edit(dir,'src/presentation-kit/Presentation.tsx',s=>s.replace('data-step-index={nav.index}','data-step-index={0}'))},
]
for(const fault of cases)test(`E2E-002 ${fault.name} fails actionably and cleans preview`,{timeout:180000},async()=>{
 const dir=await disposable(`fault-${fault.name.replaceAll(' ','-')}`)
 try{
  await fault.inject(dir);const result=await run('npm',['run','verify'],dir);console.log(result.output);assert.notEqual(result.code,0,result.output);assert.match(result.output,new RegExp(fault.phase+':'));assert.doesNotMatch(result.output,/PASS verification/)
  if(fault.step!==undefined)assert.match(result.output,new RegExp(`step ${fault.step}`))
  if(fault.detail)assert.match(result.output,new RegExp(fault.detail))
  assert.equal([...result.output.matchAll(/PREVIEW started pid=/g)].length,fault.phase==='build'?0:1)
  assert.equal([...result.output.matchAll(/BROWSER started pid=/g)].length,['build','preview'].includes(fault.phase)?0:1)
  assertStopped(assert,result.output)
 }finally{await remove(dir)}
})
