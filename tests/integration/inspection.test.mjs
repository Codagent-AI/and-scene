import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile,readFile,stat } from 'node:fs/promises'
import path from 'node:path'
import { disposable,run,remove,assertStopped } from '../harness.mjs'
test('INT-002 settled faithful screenshots and scoped advisory diagnostics',{timeout:180000},async()=>{
 const dir=await disposable('inspection')
 try {
  await writeFile(path.join(dir,'src/presentations/how-to-make-a-presentation/Talk.tsx'),`import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import { useEffect, useState } from 'react'
function Scene({payload}:SceneProps<number>){const [settled,setSettled]=useState(false);useEffect(()=>{setSettled(false);const t=setTimeout(()=>setSettled(true),200);return()=>clearTimeout(t)},[payload]);return <div><style>{'[data-presentation-toc-entry] {width:90px}'}</style>
<div id="collision-a" style={{position:'absolute',left:20,top:30}}>accidental alpha</div><div id="collision-b" style={{position:'absolute',left:20,top:30}}>accidental beta</div>
<div data-presentation-allow-overlap=""><div id="allowed-a" style={{position:'absolute',left:20,top:80}}>allowed alpha</div><div><div id="allowed-b" style={{position:'absolute',left:20,top:80}}>allowed beta</div></div></div>
<button id="padded-control" data-presentation-next="" style={{position:'absolute',left:100,top:190,width:180,height:50,padding:'12px 20px',textAlign:'right'}}>Next</button>
<span id="padding-label" style={{position:'absolute',left:102,top:200}}>edge</span>
<button id="icon-control" data-presentation-prev="" aria-label="Icon control" style={{position:'absolute',left:320,top:190,width:40,height:40}}><svg width="14" height="14"><circle cx="7" cy="7" r="5" /></svg></button>
<button id="icon-peer" data-presentation-next="" aria-label="Icon peer" style={{position:'absolute',left:340,top:190,width:40,height:40}}><svg width="14" height="14"><circle cx="7" cy="7" r="5" /></svg></button>
<span id="icon-label" style={{position:'absolute',left:322,top:200}}>icon</span>
<div data-presentation-allow-overlap=""><button id="allowed-control" data-presentation-next="" style={{position:'absolute',left:400,top:190,width:80,height:40}}>Allowed</button><span id="allowed-label" style={{position:'absolute',left:402,top:200}}>ok</span></div>
<div style={{position:'absolute',left:20,top:150}}>{settled?'settled':'moving'} unique-content-{payload}</div></div>}
const steps:Step<number>[]=[0,1,2].map(i=>({id:String(i),era:i===0?'first':'second',title:'Fixture '+i,caption:'Caption '+i,Scene,payload:i,groupKey:'same'}))
export default function Talk(){return <Presentation steps={steps} title="Fixture"/>}
`)
  const result=await run('npm',['run','inspect','--','how-to-make-a-presentation','--settle','400'],dir);console.log(result.output);assert.equal(result.code,0,result.output)
  assertStopped(assert,result.output);assert.match(result.output,/PASS capture/);assert.match(result.output,/http:\/\/127\.0\.0\.1:/)
  const report=JSON.parse(await readFile(path.join(dir,'inspection/how-to-make-a-presentation/report.json'),'utf8'))
  assert.deepEqual(report.viewport,{width:1440,height:900});assert.equal(report.captures.length,3)
  for(const capture of report.captures){
   const i=capture.index;assert.match(capture.file,new RegExp(`step-0${i+1}\\.png$`));assert.ok(capture.capturedAt-capture.transitionedAt>=400);assert.match(capture.content,new RegExp(`settled unique-content-${i}`));assert.doesNotMatch(capture.content,/moving/)
   const buffer=await readFile(path.join(dir,capture.file));assert.ok((await stat(path.join(dir,capture.file))).size>100);assert.equal(buffer.readUInt32BE(16),1440);assert.equal(buffer.readUInt32BE(20),900)
   const warnings=capture.warnings.join('\n');assert.match(warnings,new RegExp(`step ${i}: overlap collision-a.*collision-b`));assert.doesNotMatch(warnings,/overlap .*allowed-/);assert.match(warnings,/overlap padding-label.*padded-control/);assert.match(warnings,/overlap icon-label.*icon-control/);assert.match(warnings,/overlap icon-control \/ icon-peer/);assert.doesNotMatch(warnings,/overlap padded-control:Next.*padding-label/);assert.doesNotMatch(warnings,/overlap padded-control:Next.*padded-control/);assert.match(warnings,new RegExp(`step ${i}: indistinct active progress`));assert.match(warnings,new RegExp(`step ${i}: indistinct active toc-entry`));assert.match(warnings,new RegExp(`step ${i}: unpolished attribution: style \\[data-presentation-attribution\\]`))
  }
  console.log('INT-002: production preview; PNG dimensions; distinct settled content; timestamps; scoped overlap; both active controls; attribution; advisory exit all passed')
 }finally{await remove(dir)}
})
