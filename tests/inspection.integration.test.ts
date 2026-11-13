// @vitest-environment node
import { afterAll, expect, it } from 'vitest'
import { readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { copyApp, assertCleanup, exec } from './support/app'
let root:string
afterAll(async()=>{if(root)await rm(root,{recursive:true,force:true})})
it('INT-002 screenshots settle and warnings remain specific, exemptible and advisory',async()=>{
 root=await copyApp('inspection')
 await writeFile(path.join(root,'src/presentations/how-to-make-a-presentation/Talk.tsx'),`
import { Presentation } from '../../presentation-kit/Presentation'
import type {Step, SceneProps} from '../../presentation-kit/types'
import './fixture.css'
function Scene({payload}:SceneProps<number>) { return <div data-fixture-beat={payload}>
 <span style={{position:'absolute',left:20,top:30}}>collision one</span><span style={{position:'absolute',left:20,top:30}}>collision two</span>
 <div data-presentation-allow-overlap=""><span style={{position:'absolute',left:320,top:30}}>allowed one</span><span style={{position:'absolute',left:320,top:30}}>allowed two</span></div>
 <div style={{opacity:0}}><span style={{position:'absolute',left:20,top:30}}>hidden one</span><span style={{position:'absolute',left:20,top:30}}>hidden two</span></div>
 <span className="settle-probe" style={{position:'absolute',left:20,top:100}}>settled {payload}</span>
 </div> }
const steps:Step<number>[]=[0,1,2].map(i=>({id:String(i),era:'era '+i,title:'Fixture '+i,caption:'Fixture caption '+i,Scene,payload:i,groupKey:'fixture'}))
export default function Talk(){return <Presentation steps={steps} title="Fixture"/>}
`)
 await writeFile(path.join(root,'src/presentations/how-to-make-a-presentation/fixture.css'),`
 [data-presentation-root] { font-family: sans-serif; }
 [data-presentation-progress] button, [data-presentation-toc] button {color:#111;background:#eee;border:1px solid #aaa;font-weight:400;}
 [data-presentation-root]:has([data-fixture-beat="1"]) [data-presentation-attribution] {font-size:9px;}
 [data-presentation-root]:has([data-fixture-beat="2"]) [data-presentation-attribution] {display:none;}
 .settle-probe {animation: arrive .7s both;} @keyframes arrive {from{opacity:0}to{opacity:1}}
 `)
 await exec('npm',['run','build'],{cwd:root,timeout:120000,maxBuffer:4e6})
 const {stdout,stderr}=await exec('npm',['run','inspect','--','how-to-make-a-presentation'],{cwd:root,timeout:120000,maxBuffer:4e6});console.log(stdout+stderr)
 const artifact=path.join(root,'artifacts/inspection/how-to-make-a-presentation')
 const report=JSON.parse(await readFile(path.join(artifact,'report.json'),'utf8'))
 expect(report.viewport).toEqual({width:1440,height:900});expect(report.steps).toHaveLength(3)
 for(const step of report.steps) {
  expect(step.settledMs).toBeGreaterThanOrEqual(report.settle)
  expect(step.file).toBe(`step-0${step.index+1}.png`)
  const image=await readFile(path.join(artifact,step.file));expect(image.subarray(1,4).toString()).toBe('PNG');expect(image.readUInt32BE(16)).toBe(1440)
  expect(step.warnings.join('\n')).toMatch(new RegExp('step '+step.index+': overlap:.*collision'))
  expect(step.warnings.join('\n')).not.toMatch(/overlap:.*(allowed|hidden)/)
  expect(step.warnings.join('\n')).toContain(`step ${step.index}: indistinct active progress`)
  expect(step.warnings.join('\n')).toContain(`step ${step.index}: indistinct active toc`)
  expect(step.warnings.join('\n')).toContain(`step ${step.index}: unpolished attribution`)
 }
 expect(stdout).toContain('advisory only')
 assertCleanup(stdout)
})
