// @vitest-environment node
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, expect, it, vi } from 'vitest'
import { inspect } from '../scripts/inspect-presentation.mjs'
import { walkSteps, withBrowser } from '../scripts/browser.mjs'
vi.mock('../scripts/browser.mjs',()=>({SETTLE_MS:850,command:vi.fn(),walkSteps:vi.fn(),withBrowser:vi.fn()}))
const directories:string[]=[]
afterEach(async()=>{await Promise.all(directories.splice(0).map(dir=>rm(dir,{recursive:true,force:true})));vi.restoreAllMocks()})
async function fixture(){
  const cwd=await mkdtemp(join(tmpdir(),'inspection-unit-'));directories.push(cwd)
  const page={evaluate:vi.fn().mockResolvedValue([]),screenshot:vi.fn(async({path}:{path:string})=>writeFile(path,'png fixture'))}
  vi.mocked(withBrowser).mockImplementation(async run=>run(page,'http://127.0.0.1:45678'))
  vi.mocked(walkSteps).mockImplementation(async(page,_url,_route,visit)=>{await visit(page,0,1,{stepObservedAt:1,settleStartedAt:1});return 1})
  vi.spyOn(console,'log').mockImplementation(()=>{})
  return cwd
}
it('R3 wide and narrow captures coexist and repeat capture removes stale steps in its own directory',async()=>{
  const cwd=await fixture()
  const wide=join(cwd,'.inspection','example','1440x900'),narrow=join(cwd,'.inspection','example','390x844')
  await inspect({cwd,route:'example',build:false})
  await writeFile(join(wide,'step-12.png'),'stale')
  await inspect({cwd,route:'example',build:false,viewport:{width:390,height:844}})
  expect(await readFile(join(wide,'step-12.png'),'utf8')).toBe('stale')
  expect(await readFile(join(narrow,'step-01.png'),'utf8')).toBe('png fixture')
  await inspect({cwd,route:'example',build:false})
  expect((await readdir(wide)).sort()).toEqual(['report.json','step-01.png'])
  expect((await readdir(narrow)).sort()).toEqual(['report.json','step-01.png'])
})
it('R3 arbitrary custom output is preserved rather than recursively cleared',async()=>{
  const cwd=await fixture(),output=join(cwd,'custom-output')
  await mkdir(output);await writeFile(join(output,'keep.txt'),'keep')
  await inspect({cwd,route:'example',output,build:false})
  expect(await readFile(join(output,'keep.txt'),'utf8')).toBe('keep')
})
it('R3 invalid routes cannot cause output deletion',async()=>{
  const cwd=await fixture(),output=join(cwd,'custom-output')
  await mkdir(output);await writeFile(join(output,'keep.txt'),'keep')
  await expect(inspect({cwd,route:'../bad',output,build:false})).rejects.toThrow('slug')
  expect(await readFile(join(output,'keep.txt'),'utf8')).toBe('keep')
})
it('R1 R2 R3 bootstrap browser scripts stay byte-aligned with canonical scripts',async()=>{
  for(const name of ['browser.mjs','verify.mjs','inspect-presentation.mjs']){
    const canonical=await readFile(new URL(`../scripts/${name}`,import.meta.url),'utf8')
    const template=await readFile(new URL(`../skills/presentation/templates/bootstrap/scripts/${name}`,import.meta.url),'utf8')
    expect(template).toBe(canonical)
  }
})
it('R3 invalid viewport dimensions cannot enter a derived deletion path',async()=>{
  const cwd=await fixture(),output=join(cwd,'keep')
  await mkdir(output);await writeFile(join(output,'keep.txt'),'keep')
  for(const viewport of [{width:'../../keep',height:900},{width:0,height:900},{width:390,height:-1}]){
    await expect(inspect({cwd,route:'example',viewport,output,build:false})).rejects.toThrow('positive integer')
  }
  expect(await readFile(join(output,'keep.txt'),'utf8')).toBe('keep')
})
