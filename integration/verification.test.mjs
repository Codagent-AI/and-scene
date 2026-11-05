import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, cpSync, symlinkSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
const root=resolve('.')
function copyProject() { const dir=mkdtempSync(join(tmpdir(),'and-scene-e2e-')); cpSync(root,dir,{recursive:true,filter:p=>!['node_modules','.git','dist','artifacts'].includes(p.slice(root.length+1).split('/')[0])}); symlinkSync(join(root,'node_modules'),join(dir,'node_modules'),'dir'); return dir }
function run(dir, command, args) { return spawnSync(command,args,{cwd:dir,encoding:'utf8',timeout:180000}) }
function mutate(dir,file,fn) { const path=join(dir,file); writeFileSync(path,fn(readFileSync(path,'utf8'))) }
test('E2E-001 reference passes production verification',()=>{ const r=run(root,'npm',['run','verify']); assert.equal(r.status,0,r.stdout+r.stderr); assert.match(r.stdout,/PASS.*9-step/) })
test('E2E-002 faults fail with actionable phase and step',async()=>{
 const faults=[
  ['build','src/main.tsx',s=>s+'\nthis is invalid TypeScript !\n',/FAIL.*build/s],
  ['sample','src/presentations/how-to-make-a-presentation/steps/index.tsx',s=>s.replace('You have a topic','wrong title'),/FAIL.*step 0/s],
  ['missing','src/presentations/index.ts',s=>s.replace('how-to-make-a-presentation', 'missing-route'),/FAIL.*step 0/s],
  ['exception','src/presentations/how-to-make-a-presentation/steps/index.tsx',s=>s.replace('function Scene({payload: n}: SceneProps<number>) {',"function Scene({payload: n}: SceneProps<number>) { throw new Error('injected exception');"),/FAIL.*step 0/s],
  ['runtime','src/presentations/how-to-make-a-presentation/steps/index.tsx',s=>s.replace('function Scene({payload: n}: SceneProps<number>) {',"function Scene({payload: n}: SceneProps<number>) { if (n === 2) setTimeout(() => console.error('injected error'), 300)"),/FAIL.*step 2.*injected error/s],
  ['transition','src/presentation-kit/usePresentationNav.ts',s=>s.replace('clamp(i + 1, count)','clamp(i, count)'),/FAIL.*step 1.*advance/s],
 ]
 for(const [name,file,change,expected] of faults) { const dir=copyProject(); try { mutate(dir,file,change); const r=run(dir,'npm',['run','verify']); assert.notEqual(r.status,0,`${name} unexpectedly passed`); assert.match(r.stdout+r.stderr,expected,name); const probe=createServer(); await new Promise((resolve,reject)=>probe.once('error',reject).listen(4173,'127.0.0.1',resolve)); await new Promise(resolve=>probe.close(resolve)) } finally { rmSync(dir,{recursive:true,force:true}) } }
})
