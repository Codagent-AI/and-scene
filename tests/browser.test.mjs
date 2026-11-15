import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdir, readFile, writeFile, rm, readdir, symlink, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { materialize, templateRoot } from '../skills/presentation/scripts/materialize.mjs'
import { record } from './evidence.mjs'
import { inspect } from '../scripts/inspect-presentation.mjs'
const root = resolve(import.meta.dirname, '..')
const work = join(root,'.test-work')
await mkdir(work,{recursive:true})
const evidence = process.env.EVIDENCE_DIR
async function run(args,cwd=root) {
  return new Promise((ok,fail) => {
    const p=spawn(args[0],args.slice(1),{cwd,env:process.env});let output=''
    p.stdout.on('data',b=>{output+=b});p.stderr.on('data',b=>{output+=b})
    p.once('error',fail);p.once('close',code=>ok({code,output}))
  })
}
async function logged(name,args,cwd=root) {
  const result=await run(args,cwd)
  if(evidence) await writeFile(join(evidence,`${name}.log`),`Command: ${args.join(' ')}\nCwd: ${cwd}\n${result.output}\nExit: ${result.code}\n`)
  return result
}
async function copyApp(name) {
  const dir=join(work,name);await rm(dir,{recursive:true,force:true});await mkdir(dir,{recursive:true})
  for(const file of ['src','scripts','package.json','index.html','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','eslint.config.js']) await cp(join(root,file),join(dir,file),{recursive:true})
  await symlink(join(root,'node_modules'),join(dir,'node_modules'),'dir')
  return dir
}
async function bytes(dir,prefix='') {
  const found={}
  for(const f of await readdir(dir,{withFileTypes:true})) {
    const rel=join(prefix,f.name)
    if(f.isDirectory()) Object.assign(found,await bytes(join(dir,f.name),rel))
    else found[rel]=(await readFile(join(dir,f.name))).toString('base64')
  }
  return found
}
after(async()=>{await rm(work,{recursive:true,force:true})})
test('INT-001 materialized bootstrap is complete style-neutral and independent of caller cwd', {timeout:180000}, async()=>{
  const dir=join(work,'bootstrap');await mkdir(dir,{recursive:true})
  const materialized=await logged('INT-001-materialize',[process.execPath,join(root,'skills/presentation/scripts/materialize.mjs'),dir],work)
  assert.equal(materialized.code,0,materialized.output)
  const before=await readFile(join(dir,'src/main.tsx'),'utf8')
  await assert.rejects(materialize(dir),/Refusing to overwrite/)
  assert.equal(await readFile(join(dir,'src/main.tsx'),'utf8'),before)
  const install=await logged('INT-001-install',['npm','ci','--no-audit','--no-fund'],dir);assert.equal(install.code,0,install.output)
  const verify=await logged('INT-001-verify',['npm','run','verify','--','example'],dir);assert.equal(verify.code,0,verify.output)
  assert.match(verify.output,/step 0: rendered/);assert.match(verify.output,/step 1: rendered/)
  assert.deepEqual(await bytes(join(root,'src/presentation-kit')),await bytes(join(templateRoot,'src/presentation-kit')))
  for(const name of ['verify.mjs','inspect-presentation.mjs','browser.mjs','diagnostics.mjs','sample-validation.mjs','reference.json']) assert.equal(await readFile(join(root,'scripts',name),'utf8'),await readFile(join(templateRoot,'scripts',name),'utf8'))
  const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'))
  for(const name of ['react','react-dom','motion','lucide-react','vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','globals','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','playwright']) assert.ok({...pkg.dependencies,...pkg.devDependencies}[name],name)
  assert.doesNotMatch(JSON.stringify(pkg),/tailwind/i)
  const kit=await bytes(join(dir,'src/presentation-kit'))
  for(const encoded of Object.values(kit)) assert.doesNotMatch(Buffer.from(encoded,'base64').toString(),/#[0-9a-f]{3,8}\b|fontFamily:|boxShadow:|borderRadius:|backgroundColor:/i)
  assert.equal(await readFile(join(dir,'src/index.css'),'utf8'),'body { margin: 0; }\n')
  if(evidence) await writeFile(join(evidence,'INT-001-contracts.log'),'INT-001: all three anchors built and example route rendered; complete dependency set; no styling framework/default kit visual tokens; non-test kit bytes and all verification/inspection script bytes match; overwrite refusal preserved existing files.\n')
  await record([9,26,27,28,31,51], '`skills/presentation/`; `src/presentation-kit/`; `tests/browser.test.mjs`', '`INT-001-contracts.log`, `INT-001-materialize.log`, `INT-001-install.log`, `INT-001-verify.log` — INT-001 materialized bootstrap contract assertions passed; see each row inspection log for procedural checks.')
})
test('INT-002 screenshot helper emits settled artifacts and advisory diagnostics', {timeout:120000}, async()=>{
  const dir=await copyApp('inspection')
  await mkdir(join(dir,'src/presentations/diagnostics'),{recursive:true})
  await writeFile(join(dir,'src/presentations/index.ts'),`import type { ComponentType } from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{default: ComponentType}> }\nexport const presentations: PresentationEntry[] = [{slug:'diagnostics',title:'Diagnostics',load:()=>import('./diagnostics/Talk')}]\n`)
  await writeFile(join(dir,'src/presentations/diagnostics/Talk.tsx'),`import { useEffect, useState } from 'react'
import { Presentation } from '../../presentation-kit/Presentation'
function Scene({payload}:{payload:number}) {
 const [ready,setReady]=useState(false)
 useEffect(()=>{setReady(false);const timer=setTimeout(()=>setReady(true),650);return()=>clearTimeout(timer)},[payload])
 return <>{ready && <><span style={{position:'absolute',left:50,top:50}}>collision-alpha</span><span style={{position:'absolute',left:50,top:50}}>collision-beta</span><div data-presentation-allow-overlap style={{position:'absolute',left:300,top:50}}><span style={{position:'absolute'}}>allowed-alpha</span><span style={{position:'absolute'}}>allowed-beta</span></div></>}</>
}
const steps=[0,1,2].map(i=>({id:'s'+i,era:i===0?'one':'two',title:'Step '+i,caption:'Caption '+i,Scene,payload:i}))
export default function Talk(){return <div style={{fontFamily:'sans-serif'}}><Presentation steps={steps} title="Diagnostics" attribution={ <a data-presentation-attribution href="https://example.org" style={{fontSize:9}}>made by and-scene</a> } /></div>}
`)
  const build=await logged('INT-002-build',['npm','run','build'],dir);assert.equal(build.code,0,build.output)
  const warnings=[];const original=console.warn;console.warn=(message)=>{warnings.push(message);original(message)}
  const start=Date.now();let captures
  try{ captures=await inspect({cwd:dir,slug:'diagnostics',build:false,settleMs:1000}) }finally{console.warn=original}
  assert.equal(captures.length,3);assert.ok(Date.now()-start>=3000)
  for(const capture of captures) {
    assert.ok((await stat(capture.file)).size>1000);assert.match(capture.file,/artifacts\/inspection\/diagnostics\/1440x900\/step-0[123]\.png$/)
    assert.ok(capture.warnings.some(w=>w.includes('collision-alpha')&&w.includes('collision-beta')))
    assert.ok(capture.warnings.some(w=>w.includes('indistinct active chrome: data-presentation-progress-step')))
    assert.ok(capture.warnings.some(w=>w.includes('indistinct active chrome: data-presentation-toc-entry')))
    assert.ok(capture.warnings.some(w=>w.includes('unpolished attribution')))
    assert.ok(capture.warnings.every(w=>!w.includes('allowed-alpha')&&!w.includes('allowed-beta')))
  }
  assert.ok(warnings.every(w=>/advisory step [012]:/.test(w)))
  if(evidence) await writeFile(join(evidence,'INT-002.log'),`INT-002: three non-empty predictable PNGs, delayed visible collisions detected after settling, allowed overlap exempt, progress/ToC and undersized attribution advisory warnings; capture resolves successfully despite warnings.\n${warnings.join('\n')}\n`)
  await record([35,46,47,48,49,50], '`scripts/inspect-presentation.mjs`; `scripts/diagnostics.mjs`; `tests/browser.test.mjs`', '`INT-002.log`, `INT-002-build.log` — INT-002 settled capture and advisory diagnostics assertions passed; diagnostic unit tests are named in unit-final.log; I-35 procedure inspection in I-35-inspection.log.')
})
test('E2E-001 reference presentation passes production verification', {timeout:120000},async()=>{
  const result=await logged('E2E-001',['npm','run','verify']);assert.equal(result.code,0,result.output)
  assert.match(result.output,/preview http:\/\/127\.0\.0\.1:/)
  for(let i=0;i<9;i++) assert.match(result.output,new RegExp(`step ${i}: rendered`))
  assert.match(result.output,/PASS: build \+ sample \+ render/);assert.match(result.output,/preview stopped/)
  await record([38,39,42,43], '`scripts/verify.mjs`; `scripts/browser.mjs`; `src/presentations/how-to-make-a-presentation/`; `tests/browser.test.mjs`', '`E2E-001.log` — E2E-001 npm run verify: build, ordered normative metadata, registered route, IPv4 preview, all nine indices and PASS exit asserted. Sample composition inspection: I-39-inspection.log.')
})
test('E2E-002 verification faults report failure phase step and clean preview processes', {timeout:240000}, async t=>{
  const faults=[
    ['build',async d=>writeFile(join(d,'src/main.tsx'),'invalid typescript'),/FAIL \[build\]/],
    ['missing',async d=>{const p=join(d,'src/presentations/index.ts');await writeFile(p,`import type {ComponentType} from 'react';export interface PresentationEntry {slug:string;title:string;load:()=>Promise<{default:ComponentType}>};export const presentations:PresentationEntry[]=[]`)},/FAIL \[render\]/],
    ['order',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/outline.json');const o=JSON.parse(await readFile(p,'utf8'));[o[0],o[1]]=[o[1],o[0]];await writeFile(p,JSON.stringify(o))},/step 0:.*incorrect id/],
    ['console',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/steps/Story.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('const pieces:',`if (beat === 3) console.error('injected console failure')\n  const pieces:`))},/step 2: console: injected console failure/],
    ['first-page',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/steps/Story.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('const pieces:',`if (beat === 1) throw new Error('injected initial render failure')\n  const pieces:`))},/step 0: page: injected initial render failure/],
    ['page',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/steps/Story.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('const pieces:',`if (beat === 3) throw new Error('injected render failure')\n  const pieces:`))},/step 2: page: injected render failure/],
    ['transition',async d=>{const p=join(d,'src/presentation-kit/Presentation.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('data-step-index={nav.index}','data-step-index={0}'))},/step 1:/],
  ]
  const selected = process.env.VERIFY_FAULTS ? faults.filter(([name])=>process.env.VERIFY_FAULTS.split(',').includes(name)) : faults
  let passed = 0
  for(const [name,inject,expected] of selected) await t.test(name,async()=>{
    const dir=await copyApp(`fault-${name}`);await inject(dir)
    const result=await logged(`E2E-002-${name}`,['npm','run','verify'],dir)
    assert.notEqual(result.code,0,result.output);assert.match(result.output,expected);assert.doesNotMatch(result.output,/PASS: build/)
    const port=result.output.match(/preview http:\/\/127\.0\.0\.1:(\d+)/)?.[1]
    if(port) {
      assert.match(result.output,/preview stopped/)
      await delay(30);await assert.rejects(fetch(`http://127.0.0.1:${port}`))
    }
    passed++
  })
  assert.equal(passed, selected.length, 'all selected fault checks passed')
  if (!process.env.VERIFY_FAULTS) await record([33,38,41,44,45], '`scripts/verify.mjs`; `scripts/browser.mjs`; `tests/browser.test.mjs`', '`E2E-002-build.log`, `E2E-002-missing.log`, `E2E-002-order.log`, `E2E-002-console.log`, `E2E-002-page.log`, `E2E-002-transition.log` — E2E-002 named fault subtests assert nonzero failure phase/step and server cleanup; E2E-001.log proves success. I-33 procedure inspected in I-33-inspection.log.')
})
