import { afterAll, expect, it } from 'vitest'
import { cp, mkdtemp, readFile, rm, symlink, writeFile, readdir, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-inspect-'))
afterAll(async () => { await rm(tempRoot, { recursive: true, force: true }) })

it('captures settled fixture steps, reports advisory warnings, and cleans up preview', async () => {
  const project = path.join(tempRoot, 'project')
  await import('node:fs/promises').then(({ mkdir }) => mkdir(project))
  for (const entry of ['src', 'scripts', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'package.json', 'package-lock.json']) {
    await cp(path.join(repo, entry), path.join(project, entry), { recursive: true })
  }
  await symlink(path.join(repo, 'node_modules'), path.join(project, 'node_modules'), 'dir')
  const fixtureDir = path.join(project, 'src/presentations/inspect-fixture')
  await import('node:fs/promises').then(({ mkdir }) => mkdir(fixtureDir, { recursive: true }))
  await writeFile(path.join(fixtureDir, 'Talk.tsx'), `import React from 'react'; export default function Talk(){ const [index,setIndex]=React.useState(0); React.useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='ArrowRight')setIndex(1)};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[]); const button=(active:boolean)=>index===0?{padding:4}:{padding:4,background:active?'#222':'#fff',color:active?'#fff':'#222'}; return <main data-presentation-root data-step-count="2" data-step-index={index} style={{position:'fixed',inset:0,background:'#fff',fontFamily:'Arial',color:'#222',opacity:index===0?1:0.5,transition:'opacity 350ms linear'}}><nav data-presentation-progress><button aria-current={index===0?'step':undefined} data-presentation-active={index===0?'true':undefined} style={button(index===0)}>1</button><button aria-current={index===1?'step':undefined} data-presentation-active={index===1?'true':undefined} style={button(index===1)}>2</button></nav>{index===0&&<><div style={{position:'absolute',left:100,top:100,width:100,height:60,background:'#eee'}}><span>Collision A</span><span style={{position:'absolute',left:15,top:0}}>Collision B</span></div><div data-presentation-allow-overlap style={{position:'absolute',left:300,top:100,width:120,height:60}}><span>Allowed A</span><span style={{position:'absolute',left:10,top:0}}>Allowed B</span></div></>}{index===1&&<div style={{position:'absolute',top:200}}>Clean step</div>}<a data-presentation-attribution href="#" style={{position:'absolute',bottom:0,left:0,fontSize:index===0?8:12,height:index===0?'auto':24,lineHeight:index===0?'normal':'24px',color:index===0?'#00e':'#333',fontFamily:'Arial',textDecoration:index===0?'underline':'none'}}>Credit</a></main> }`)
  const registryPath = path.join(project, 'src/presentations/index.ts')
  let registry = await readFile(registryPath, 'utf8')
  registry = registry.replace('export const presentations: PresentationEntry[] = [', "export const presentations: PresentationEntry[] = [\n  { slug: 'inspect-fixture', title: 'Fixture', load: () => import('./inspect-fixture/Talk') },")
  await writeFile(registryPath, registry)
  const build = await run(project, ['run', 'build'])
  expect(build.code, build.output).toBe(0)
  const port = 48731
  const result = await run(project, ['run', 'inspect', '--', 'inspect-fixture', '--settle', '180', '--port', String(port)])
  expect(result.code, result.output).toBe(0)
  expect(result.output).toContain('step 1: overlap:')
  expect(result.output).toContain('active progress indicator is visually indistinguishable')
  expect(result.output).toContain('attribution is too small or browser-default')
  expect(result.output).not.toContain('step 2: overlap:')
  const screenshots = await readdir(path.join(project, '.presentation-inspection/inspect-fixture'))
  expect(screenshots.sort()).toEqual(['step-01.png', 'step-02.png'])
  expect((await stat(path.join(project, '.presentation-inspection/inspect-fixture/step-01.png'))).size).toBeGreaterThan(1000)
  expect(result.output).toContain('wrote 2 screenshots')
  expect(result.output).toContain('settled step 2')
  expect(result.output).not.toMatch(/WARN \[inspect\] step 2:/)
  // The child process has exited, and the preview listener is closed after completion.
  await expect(fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(300) })).rejects.toThrow()
}, 120_000)

function run(cwd: string, args: string[]) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn('npm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk })
    child.stderr.setEncoding('utf8').on('data', chunk => { output += chunk })
    child.once('error', reject)
    child.once('exit', code => resolve({ code, output }))
  })
}
