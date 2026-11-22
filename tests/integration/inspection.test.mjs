import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { it, expect } from 'vitest'
import { copyApp, fixture, command, success, remove, assertCleaned } from './helpers.mjs'
it('INT-002 captures settled per-step artifacts and advisory collision active-state attribution warnings with exemptions', async () => {
  const directory = await copyApp()
  try {
    await fixture(directory, `import { Presentation } from '../../presentation-kit'
function Scene({ payload }: { payload: number }) { return <>
<div style={{position:'absolute',left:100,top:50}}><span>collision-a</span></div><div style={{position:'absolute',left:100,top:50}}><span>collision-b</span></div>
<div data-presentation-allow-overlap="" style={{position:'absolute',left:200,top:100}}><span style={{position:'absolute'}}>allowed-a</span><span style={{position:'absolute'}}>allowed-b</span></div>
<div style={{position:'absolute',left:100,top:200}}>{payload}</div><div style={{position:'absolute',left:300,top:200,display:'flex',flexDirection:'column'}}>flow-parent<small>flow-child</small></div></> }
const steps = [1,2].map(n => ({id:String(n),era:String(n),title:'Fixture '+n,caption:'Caption '+n,Scene,payload:n,groupKey:'fixture'}))
export default function Talk() { return <><style>{'[data-presentation-attribution] a { font-size: 8px; } [data-presentation-progress-entry], [data-presentation-toc-entry] { color:black; background:white; border:0; font-weight:400; }'}</style><Presentation steps={steps} title="Fixture" attribution={<><a href="#">made by and-scene</a><button aria-label="textless-control" style={{position:'absolute',right:500,bottom:300,width:90,height:60,background:'black'}} /><span style={{position:'absolute',right:510,bottom:320}}>chrome-collision</span><i aria-label="painted-panel" style={{position:'absolute',right:100,bottom:300,width:90,height:60,background:'black'}} /><span style={{position:'absolute',right:110,bottom:320}}>panel-collision</span><button aria-label="own-label-control" style={{position:'absolute',right:500,bottom:200,width:140,height:60}}>self-label</button><span data-presentation-allow-overlap="" style={{position:'absolute',right:300,bottom:300}}><button aria-label="allowed-chrome" style={{position:'absolute',width:90,height:60}} /><span>allowed-chrome-label</span></span></>} /></> }
`)
    const output = success(command(directory, ['npm', 'run', 'inspect', '--', 'fixture']))
    expect(output).toContain('ADVISORY step 0: overlap: collision-a / collision-b')
    expect(output).toContain('ADVISORY step 1: overlap: collision-a / collision-b')
    expect(output).not.toContain('overlap: allowed')
    expect(output).not.toContain('overlap: flow-parent')
    expect(output).toContain('overlap: chrome-collision / textless-control')
    expect(output).toContain('overlap: panel-collision / painted-panel')
    expect(output).not.toContain('overlap: self-label / own-label-control')
    expect(output).not.toContain('overlap: allowed-chrome')
    expect(output).toContain('indistinct active progress chrome')
    expect(output).toContain('indistinct active toc chrome')
    expect(output).toContain('style [data-presentation-attribution] a')
    expect(output).toContain('PASS capture: 2 settled screenshots')
    const artifact = join(directory, 'artifacts/inspection/fixture/1440x900')
    expect((await readdir(artifact)).filter(f => f.endsWith('.png'))).toEqual(['step-01.png', 'step-02.png'])
    for (const name of ['step-01.png', 'step-02.png']) expect((await readFile(join(artifact, name))).subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a')
    const report = JSON.parse(await readFile(join(artifact, 'report.json'), 'utf8'))
    expect(report.map(r => r.index)).toEqual([0,1])
    expect(report[1].capturedAt - report[0].capturedAt).toBeGreaterThanOrEqual(800)
    expect(report.every(r => r.settleMs === 800)).toBe(true)
    assertCleaned(output)
    console.log(output)
  } finally { await remove(directory) }
})
