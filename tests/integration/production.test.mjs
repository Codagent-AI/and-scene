import { afterAll, afterEach, beforeAll, beforeEach, describe, it, expect } from 'vitest'
import { cp, mkdir, readFile, writeFile, rm, readdir, symlink, mkdtemp, access, lstat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chromium } from 'playwright'
import { visualDiagnostics } from '../../scripts/diagnostics.mjs'
import { bootstrapPath } from '../../skills/presentation/scaffold-plan.mjs'
const root = process.cwd(), work = resolve(root, '.test-work/integration')
let counter = 0
const ownedDirectories = new Set()
const projectPaths = ['src', 'scripts', 'public', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts']
const sourcePaths = [...projectPaths, 'skills', 'tests', 'README.md', '.gitignore', 'eslint.config.js', 'vitest.config.ts', 'vitest.integration.config.ts', 'tsconfig.tests.json']
let sourceBefore
const run = (cmd, args, cwd) => new Promise((done, reject) => {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, DEBUG: 'pw:browser', ...(args[0] === 'run' ? { NODE_ENV: 'production' } : {}) } })
  let output = ''
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  child.on('error', reject)
  child.on('exit', code => { console.log(output); done({ code, output }) })
})
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(async entry => entry.isDirectory() ? (await files(join(directory, entry.name))).map(name => `${entry.name}/${name}`) : [entry.name]))).flat().sort()
}
async function sourceSnapshot() {
  const paths = []
  for (const name of sourcePaths) {
    const path = resolve(root, name)
    if ((await lstat(path)).isDirectory()) paths.push(...(await files(path)).map(file => `${name}/${file}`))
    else paths.push(name)
  }
  paths.sort()
  const hash = createHash('sha256')
  for (const path of paths) { hash.update(path + '\0'); hash.update(await readFile(resolve(root, path))) }
  return { paths, digest: hash.digest('hex') }
}
async function removeAndAssert(directory) {
  await rm(directory, { recursive: true, force: true })
  await expect(access(directory)).rejects.toMatchObject({ code: 'ENOENT' })
  console.log(`ASSERT temporary directory removed: ${directory}`)
}
async function materializeBootstrap(label) {
  const directory = await mkdtemp(resolve(tmpdir(), `and-scene-${label}-`))
  ownedDirectories.add(directory)
  expect(directory.startsWith(root)).toBe(false)
  await cp(bootstrapPath, directory, { recursive: true })
  const install = await run('npm', ['ci', '--ignore-scripts', '--prefer-offline'], directory)
  expect(install.code).toBe(0)
  expect((await lstat(resolve(directory, 'node_modules'))).isSymbolicLink()).toBe(false)
  return directory
}
async function copyProject(label) {
  const directory = resolve(work, `${counter++}-${label}`)
  ownedDirectories.add(directory)
  await mkdir(directory, { recursive: true })
  for (const name of projectPaths) await cp(resolve(root, name), resolve(directory, name), { recursive: true })
  await symlink(resolve(root, 'node_modules'), resolve(directory, 'node_modules'), 'dir')
  return directory
}
async function assertStopped(output) {
  const started = [...output.matchAll(/Preview http:\/\/127\.0\.0\.1:(\d+) \(pid (\d+)\)/g)]
  for (const [, port, pid] of started) {
    expect(output).toContain(`Preview stopped (pid ${pid})`)
    expect(() => process.kill(Number(pid), 0)).toThrow()
    await expect(fetch(`http://127.0.0.1:${port}`)).rejects.toThrow()
  }
  const browsers = [...output.matchAll(/<launched> pid=(\d+)/g)]
  expect(browsers.length).toBe(started.length)
  for (const [, pid] of browsers) {
    expect(output).toContain(`[pid=${pid}] <process did exit:`)
    expect(() => process.kill(Number(pid), 0)).toThrow()
    console.log(`ASSERT Chromium stopped: ${pid}`)
  }
}
beforeAll(async () => { await mkdir(work, { recursive: true }) })
beforeEach(async () => { sourceBefore = await sourceSnapshot(); ownedDirectories.clear() })
afterEach(async () => {
  try { for (const directory of ownedDirectories) await removeAndAssert(directory) }
  finally {
    expect(await sourceSnapshot()).toEqual(sourceBefore)
    console.log(`ASSERT source preservation: ${sourceBefore.paths.length} source/config/template files, including added/deleted paths`)
  }
})
afterAll(async () => { await removeAndAssert(work) })

describe('production contracts', () => {
  it('INT-001 materialized bootstrap builds verifies and matches canonical kit/scripts outside source cwd', async () => {
    const directory = await materializeBootstrap('bootstrap')
    const pkg = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) expect({ ...pkg.dependencies, ...pkg.devDependencies }).toHaveProperty(name)
    expect(JSON.stringify(pkg)).not.toMatch(/tailwind/i)
    for (const name of await files(resolve(root, 'src/presentation-kit'))) expect(await readFile(resolve(directory, 'src/presentation-kit', name), 'utf8')).toBe(await readFile(resolve(root, 'src/presentation-kit', name), 'utf8'))
    for (const name of await files(resolve(root, 'scripts'))) expect(await readFile(resolve(directory, 'scripts', name), 'utf8')).toBe(await readFile(resolve(root, 'scripts', name), 'utf8'))
    const kit = (await Promise.all((await files(resolve(directory, 'src/presentation-kit'))).map(name => readFile(resolve(directory, 'src/presentation-kit', name), 'utf8')))).join('\n')
    expect(kit).not.toMatch(/background:|fontFamily:|boxShadow:|border:|tailwind|#[0-9a-f]{3,8}\b/i)
    const result = await run('npm', ['run', 'verify'], directory)
    expect(result.code).toBe(0); expect(result.output).toContain('PASS verification: example')
    await assertStopped(result.output)
  })
  it('INT-002 screenshots are per-step settled artifacts and warnings remain advisory with intentional exemptions', async () => {
    const directory = await materializeBootstrap('inspector')
    const fixture = `import { useEffect } from 'react'
import { Presentation } from '../presentation-kit/Presentation'
function Scene({payload}:{payload:number}) { useEffect(()=>{const n=document.querySelector('[data-fixture]'); if(n)n.textContent='moving';const timer=setTimeout(()=>{if(n)n.textContent='collision alpha'},700);return()=>clearTimeout(timer)},[payload]);return <div><div data-fixture="" style={{position:'absolute',left:10,top:20}}>collision alpha</div><div style={{position:'absolute',left:10,top:20}}>collision beta</div><svg style={{position:'absolute',left:0,top:80,width:600,height:80}}><text x="20" y="20">vector alpha</text><text x="20" y="20"><tspan>vector beta</tspan></text><title>metadata title</title><defs><text>unused definition</text></defs><text style={{display:'none'}} x="20" y="20">hidden vector</text><g data-presentation-allow-overlap="true"><text x="330" y="20">allowed vector alpha</text><text x="330" y="20">allowed vector beta</text></g></svg><div style={{position:'absolute',left:20,top:87}}>mixed HTML label</div><div data-presentation-allow-overlap="true"><span style={{position:'absolute',left:300,top:20}}>allowed alpha</span><span style={{position:'absolute',left:300,top:20}}>allowed beta</span></div></div> }
const steps=[0,1].map(i=>({id:String(i),era:String(i),title:'Fixture '+i,caption:'Fixture caption',groupKey:'fixture',Scene,payload:i}))
export default function Talk(){return <Presentation title="Fixture" steps={steps}/>}`
    await writeFile(resolve(directory, 'src/presentations/Fixture.tsx'), fixture)
    await writeFile(resolve(directory, 'src/presentations/index.ts'), `export const presentations=[{slug:'fixture',title:'Fixture',load:()=>import('./Fixture')}];export function findPresentation(pathname:string){return presentations.find(e=>'/'+e.slug===pathname)}`)
    const started = Date.now()
    // Execute only the distributed CLI and its own installed dependencies, outside root.
    const captured = await run('npm', ['run', 'inspect', '--', 'fixture'], directory)
    expect(captured.code).toBe(0)
    await assertStopped(captured.output)
    const artifacts = resolve(directory, 'artifacts/inspection/fixture/1440x900')
    const report = JSON.parse(await readFile(resolve(artifacts, 'report.json'), 'utf8'))
    expect(Date.now() - started).toBeGreaterThanOrEqual(1700)
    expect(report.map(s => s.file)).toEqual(['step-01.png', 'step-02.png'])
    for (const item of report) {
      expect((await readFile(resolve(artifacts, item.file))).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect(item.settleMs).toBeGreaterThanOrEqual(850)
      expect(item.warnings).toContain(`step ${item.index}: overlap: collision alpha / collision beta`)
      expect(item.warnings.join('\n')).toContain('overlap: vector alpha / vector beta')
      expect(item.warnings.some(warning => warning.includes('overlap:') && warning.includes('vector alpha') && warning.includes('mixed HTML label'))).toBe(true)
      expect(item.warnings.join('\n')).not.toMatch(/allowed alpha|allowed vector|metadata title|unused definition|hidden vector/)
      expect(item.warnings).toContain(`step ${item.index}: indistinct active progress-step`)
      expect(item.warnings).toContain(`step ${item.index}: indistinct active toc-entry`)
      expect(item.warnings.join('\n')).toMatch(/unpolished attribution.*data-presentation-attribution/)
    }
    // Same browser-backed fixture exercises distinct local chrome and each attribution failure.
    const browserServer = await chromium.launchServer()
    const browserPid = browserServer.process().pid
    const browser = await chromium.connect(browserServer.wsEndpoint())
    try {
      const page = await browser.newPage()
      await page.setContent(`<main data-presentation-root data-step-index="2"><button data-presentation-progress-step data-presentation-active="true" style="background:red">1</button><button data-presentation-progress-step data-presentation-active="false">2</button><a data-presentation-attribution style="font:14px sans-serif;color:rgb(80,90,80)">credit</a><div style="display:none"><span>A</span><span>B</span></div></main>`)
      expect((await page.evaluate(visualDiagnostics)).join('\n')).not.toMatch(/indistinct|attribution|overlap/)
      await page.locator('a').evaluate(n => n.style.fontSize = '8px')
      expect((await page.evaluate(visualDiagnostics)).join('\n')).toContain('unpolished attribution')
      await page.locator('a').evaluate(n => n.remove())
      expect((await page.evaluate(visualDiagnostics)).join('\n')).toContain('missing attribution')
    } finally {
      try { await browser.close() } finally { await browserServer.close() }
      expect(() => process.kill(browserPid, 0)).toThrow()
      console.log(`ASSERT fixture Chromium stopped: ${browserPid}`)
    }
  })
  it('E2E-001 reference passes npm run verify with nine observed indices and IPv4 lifecycle', async () => {
    const result = await run('npm', ['run', 'verify'], root)
    expect(result.code).toBe(0)
    for (let i = 0; i < 9; i++) expect(result.output).toContain(`PASS step ${i} / 8`)
    expect(result.output).toContain('PASS verification: how-to-make-a-presentation')
    expect(result.output).toContain('http://127.0.0.1:')
    await assertStopped(result.output)
  })
  it.each(['build', 'missing', 'order', 'console', 'pageerror', 'render', 'transition'])('E2E-002 %s fault exits nonzero names phase/step and cleans subprocess', async fault => {
    const directory = await copyProject(fault)
    if (fault === 'build') await writeFile(resolve(directory, 'src/broken.ts'), 'const value: string = 123; export { value }')
    else if (fault === 'missing' || fault === 'order') {
      const path = resolve(directory, 'src/presentations/how-to-make-a-presentation/steps/outline.json')
      if (fault === 'missing') {
        // Remove registration without breaking the app build, exercising the sample phase.
        const registryPath = resolve(directory, 'src/presentations/index.ts')
        await writeFile(registryPath, (await readFile(registryPath, 'utf8')).replace("slug: 'how-to-make-a-presentation'", "slug: 'renamed'"))
      } else await writeFile(path, JSON.stringify(JSON.parse(await readFile(path, 'utf8')).reverse()))
    } else if (fault === 'render') {
      const path = resolve(directory, 'src/presentations/how-to-make-a-presentation/steps/StoryScene.tsx')
      const original = await readFile(path, 'utf8')
      expect(original).toContain('  const content:')
      await writeFile(path, original.replace('  const content:', "  if (beat === 3) throw new Error('injected scene render fault')\n  const content:"))
    } else {
      const path = resolve(directory, 'index.html')
      const action = fault === 'transition' ? `window.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation()}},true);` : `new MutationObserver(()=>{const r=document.querySelector('[data-presentation-root]');if(r?.getAttribute('data-step-index')==='2'&&!window.faulted){window.faulted=true;${fault === 'console' ? "console.error('injected console fault')" : "setTimeout(()=>{throw new Error('injected page fault')})"}}}).observe(document.documentElement,{subtree:true,attributes:true});`
      await writeFile(path, (await readFile(path, 'utf8')).replace('</head>', `<script>${action}</script></head>`))
    }
    const result = await run('npm', ['run', 'verify'], directory)
    expect(result.code).not.toBe(0)
    expect(result.output).toContain(`FAIL ${fault === 'build' ? 'build' : ['missing', 'order'].includes(fault) ? 'sample' : 'render'}`)
    if (['console', 'pageerror', 'render'].includes(fault)) expect(result.output).toContain('step 2')
    if (fault === 'transition') expect(result.output).toContain('step 1')
    if (fault === 'render') expect(result.output).toContain('injected scene render fault')
    expect(result.output).not.toContain('PASS verification:')
    await assertStopped(result.output)
  })
})
