import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, cpSync, symlinkSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
const root=resolve('.')
test('INT-002 inspection emits settled screenshots and advisory diagnostics',()=>{ const dir=mkdtempSync(join(tmpdir(),'and-scene-inspect-')); try {
 cpSync(join(root,'skills/presentation/templates/bootstrap'),dir,{recursive:true}); symlinkSync(join(root,'node_modules'),join(dir,'node_modules'),'dir')
 writeFileSync(join(dir,'src/presentations/example/Talk.tsx'),`import { Presentation, type Step, type SceneProps } from '../../presentation-kit'; import './style.css'; function Scene({payload}:SceneProps<number>) { return <><p className="collision">collision one</p><p className="collision">collision two</p><div data-presentation-allow-overlap><p className="allowed">allowed one</p><p className="allowed">allowed two</p></div><span>{payload}</span></> }; const steps:Step<number>[]=[{id:'1',era:'one',title:'One',caption:'First',Scene,payload:1,groupKey:'scene'},{id:'2',era:'two',title:'Two',caption:'Second',Scene,payload:2,groupKey:'scene'}]; export default function Talk(){return <Presentation steps={steps} title="Fixture"/>}`)
 writeFileSync(join(dir,'src/presentations/example/style.css'),'.collision {position:absolute;top:20px;left:20px}.allowed {position:absolute;top:80px;left:20px}[data-presentation-attribution]{font-size:8px}')
 const build=spawnSync('npm',['run','build'],{cwd:dir,encoding:'utf8',timeout:180000}); assert.equal(build.status,0,build.stdout+build.stderr)
 const start=Date.now(); const result=spawnSync('npm',['run','inspect','--','example'],{cwd:dir,encoding:'utf8',timeout:180000}); assert.equal(result.status,0,result.stdout+result.stderr); assert.ok(Date.now()-start>=2000); const output=result.stdout+result.stderr; assert.match(output,/Step 1: overlap: collision one \/ collision two/); assert.doesNotMatch(output,/overlap: allowed one/); assert.match(output,/indistinct active navigation/); assert.match(output,/polish \[data-presentation-attribution\]/); assert.equal(readdirSync(join(dir,'artifacts/presentations/example')).length,2)
 writeFileSync(join(dir,'src/presentations/example/style.css'), '.collision {position:absolute;top:20px;left:20px}.allowed {position:absolute;top:80px;left:20px}[data-presentation-attribution]{font-size:16px;color:rgb(0,0,238);text-decoration:underline}')
 const rebuild=spawnSync('npm',['run','build'],{cwd:dir,encoding:'utf8',timeout:180000}); assert.equal(rebuild.status,0,rebuild.stdout+rebuild.stderr)
 const defaults=spawnSync('npm',['run','inspect','--','example'],{cwd:dir,encoding:'utf8',timeout:180000}); assert.equal(defaults.status,0,defaults.stdout+defaults.stderr); assert.match(defaults.stdout+defaults.stderr,/polish \[data-presentation-attribution\]/)
 } finally { rmSync(dir,{recursive:true,force:true}) } })
