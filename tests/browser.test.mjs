import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdir, readFile, writeFile, rm, readdir, symlink, stat, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { createConnection } from 'node:net'
import { resolve, join, sep } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { materialize, templateRoot } from '../skills/presentation/scripts/materialize.mjs'
import { record } from './evidence.mjs'
import { inspect } from '../scripts/inspect-presentation.mjs'
const root = resolve(import.meta.dirname, '..')
const work = join(root,'.test-work')
await mkdir(work,{recursive:true})
const evidence = process.env.EVIDENCE_DIR
const prefix = process.env.EVIDENCE_PREFIX || ''
const logFile = name => `${prefix}${name}.log`
const refs = names => names.map(name => '`' + logFile(name) + '`').join(', ')
async function run(args,cwd=root) {
  return new Promise((ok,fail) => {
    const p=spawn(args[0],args.slice(1),{cwd,env:process.env});let output=''
    p.stdout.on('data',b=>{output+=b});p.stderr.on('data',b=>{output+=b})
    p.once('error',fail);p.once('close',code=>ok({code,output}))
  })
}
async function logged(name,args,cwd=root) {
  const result=await run(args,cwd)
  if(evidence) await writeFile(join(evidence,logFile(name)),`Command: ${args.join(' ')}\nCwd: ${cwd}\n${result.output}\nExit: ${result.code}\n`)
  return result
}
async function assertResourcesClosed(name, result, launched = true) {
  const previews = [...result.output.matchAll(/^preview resource (.+)$/gm)].map(match => JSON.parse(match[1]))
  const browsers = [...result.output.matchAll(/^browser resources (.+)$/gm)].flatMap(match => JSON.parse(match[1]))
  if (!launched) { assert.equal(previews.length, 0); assert.equal(browsers.length, 0); return }
  assert.equal(previews.length, 1, result.output)
  assert.ok(browsers.length > 1, 'actual Chromium browser and child process IDs were observed')
  assert.match(result.output, /preview http:\/\/127\.0\.0\.1:/, 'preview reached readiness')
  const pids = [...new Set([...previews.map(item => item.pid), ...browsers])]
  async function live(pid) {
    try {
      process.kill(pid, 0)
      // An exited orphan zombie holds no browser resources; the OS reaps it separately.
      if (process.platform === 'linux') {
        const state = await readFile(`/proc/${pid}/stat`, 'utf8')
        if (state.slice(state.lastIndexOf(')') + 2, state.lastIndexOf(')') + 3) === 'Z') return false
      }
      return true
    } catch (error) { if (error.code === 'ESRCH' || error.code === 'ENOENT') return false; throw error }
  }
  for (const pid of pids) {
    for (let attempt = 0; attempt < 50 && await live(pid); attempt++) await delay(20)
    assert.equal(await live(pid), false, `resource process ${pid} must exit`)
  }
  for (const { port } of previews) await new Promise((ok, fail) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => { socket.destroy(); fail(new Error(`preview port ${port} remains open`)) })
    socket.once('error', error => error.code === 'ECONNREFUSED' ? ok() : fail(error))
    socket.setTimeout(1000, () => { socket.destroy(); fail(new Error(`preview port ${port} did not refuse connection`)) })
  })
  if (evidence) await writeFile(join(evidence, logFile(`${name}-cleanup`)), `Asserted real process IDs no longer live: ${pids.join(', ')}. Preview ports refused TCP connections: ${previews.map(item => item.port).join(', ')}. Readiness and observed Chromium process IDs were mandatory.\n`)
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
  const external = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  const dir=join(external,'app'), caller=join(external,'caller');await mkdir(caller,{recursive:true})
  assert.ok(!external.startsWith(root + sep) && external !== root)
  try {
  const materialized=await logged('INT-001-materialize',[process.execPath,join(root,'skills/presentation/scripts/materialize.mjs'),dir],caller)
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
  if(evidence) await writeFile(join(evidence,logFile('INT-001-contracts')),`INT-001: external app ${dir}, external caller ${caller}; all three anchors built and example route rendered; complete dependency set; no styling framework/default kit visual tokens; non-test kit bytes and all verification/inspection script bytes match; overwrite refusal preserved existing files.\n`)
  await assertResourcesClosed('INT-001', verify)
  await record([9,26,27,28,31,51], '`skills/presentation/`; `src/presentation-kit/`; `tests/browser.test.mjs`', refs(['INT-001-contracts','INT-001-materialize','INT-001-install','INT-001-verify','INT-001-cleanup']) + ' — INT-001 external app and caller; dependency/build/route/style-neutrality/parity/overwrite-refusal and actual process cleanup assertions passed. Procedural source inspections remain in I-9/26/27/28/31-inspection.log.')
  } finally { await rm(external,{recursive:true,force:true}) }
})
test('INT-002 screenshot helper emits settled artifacts and advisory diagnostics', {timeout:120000}, async()=>{
  const dir=await copyApp('inspection')
  await mkdir(join(dir,'src/presentations/diagnostics'),{recursive:true})
  await writeFile(join(dir,'src/presentations/index.ts'),`import type { ComponentType } from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{default: ComponentType}> }\nexport const presentations: PresentationEntry[] = [{slug:'diagnostics',title:'Diagnostics',load:()=>import('./diagnostics/Talk')}]\n`)
  await writeFile(join(dir,'src/presentations/diagnostics/Talk.tsx'),`import { useEffect, useState } from 'react'
import { Presentation } from '../../presentation-kit/Presentation'
function Scene({payload}:{payload:number}) {
 const [ready,setReady]=useState(false)
 useEffect(()=>{setReady(false);const timer=setTimeout(()=>{ const a=document.querySelector('[data-presentation-attribution]') as HTMLElement; if(a) { if(payload===1){a.style.fontFamily='Times New Roman';a.style.fontSize='16px'} if(payload===2) a.remove() } setReady(true) },650);return()=>clearTimeout(timer)},[payload])
 return <>{ready && <><p style={{position:'absolute',left:80,top:120,margin:0}} data-presentation-caption>chrome-caption</p><button aria-label="icon-caption-collision" data-presentation-prev style={{position:'absolute',left:80,top:120,width:40,height:24}}><svg/></button><button aria-label="icon-pair-one" data-presentation-next style={{position:'absolute',left:450,top:120,width:40,height:24}}><svg/></button><button aria-label="icon-pair-two" data-presentation-mode-toggle style={{position:'absolute',left:450,top:120,width:40,height:24}}><svg/></button><div data-presentation-allow-overlap><button aria-label="allowed-icon-one" data-presentation-next style={{position:'absolute',left:650,top:120,width:40,height:24}}/><button aria-label="allowed-icon-two" data-presentation-prev style={{position:'absolute',left:650,top:120,width:40,height:24}}/></div><span style={{position:'absolute',left:50,top:50}}>collision-alpha</span><span style={{position:'absolute',left:50,top:50}}>collision-beta</span><div data-presentation-allow-overlap style={{position:'absolute',left:300,top:50}}><span style={{position:'absolute'}}>allowed-alpha</span><span style={{position:'absolute'}}>allowed-beta</span></div></>}</>
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
    assert.ok(capture.warnings.some(w=>w.includes(capture.index === 2 ? 'missing attribution' : 'unpolished attribution')))
    assert.ok(capture.warnings.some(w=>w.includes('chrome-caption')&&w.includes('icon-caption-collision')))
    assert.ok(capture.warnings.some(w=>w.includes('icon-pair-one')&&w.includes('icon-pair-two')))
    assert.ok(capture.warnings.every(w=>!w.includes('allowed-icon')))
    assert.ok(capture.warnings.every(w=>!w.includes('allowed-alpha')&&!w.includes('allowed-beta')))
  }
  assert.ok(warnings.every(w=>/advisory step [012]:/.test(w)))
  if(evidence) await writeFile(join(evidence,logFile('INT-002')),`INT-002: three non-empty predictable PNGs, delayed visible collisions detected after settling, allowed overlap exempt, progress/ToC warnings, icon-only caption/control collisions, and undersized (step0), browser-default (step1), missing (step2) attribution advisory warnings; capture resolves successfully despite warnings.\n${warnings.join('\n')}\n`)
  await record([35,46,47,48,49,50], '`scripts/inspect-presentation.mjs`; `scripts/diagnostics.mjs`; `tests/browser.test.mjs`', refs(['INT-002','INT-002-build']) + ' — INT-002 settled capture; text, icon/caption and icon/control collision detection; subtree exemptions; active chrome; undersized/default/missing attribution variants passed. Unit tests: `resolve-I-47.log` named I-47 collisions and icon-only chrome; `resolve-I-48.log` named I-48 indistinct states; `resolve-I-49.log` named I-49 attribution missing default undersized and polished classifications. Skill helper procedure: I-35-inspection.log.')
})
test('E2E-001 reference presentation passes production verification', {timeout:120000},async()=>{
  const result=await logged('E2E-001',['npm','run','verify']);assert.equal(result.code,0,result.output)
  assert.match(result.output,/preview http:\/\/127\.0\.0\.1:/)
  for(let i=0;i<9;i++) assert.match(result.output,new RegExp(`step ${i}: rendered`))
  assert.match(result.output,/PASS: build \+ sample \+ render/);assert.match(result.output,/preview stopped/)
  await assertResourcesClosed('E2E-001', result)
  const presentDir = await copyApp('present-mode')
  const talk = join(presentDir, 'src/presentations/how-to-make-a-presentation/Talk.tsx')
  await writeFile(talk, (await readFile(talk, 'utf8')).replace('initialMode="browse"', 'initialMode="present"'))
  for (const [name, args] of [
    ['E2E-001-present-slug', ['npm','run','verify','--','how-to-make-a-presentation']],
    ['E2E-001-present-canonical', ['npm','run','verify']],
  ]) {
    const present = await logged(name, args, presentDir)
    assert.equal(present.code, 0, present.output)
    for (let index=0;index<9;index++) assert.match(present.output,new RegExp(`step ${index}: rendered`))
    assert.match(present.output,/PASS: build/)
    await assertResourcesClosed(name, present)
  }
  await record([39,42,43], '`scripts/verify.mjs`; `scripts/browser.mjs`; `src/presentations/how-to-make-a-presentation/`; `tests/browser.test.mjs`', refs(['E2E-001','E2E-001-cleanup','E2E-001-present-slug','E2E-001-present-slug-cleanup','E2E-001-present-canonical','E2E-001-present-canonical-cleanup']) + ' — E2E-001 npm run verify: whole build, ordered canonical metadata, route, IPv4 preview and all nine indices passed, including generic-slug and canonical verification of an initially-present presentation; Chromium process and preview PID/port cleanup asserted. Build failure will be recorded by E2E-002. Composition source: I-34-reinspection.log.')
})
test('E2E-002 verification faults report failure phase step and clean preview processes', {timeout:240000}, async t=>{
  const faults=[
    ['build',async d=>writeFile(join(d,'src/main.tsx'),'invalid typescript'),/FAIL \[build\]/],
    ['missing',async d=>{const p=join(d,'src/presentations/index.ts');await writeFile(p,`import type {ComponentType} from 'react';export interface PresentationEntry {slug:string;title:string;load:()=>Promise<{default:ComponentType}>};export const presentations:PresentationEntry[]=[]`)},/step 0: missing presentation route:/],
    ['order',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/outline.json');const o=JSON.parse(await readFile(p,'utf8'));[o[0],o[1]]=[o[1],o[0]];await writeFile(p,JSON.stringify(o))},/step 0:.*incorrect id/],
    ['present-console',async d=>{const talk=join(d,'src/presentations/how-to-make-a-presentation/Talk.tsx');await writeFile(talk,(await readFile(talk,'utf8')).replace('initialMode="browse"','initialMode="present"'));const p=join(d,'src/presentations/how-to-make-a-presentation/steps/Story.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('const pieces:',`if (beat === 1) console.error('injected present console failure')\n  const pieces:`))},/step 0: console: injected present console failure/],
    ['console',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/steps/Story.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('const pieces:',`if (beat === 3) console.error('injected console failure')\n  const pieces:`))},/step 2: console: injected console failure/],
    ['first-page',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/steps/Story.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('const pieces:',`if (beat === 1) throw new Error('injected initial render failure')\n  const pieces:`))},/step 0: page: injected initial render failure/],
    ['page',async d=>{const p=join(d,'src/presentations/how-to-make-a-presentation/steps/Story.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('const pieces:',`if (beat === 3) throw new Error('injected render failure')\n  const pieces:`))},/step 2: page: injected render failure/],
    ['transition',async d=>{const p=join(d,'src/presentation-kit/Presentation.tsx');await writeFile(p,(await readFile(p,'utf8')).replace('data-step-index={nav.index}','data-step-index={0}'))},/step 1: page.waitForFunction: Timeout/],
  ]
  const selected = process.env.VERIFY_FAULTS ? faults.filter(([name])=>process.env.VERIFY_FAULTS.split(',').includes(name)) : faults
  let passed = 0
  for(const [name,inject,expected] of selected) await t.test(name,async()=>{
    const dir=await copyApp(`fault-${name}`);await inject(dir)
    const args = name === 'present-console' ? ['npm','run','verify','--','how-to-make-a-presentation'] : ['npm','run','verify']
    const result=await logged(`E2E-002-${name}`,args,dir)
    assert.notEqual(result.code,0,result.output);assert.match(result.output,expected);assert.doesNotMatch(result.output,/PASS: build/)
    await assertResourcesClosed(`E2E-002-${name}`, result, name !== 'build')
    passed++
  })
  assert.equal(passed, selected.length, 'all selected fault checks passed')
  if (!process.env.VERIFY_FAULTS) {
    const code = '`scripts/verify.mjs`; `scripts/browser.mjs`; `tests/browser.test.mjs`'
    await record([33], code, refs(['E2E-001-present-slug','E2E-001-present-canonical','E2E-002-present-console','E2E-002-console','E2E-002-page']) + ' — E2E-001 verifies initially-present routes through slug and canonical entry paths; E2E-002 asserts exact browser failures in present/browse modes. Completion procedure inspection: `I-33-inspection.log`.')
    await record([38], code, refs(['E2E-001','E2E-002-build']) + ' — E2E-001 asserts whole-application build success; E2E-002 build subtest injects invalid TypeScript and asserts nonzero FAIL [build] before preview/browser launch.')
    await record([41], code, refs(['E2E-002-missing','E2E-002-missing-cleanup','E2E-002-order']) + ' — E2E-002 missing requires ready IPv4 preview, actual browser, and exact missing-presentation-route error; order requires incorrect id at step 0; missing Chromium/preview PID and port closure asserted. `resolve-I-41.log` named I-41 validation rejects absent/count/order/id/era/title/caption fixtures.')
    await record([44], code, refs(['E2E-002-present-console','E2E-002-console','E2E-002-first-page','E2E-002-page','E2E-002-transition']) + ' — E2E-002 exact injected console/page messages identify steps 0/2; stalled-transition subtest requires step 1 waitForFunction timeout, not an unrelated render failure. All logs generated after final traverse changes.')
    await record([45], code, refs(['E2E-001','E2E-001-cleanup',...selected.map(([name])=>`E2E-002-${name}`),...selected.filter(([name])=>name!=='build').map(([name])=>`E2E-002-${name}-cleanup`)]) + ' — E2E-001 success and all E2E-002 named faults assert exact outcomes; non-build cases mandate ready preview and observed Chromium process IDs, then assert no live observed browser/renderer/utility/preview processes and refused TCP connections. Build fault asserts no launched resources.')
  }
})
