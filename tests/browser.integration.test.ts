import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, it } from 'vitest'
function copy() { const dir=mkdtempSync(join(tmpdir(),'and-scene-browser-')); for(const path of ['src','scripts','package.json','package-lock.json','index.html','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts']) cpSync(path,join(dir,path),{recursive:true}); symlinkSync(resolve('node_modules'),join(dir,'node_modules'),'dir'); return dir }
function command(dir:string,args:string[]) { return spawnSync('npm',args,{cwd:dir,encoding:'utf8',timeout:120000}) }
it('E2E-002 reports build, missing sample, browser and transition failures', () => {
 const cases = [
  {name:'build', edit:(d:string)=>writeFileSync(join(d,'src/main.tsx'),'invalid syntax !!!'), expected:/build|failed/i},
  {name:'missing', edit:(d:string)=>writeFileSync(join(d,'src/presentations/index.ts'),'export const presentations = []'), expected:/sample|failed/i},
  {name:'out-of-order', edit:(d:string)=>{const p=join(d,'src/presentations/how-to-make-a-presentation/Talk.tsx'); writeFileSync(p,readFileSync(p,'utf8').replace('You have a topic','Wrong title'))}, expected:/step 0.*metadata/i},
  {name:'era', edit:(d:string)=>{const p=join(d,'src/presentations/how-to-make-a-presentation/Talk.tsx'); writeFileSync(p,readFileSync(p,'utf8').replace("'the ask','the ask'","'wrong era','the ask'"))}, expected:/step 0.*metadata/i},
  {name:'pageerror', edit:(d:string)=>{const p=join(d,'src/presentations/how-to-make-a-presentation/Talk.tsx'); writeFileSync(p,readFileSync(p,'utf8').replace('function Scene({payload: n}',"setTimeout(() => { throw new Error('injected exception') }, 100);\nfunction Scene({payload: n}"))}, expected:/step 0.*injected exception/i},
  {name:'browser', edit:(d:string)=>{const p=join(d,'src/presentations/how-to-make-a-presentation/Talk.tsx'); writeFileSync(p,readFileSync(p,'utf8').replace('function Scene({payload: n}',"console.error('injected failure');\nfunction Scene({payload: n}"))}, expected:/step 0.*injected failure/i},
  {name:'transition', edit:(d:string)=>{const p=join(d,'src/presentation-kit/usePresentationNav.ts'); writeFileSync(p,readFileSync(p,'utf8').replace("setIndex(i => Math.min(count - 1, i + 1))","setIndex(i => i)"))}, expected:/step 1.*transition/i}
 ]
 for (const item of cases) { const dir=copy(); try { item.edit(dir); const result=command(dir,['run','verify']); const output=result.stdout+result.stderr; expect(result.status,`${item.name}: ${output}`).not.toBe(0); expect(output).toMatch(item.expected); execFileSync(process.execPath,['-e',"const s=require('node:net').createServer(); s.on('error',()=>process.exit(1)); s.listen(4173,'127.0.0.1',()=>s.close())"],{timeout:5000}) } finally { rmSync(dir,{recursive:true,force:true}) } }
},600000)
it('INT-002 emits settled screenshots and advisory diagnostics', () => {
 const dir=copy(); try {
  const css=join(dir,'src/presentations/how-to-make-a-presentation/style.css'); writeFileSync(css,readFileSync(css,'utf8')+'\n[data-presentation-navigation] button[data-presentation-active=true]{color:#9caea4;transform:none}\n[data-presentation-toc] button[data-presentation-active=true]{color:#82928a;font-weight:400}\n[data-presentation-attribution]{font-size:8px;color:blue}\n')
  const talk=join(dir,'src/presentations/how-to-make-a-presentation/Talk.tsx'); writeFileSync(talk,readFileSync(talk,'utf8').replace('<div className="diagram">','<div className="diagram"><div style={{position:"absolute",left:10,top:10}}>collision A</div><div style={{position:"absolute",left:10,top:10}}>collision B</div><div data-presentation-allow-overlap><div style={{position:"absolute",left:20,top:30}}>allowed A</div><div style={{position:"absolute",left:20,top:30}}>allowed B</div></div>'))
  execFileSync('npm',['run','build'],{cwd:dir,stdio:'pipe',timeout:60000}); const result=command(dir,['run','inspect','--','how-to-make-a-presentation']); const output=result.stdout+result.stderr
  expect(result.status,output).toBe(0); expect(output).toMatch(/Step 1: overlap: collision A \/ collision B/); expect(output).not.toMatch(/overlap: allowed A/); expect(output).toMatch(/active progress appears indistinct/); expect(output).toMatch(/active table of contents appears indistinct/); expect(output).toMatch(/attribution/)
  expect(readdirSync(join(dir,'artifacts/inspection/how-to-make-a-presentation')).filter(x=>x.endsWith('.png'))).toHaveLength(9); expect(existsSync(join(dir,'artifacts/inspection/how-to-make-a-presentation/step-01.png'))).toBe(true); const first=statSync(join(dir,'artifacts/inspection/how-to-make-a-presentation/step-01.png')).mtimeMs; const second=statSync(join(dir,'artifacts/inspection/how-to-make-a-presentation/step-02.png')).mtimeMs; expect(second-first).toBeGreaterThanOrEqual(900)
 } finally { rmSync(dir,{recursive:true,force:true}) }
},180000)
