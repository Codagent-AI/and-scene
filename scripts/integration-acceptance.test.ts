import { afterAll, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import { cp, mkdtemp, mkdir, readFile, readlink, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { freePort } from './verify.mjs'

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temporaryRoots: string[] = []
const appFiles = ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'src', 'public', 'scripts']

async function disposableApp() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'and-scene-acceptance-'))
  temporaryRoots.push(root)
  for (const file of appFiles) await cp(path.join(sourceRoot, file), path.join(root, file), { recursive: true })
  await symlink(path.join(sourceRoot, 'node_modules'), path.join(root, 'node_modules'), 'dir')
  return root
}

function run(command: string, args: string[], options: { cwd: string; env?: NodeJS.ProcessEnv; timeout?: number }) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: { ...process.env, ...options.env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => { output += chunk })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { output += chunk })
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`command timed out after ${options.timeout}ms\n${output}`)) }, options.timeout ?? 180_000)
    child.on('error', (error) => { clearTimeout(timer); reject(error) })
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, output }) })
  })
}

async function expectPortClosed(port: number) {
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port })
    socket.setTimeout(500)
    socket.once('connect', () => { socket.destroy(); reject(new Error(`preview left port ${port} open`)) })
    socket.once('error', () => resolve())
    socket.once('timeout', () => { socket.destroy(); resolve() })
  })
}

async function expectNoPreviewProcess(root: string) {
  if (!process.platform.startsWith('linux')) return
  const entries = await readdir('/proc').catch(() => [])
  const leaks: string[] = []
  for (const entry of entries.filter((name) => /^\d+$/.test(name))) {
    try {
      const cwd = await readlink(`/proc/${entry}/cwd`).catch(() => '')
      const command = await readFile(`/proc/${entry}/cmdline`, 'utf8')
      if (cwd === root && command.includes('vite') && command.includes('preview')) leaks.push(entry)
    } catch { /* process exited during inspection */ }
  }
  expect(leaks, `orphan preview processes for ${root}`).toEqual([])
}

async function verifyFault(name: string, mutate: (root: string) => Promise<void>, expected: RegExp) {
  const root = await disposableApp()
  await mutate(root)
  const port = await freePort()
  const result = await run('npm', ['run', 'verify', '--', '--root', root, '--port', String(port)], { cwd: sourceRoot, timeout: 180_000 })
  expect(result.code, `${name} should fail verification\n${result.output}`).not.toBe(0)
  expect(result.output, name).toMatch(expected)
  expect(result.output, `${name} must not report success`).not.toMatch(/PASS:/)
  await expectPortClosed(port)
  await expectNoPreviewProcess(root)
}

async function installInspectionFixture(root: string) {
  const folder = path.join(root, 'src/presentations/inspection-fixture')
  await mkdir(folder, { recursive: true })
  await writeFile(path.join(folder, 'Talk.tsx'), `import { Presentation } from '../../presentation-kit/Presentation'
import type { Step, SceneProps } from '../../presentation-kit/types'
import './style.css'
type FixturePayload = { index: number; allow: boolean }
function FixtureScene({ payload }: SceneProps<FixturePayload>) {
  return <div className="fixture-scene">{payload.index < 2 && <div className="fixture-collision" data-presentation-allow-overlap={payload.allow ? 'true' : undefined}><span data-presentation-label="collision left">overlapping left label</span><span data-presentation-label="collision right">overlapping right label</span><span className="hidden-ancestor"><span data-presentation-label="hidden ancestor">hidden ancestor text</span></span><span className="transparent-text" data-presentation-label="transparent">transparent text</span><span className="zero-size-text" data-presentation-label="zero size">zero size text</span></div>}<span className="settle-probe" style={{ transform: \`translateX(\${payload.index * 80}px)\` }}>settle probe</span></div>
}
const steps: Step<FixturePayload>[] = ['collision', 'allowed overlap', 'indistinct active chrome', 'unpolished attribution'].map((title, index) => ({ id: \`fixture-\${index}\`, era: 'fixture', title, caption: title, Scene: FixtureScene, payload: { index, allow: index === 1 } }))
export default function Talk() { return <Presentation steps={steps} title="Inspection fixture" initialMode="browse" className="fixture" /> }
`)
  await writeFile(path.join(folder, 'style.css'), `.fixture { background:#11212a; color:#e5f1f1; font:16px system-ui,sans-serif; padding:18px 28px; box-sizing:border-box; }
.fixture [data-presentation-caption] h2 { color:#f3c86b; }
.fixture [data-presentation-progress] button,.fixture [data-presentation-toc] button,.fixture [data-presentation-controls] button { color:#e5f1f1; background:#203a46; border:1px solid #61808c; border-radius:8px; padding:6px 10px; }
.fixture [data-presentation-active="true"] { color:#101820; background:#f3c86b; border-color:#f3c86b; font-weight:800; }
.fixture [data-presentation-attribution] { color:#a6e0ce; font:13px system-ui,sans-serif; text-decoration:none; }
.fixture-scene { position:relative; width:880px; height:380px; }
.fixture-collision { position:absolute; left:90px; top:75px; width:320px; height:60px; }
.fixture-collision span { position:absolute; left:0; top:0; white-space:nowrap; }
.fixture-collision > span[data-presentation-label="collision right"] { left:32px; top:5px; color:#ffd977; }
.fixture-collision .hidden-ancestor { position:absolute; left:0; top:0; visibility:hidden; }
.fixture-collision .transparent-text { position:absolute; left:0; top:0; opacity:0; }
.fixture-collision .zero-size-text { position:absolute; left:0; top:0; width:0; height:0; overflow:hidden; }
.settle-probe { position:absolute; left:20px; top:170px; transition:transform 450ms linear; }
.fixture footer[data-step-index="2"] [data-presentation-progress] button { color:#e5f1f1; background:#203a46; border-color:#61808c; font-weight:400; }
.fixture footer[data-step-index="3"] [data-presentation-attribution] { color:#00e; font-size:8px; text-decoration:underline; }
`)
  const registryPath = path.join(root, 'src/presentations/index.ts')
  const registry = await readFile(registryPath, 'utf8')
  await writeFile(registryPath, registry.replace('export const presentations: PresentationEntry[] = [', "export const presentations: PresentationEntry[] = [\n  { slug: 'inspection-fixture', title: 'Inspection fixture', load: () => import('./inspection-fixture/Talk') },"))
}

describe('browser-backed acceptance fault matrix and visual inspection fixture', () => {
  afterAll(async () => { await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true }))) })

  it('fails actionable disposable-copy faults and captures settled fixture screenshots with advisory diagnostics', async () => {
    await verifyFault('type/build failure', async (root) => {
      const scene = path.join(root, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      await writeFile(scene, `${await readFile(scene, 'utf8')}\nconst compileFailure: number = 'injected type error'\n`)
    }, /FAIL \[build\]/)

    await verifyFault('missing sample registration', async (root) => {
      const registryPath = path.join(root, 'src/presentations/index.ts')
      const registry = await readFile(registryPath, 'utf8')
      await writeFile(registryPath, registry.replace(/^.*slug: 'how-to-make-a-presentation'.*\n/m, ''))
    }, /FAIL \[sample-registration\]/)

    await verifyFault('out-of-order sample', async (root) => {
      const outlinePath = path.join(root, 'src/presentations/how-to-make-a-presentation/steps/outline.mjs')
      const source = await readFile(outlinePath, 'utf8')
      const rows = source.match(/^\s{2}\{ era:.*$/gm)!
      const swapped = source.replace(rows[0], '__FIRST__').replace(rows[1], rows[0]).replace('__FIRST__', rows[1])
      await writeFile(outlinePath, swapped)
    }, /FAIL \[sample-registration\]: sample registration: step 1/)

    await verifyFault('console error', async (root) => {
      const scene = path.join(root, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      await writeFile(scene, (await readFile(scene, 'utf8')).replace('const count = payload.count', "const count = payload.count\n  if (count === 1) console.error('injected console fault')"))
    }, /FAIL \[render\] step 0: console error: injected console fault/)

    await verifyFault('uncaught page error', async (root) => {
      const scene = path.join(root, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      await writeFile(scene, (await readFile(scene, 'utf8')).replace('const count = payload.count', "const count = payload.count\n  if (count === 1) throw new Error('injected page fault')"))
    }, /FAIL \[render\] step 0: page error: injected page fault/)

    await verifyFault('non-advancing transition', async (root) => {
      const nav = path.join(root, 'src/presentation-kit/usePresentationNav.ts')
      await writeFile(nav, (await readFile(nav, 'utf8')).replace('const next = useCallback(() => setIndex((i) => clampStep(clampStep(i, stepCount) + 1, stepCount)), [stepCount])', 'const next = useCallback(() => {}, [])'))
    }, /FAIL \[render\] step 1: transition did not advance data-step-index/)

    const root = await disposableApp()
    await installInspectionFixture(root)
    const helperPath = path.join(root, 'scripts/inspect-presentation.mjs')
    const helper = await readFile(helperPath, 'utf8')
    expect(helper).toContain("process.env.AND_SCENE_INSPECT_TRACE === '1'")
    const result = await run('npm', ['run', 'inspect', '--', 'inspection-fixture', '--root', root, '--settle', '650'], {
      cwd: sourceRoot,
      env: { AND_SCENE_INSPECT_TRACE: '1' },
      timeout: 180_000,
    })
    expect(result.code, result.output).toBe(0)
    expect(result.output).toContain('WARN step 0: overlapping text/chrome "collision left" and "collision right"')
    expect(result.output).not.toContain('hidden ancestor')
    expect(result.output).not.toContain('transparent')
    expect(result.output).not.toContain('zero size')
    expect(result.output).not.toContain('WARN step 1: overlapping text/chrome')
    expect(result.output).toContain('WARN step 2: active progress/ToC is indistinguishable from inactive controls')
    expect(result.output).toMatch(/WARN step 3: attribution is too small; style the \[data-presentation-attribution\] hook/)
    expect(result.output).toMatch(/WARN step 3: attribution looks browser-default; style the \[data-presentation-attribution\] hook/)
    expect(result.output).toContain('PASS: captured 4 settled step screenshots')
    const captureTraces = [...result.output.matchAll(/CAPTURE step (\d+) settled=(\d+)ms activeAnimations=(\d+)/g)]
    expect(captureTraces).toHaveLength(4)
    for (const [, , waited, animations] of captureTraces) { expect(Number(waited)).toBeGreaterThanOrEqual(640); expect(Number(animations)).toBe(0) }
    const screenshotDir = path.join(root, 'artifacts/inspection/inspection-fixture')
    await mkdir(screenshotDir, { recursive: true })
    await writeFile(path.join(screenshotDir, 'step-09.png'), 'stale screenshot')
    const rerun = await run('npm', ['run', 'inspect', '--', 'inspection-fixture', '--root', root, '--settle', '0'], { cwd: sourceRoot, timeout: 180_000 })
    expect(rerun.code, rerun.output).toBe(0)
    const screenshots = (await readdir(screenshotDir)).sort()
    expect(screenshots).toEqual(['step-01.png', 'step-02.png', 'step-03.png', 'step-04.png'])
    for (const filename of screenshots) expect((await readFile(path.join(screenshotDir, filename))).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    await expectNoPreviewProcess(root)
  }, 300_000)
})
