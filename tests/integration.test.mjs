import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { materialize } from '../skills/presentation/scripts/materialize.mjs'

const root = resolve(import.meta.dirname, '..')
const work = await mkdtemp(join(tmpdir(), 'and-scene-tests-'))
after(() => rm(work, { recursive: true, force: true }))

async function command(cwd, args, { fail = false, timeout = 180000 } = {}) {
  const log = await new Promise((accept, reject) => {
    const child = spawn(args[0], args.slice(1), { cwd, env: process.env, stdio: ['ignore','pipe','pipe'] })
    let output = ''
    child.stdout.on('data', c => { output += c }); child.stderr.on('data', c => { output += c })
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`timeout ${args.join(' ')}\n${output}`)) }, timeout)
    child.on('error', reject)
    child.on('exit', code => { clearTimeout(timer); accept({ code, output }) })
  })
  console.log(`COMMAND ${args.join(' ')} cwd=${cwd}\n${log.output}`)
  if (fail) assert.notEqual(log.code, 0, 'fault must exit non-zero')
  else assert.equal(log.code, 0, log.output)
  return log.output
}
async function copyProject(name) {
  const dest = join(work, name); await mkdir(dest)
  for (const path of ['src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','index.html','public','verification.config.json']) await cp(join(root,path), join(dest,path), { recursive:true })
  await symlink(join(root,'node_modules'),join(dest,'node_modules'),'dir')
  return dest
}
async function compareTrees(a,b) {
  const files = await readdir(a,{recursive:true,withFileTypes:true})
  for (const item of files) if (item.isFile()) {
    const rel = join(item.parentPath.slice(a.length),item.name)
    assert.equal(await readFile(join(a,rel),'utf8'), await readFile(join(b,rel),'utf8'), rel)
  }
}
function assertCleanup(output) {
  const launched = [...output.matchAll(/PREVIEW pid=(\d+)/g)].map(m=>m[1])
  for (const pid of launched) {
    assert.ok(output.includes(`CLEANUP preview pid=${pid}`))
    assert.throws(() => process.kill(Number(pid),0), /ESRCH/)
  }
}
test('INT-001 materialized bootstrap builds renders and preserves canonical contracts', { timeout: 240000 }, async () => {
  const app = join(work,'bootstrap')
  try {
    // Invoke from outside the source checkout; materializer resolves its template via import.meta.url.
    await command(work,[process.execPath,join(root,'skills/presentation/scripts/materialize.mjs'),app])
    await assert.rejects(materialize(app), /non-empty/)
    const pkg=JSON.parse(await readFile(join(app,'package.json'),'utf8'))
    for (const name of ['react','react-dom','motion','lucide-react','vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright']) assert.ok(pkg.dependencies?.[name] || pkg.devDependencies?.[name],name)
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    await compareTrees(join(root,'src/presentation-kit'),join(app,'src/presentation-kit'))
    for (const file of ['verify.mjs','browser-runtime.mjs','inspect-presentation.mjs','diagnostics.mjs']) assert.equal(await readFile(join(root,'scripts',file),'utf8'),await readFile(join(app,'scripts',file),'utf8'))
    const kitFiles=await readdir(join(app,'src/presentation-kit'),{recursive:true})
    for (const file of kitFiles.filter(f=>/\.(tsx?|css)$/.test(f))) {
      const source=await readFile(join(app,'src/presentation-kit',file),'utf8')
      assert.ok(!/#[0-9a-f]{3,8}\b|fontFamily|boxShadow|borderRadius|tailwind|--color-|--font-/.test(source),file)
    }
    await command(app,['npm','ci','--no-audit','--no-fund'])
    await command(app,['npm','run','lint'])
    const log=await command(work,['npm','--prefix',app,'run','verify'])
    assert.match(log,/PASS render step 1/); assert.match(log,/PASS verification/); assertCleanup(log)
    assert.equal(await readFile(join(app,'src/index.css'),'utf8'),'body { margin: 0; }\n')
  } finally { await rm(app,{recursive:true,force:true}) }
})
test('INT-002 settled screenshots and real browser advisory diagnostics', { timeout: 180000 }, async () => {
  const app=await copyProject('diagnostics')
  try {
    const dir=join(app,'src/presentations/diagnostics'); await mkdir(dir)
    await writeFile(join(dir,'Talk.tsx'),`import { useState } from 'react'
export default function Talk() {
 const [step, setStep] = useState(0)
 window.onkeydown = e => { if(e.key === 'ArrowRight') setStep(n => Math.min(2,n+1)) }
 return <main style={{height:'100vh'}} data-presentation="" data-step-count="3" data-step-index={step}>
 <div data-presentation-allow-overlap="" style={{position:'absolute',left:10,top:10}}><span id="allowed-a" style={{position:'absolute'}}>allowed first</span><span id="allowed-b" style={{position:'absolute'}}>allowed second</span></div>
 <div style={{display:'none'}}><span>hidden first</span><span>hidden second</span></div>
 <div style={{position:'absolute',left:100,top:100}}><span id="collision-a" style={{position:'absolute',whiteSpace:'nowrap'}}>accidental first</span><span id="collision-b" style={{position:'absolute',whiteSpace:'nowrap'}}>accidental second</span></div>
 <nav style={{position:'absolute',top:300}}>{[0,1,2].map(i=><button key={i} data-presentation-progress-step="" data-presentation-active={step===i?'true':'false'}>{i}</button>)}</nav>
 <nav style={{position:'absolute',top:350}}>{[0,1,2].map(i=><button key={i} data-presentation-toc-entry="" data-presentation-active={step===i?'true':'false'}>{i}</button>)}</nav>
 {step!==2 && <a data-presentation-attribution="" href="https://example.com" style={{position:'absolute',top:400,fontSize:step===0?8:16}}>made by and-scene</a>}
 </main>
}`)
    await writeFile(join(app,'src/presentations/index.ts'),`import type { ComponentType } from 'react'
export interface PresentationEntry { slug:string; title:string; load:()=>Promise<{default:ComponentType}> }
export const presentations:PresentationEntry[]=[{slug:'diagnostics',title:'Diagnostics',load:()=>import('./diagnostics/Talk')}]
`)
    const log=await command(app,['npm','run','inspect','--','diagnostics','--settle','900'])
    assertCleanup(log)
    const directory=join(app,'artifacts/inspection/diagnostics/1440x900')
    const report=JSON.parse(await readFile(join(directory,'report.json'),'utf8'))
    assert.equal(report.length,3)
    for (let i=0;i<3;i++) {
      assert.equal(report[i].index,i); assert.equal(report[i].file,`step-0${i+1}.png`)
      assert.ok(report[i].elapsedBeforeCapture>=900)
      const bytes=await readFile(join(directory,report[i].file)); assert.equal(bytes.subarray(1,4).toString(),'PNG')
      assert.ok(report[i].warnings.some(w=>w.includes('accidental first')&&w.includes('accidental second')))
      assert.ok(!report[i].warnings.some(w=>w.includes('allowed first')||w.includes('allowed second')||w.includes('hidden first')||w.includes('hidden second')))
      assert.ok(report[i].warnings.some(w=>w.includes('indistinct active navigation: progress-step')))
      assert.ok(report[i].warnings.some(w=>w.includes('indistinct active navigation: toc-entry')))
      assert.ok(report[i].warnings.some(w=>w.includes('attribution')))
      assert.match(log,new RegExp('ADVISORY step '+i+':'))
    }
    assert.match(log,/warnings are advisory/)
  } finally { await rm(app,{recursive:true,force:true}) }
})
test('E2E-001 reference passes whole application production verification', { timeout: 180000 }, async () => {
  const app=await copyProject('reference')
  try {
    const log=await command(app,['npm','run','verify'])
    for(let i=0;i<9;i++) assert.match(log,new RegExp('PASS render step '+i))
    assert.match(log,/PHASE build/); assert.match(log,/host=127\.0\.0\.1 probe=http:\/\/127\.0\.0\.1:/)
    assert.match(log,/PHASE sample: route http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    assert.match(log,/PASS verification: build, sample, render/); assertCleanup(log)
  } finally { await rm(app,{recursive:true,force:true}) }
})
test('E2E-002 build sample console page and transition faults fail actionably and clean preview', { timeout: 420000 }, async t => {
  for (const fault of ['build','missing','out-of-order','console','page','transition']) await t.test(fault, async () => {
    const app=await copyProject('fault-'+fault)
    try {
      if(fault==='build') await writeFile(join(app,'src/presentations/how-to-make-a-presentation/steps/01.tsx'),'this is invalid TypeScript')
      if(fault==='missing') await writeFile(join(app,'src/presentations/index.ts'),`import type { ComponentType } from 'react'\nexport interface PresentationEntry { slug:string;title:string;load:()=>Promise<{default:ComponentType}> }\nexport const presentations: PresentationEntry[]=[]\n`)
      if(fault==='out-of-order') {
        const path=join(app,'src/presentations/how-to-make-a-presentation/steps/index.ts')
        await writeFile(path,(await readFile(path,'utf8')).replace('[step1, step2,','[step2, step1,'))
      }
      if(['console','page'].includes(fault)) {
        const path=join(app,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
        const source=await readFile(path,'utf8')
        await writeFile(path,`import { useEffect } from 'react'\n`+source.replace('  return <SceneLayer',`  useEffect(() => { if (beat === 2) { ${fault==='console' ? "console.error('injected console fault')" : "throw new Error('injected page fault')"} } }, [beat])\n  return <SceneLayer`))
      }
      if(fault==='transition') {
        const path=join(app,'src/presentation-kit/usePresentationNav.ts')
        await writeFile(path,(await readFile(path,'utf8')).replace('clampIndex(n + 1, count)','clampIndex(n, count)'))
      }
      const log=await command(app,['npm','run','verify'],{fail:true})
      assert.match(log,/FAIL /); assert.ok(!log.includes('PASS verification:'))
      if(fault==='build') assert.match(log,/FAIL build/)
      else if(['missing','out-of-order'].includes(fault)) assert.match(log,/FAIL sample/)
      else assert.match(log,/FAIL render step 1/)
      if(fault==='console') assert.match(log,/injected console fault/)
      assertCleanup(log)
    } finally { await rm(app,{recursive:true,force:true}) }
  })
})
