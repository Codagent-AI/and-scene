import { afterAll, expect, it } from 'vitest'
import { cp, mkdtemp, readFile, rm, symlink, writeFile, readdir, stat, utimes } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createConnection, createServer } from 'node:net'
import { createServer as createHttpServer } from 'node:http'
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
  const port = await getFreePort()
  const result = await run(project, ['run', 'inspect', '--', 'inspect-fixture', '--settle', '180', '--port', String(port)])
  expect(result.code, result.output).toBe(0)
  expect(result.output).toContain('step 1: overlap:')
  expect(result.output).toContain('active progress indicator is visually indistinguishable')
  expect(result.output).toContain('attribution is too small or browser-default')
  expect(result.output).not.toContain('step 2: overlap:')
  const screenshots = await readdir(path.join(project, '.presentation-inspection/inspect-fixture'))
  expect(screenshots.sort()).toEqual(['step-01.png', 'step-02.png'])
  expect((await stat(path.join(project, '.presentation-inspection/inspect-fixture/step-01.png'))).size).toBeGreaterThan(1000)
  const screenshot = await readFile(path.join(project, '.presentation-inspection/inspect-fixture/step-01.png'))
  expect(screenshot.readUInt32BE(16)).toBe(1440)
  expect(screenshot.readUInt32BE(20)).toBe(900)
  expect(result.output).toContain('wrote 2 screenshots')
  expect(result.output).toContain('settled step 2')
  expect(result.output).not.toMatch(/WARN \[inspect\] step 2:/)
  const unknown = await run(project, ['run', 'inspect', '--', 'comment-only-slug', '--no-build', '--settle', '0'])
  expect(unknown.code).toBe(1)
  expect(unknown.output).toContain('Unknown presentation slug or page failed to render: comment-only-slug')
  // The child process has exited, and the preview listener is closed after completion.
  await expectConnectionRefused(port)
  let foreignRequests = 0
  const foreignServer = createHttpServer((_request, response) => {
    foreignRequests += 1
    response.writeHead(200, { 'content-type': 'text/plain', connection: 'close' }).end('foreign server')
  })
  await new Promise<void>((resolve, reject) => foreignServer.once('error', reject).listen(0, '127.0.0.1', resolve))
  const foreignAddress = foreignServer.address()
  if (!foreignAddress || typeof foreignAddress === 'string') throw new Error('Could not allocate foreign-server port')
  try {
    const occupied = await run(project, ['run', 'inspect', '--', 'inspect-fixture', '--no-build', '--settle', '0', '--port', String(foreignAddress.port)])
    expect(occupied.code).toBe(1)
    expect(occupied.output).toContain(`Port ${foreignAddress.port} is already in use (EADDRINUSE)`)
    expect(foreignRequests).toBe(0)
    const foreignResponse = await fetch(`http://127.0.0.1:${foreignAddress.port}/`, { signal: AbortSignal.timeout(2000) })
    expect(await foreignResponse.text()).toBe('foreign server')
    expect(foreignRequests).toBe(1)
  } finally {
    await new Promise<void>((resolve, reject) => foreignServer.close(error => error ? reject(error) : resolve()))
  }
  // Build-config inputs outside src/ and public/ also make dist stale.
  const future = new Date(Date.now() + 60_000)
  await utimes(path.join(project, 'vite.config.ts'), future, future)
  const stale = await run(project, ['run', 'inspect', '--', 'inspect-fixture', '--no-build', '--settle', '0'])
  expect(stale.code).toBe(1)
  expect(stale.output).toContain('dist is missing or stale')
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

function expectConnectionRefused(port: number) {
  return new Promise<void>((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => { socket.destroy(); reject(new Error(`Preview is still listening on ${port}`)) })
    socket.once('error', error => error.code === 'ECONNREFUSED' ? resolve() : reject(error))
  })
}

async function getFreePort() {
  const server = createServer()
  await new Promise<void>((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Could not allocate a test port')
  const { port } = address
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return port
}
