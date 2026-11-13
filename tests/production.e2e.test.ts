// @vitest-environment node
import { afterAll, expect, it } from 'vitest'
import { readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { copyApp, assertCleanup, exec } from './support/app'
const temporary:string[]=[]
afterAll(async()=>{await Promise.all(temporary.map(dir=>rm(dir,{recursive:true,force:true})))})
it('E2E-001 reference presentation passes production verification',async()=>{
 const {stdout}=await exec('npm',['run','verify'],{timeout:180000,maxBuffer:4e6});console.log(stdout)
 expect(stdout).toContain('PASS:');expect(stdout).not.toContain('FAIL:')
 for(let i=0;i<9;i++)expect(stdout).toContain(`render: step ${i} OK`)
 expect(stdout).toContain('http://127.0.0.1:');assertCleanup(stdout)
})
it('E2E-002 verification failures name phases and steps and clean up processes',async()=>{
 const faults=[
  {name:'build',file:'src/main.tsx',edit:(s:string)=>s+'\nconst broken: number = "wrong"; console.log(broken)\n',message:/build:.*exited/},
  {name:'missing sample',file:'src/presentations/index.ts',edit:(s:string)=>s.replace(/^.*slug: 'how-to-make-a-presentation'.*\n/m,''),message:/reference: missing registered presentation/},
  {name:'out-of-order sample',file:'src/presentations/how-to-make-a-presentation/steps/index.tsx',edit:(s:string)=>s.replace("['the ask','You have a topic'","['the ask','The skill interviews you'"),message:/reference: missing or malformed/},
  {name:'console',file:'src/presentations/how-to-make-a-presentation/steps/index.tsx',edit:(s:string)=>s.replace('return <SceneLayer',"if (beat === 4) console.error('injected console fault');\n return <SceneLayer"),message:/step 3:.*console:.*injected console fault/},
  {name:'page render',file:'src/presentations/how-to-make-a-presentation/steps/index.tsx',edit:(s:string)=>s.replace('return <SceneLayer',"if (beat === 4) throw new Error('injected page fault');\n return <SceneLayer"),message:/step 3:.*injected page fault/},
  {name:'stalled transition',file:'src/presentation-kit/usePresentationNav.ts',edit:(s:string)=>s.replace('go(old => old + 1)','go(old => old)'),message:/step 1:/},
 ]
 for(const fault of faults) {
  const root=await copyApp('fault');temporary.push(root);const file=path.join(root,fault.file)
  const original=await readFile(file,'utf8'),changed=fault.edit(original);expect(changed).not.toBe(original);await writeFile(file,changed)
  let failure:{code?:number;stdout?:string;stderr?:string}|undefined
  try {await exec('npm',['run','verify'],{cwd:root,timeout:180000,maxBuffer:4e6})}catch(error){failure=error as typeof failure}
  expect(failure, fault.name).toBeTruthy();expect(failure?.code).toBe(1)
  const output=(failure?.stdout??'')+(failure?.stderr??'');console.log(`FAULT ${fault.name}\n${output}`)
  expect(output).toContain('FAIL:');expect(output).not.toContain('PASS:');expect(output).toMatch(fault.message);assertCleanup(output)
 }
})
