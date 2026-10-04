// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { afterAll, describe, expect, it } from 'vitest'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const scratch = await mkdtemp(path.join(tmpdir(), 'and-scene-verification-'))
const copiedFiles = ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js']
const copiedApps: string[] = []

async function copyApp(name: string) {
  const app = path.join(scratch, name)
  copiedApps.push(app)
  await mkdir(app, { recursive: true })
  for (const file of copiedFiles) await cp(path.join(repository, file), path.join(app, file))
  await cp(path.join(repository, 'src'), path.join(app, 'src'), { recursive: true })
  await cp(path.join(repository, 'scripts'), path.join(app, 'scripts'), { recursive: true })
  await symlink(path.join(repository, 'node_modules'), path.join(app, 'node_modules'), 'dir')
  return app
}

async function allocatePreviewPort() {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Could not allocate a free preview port for the integration test')
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return String(address.port)
}

function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env, CI: '1' } })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  if (result.status !== 0) throw Object.assign(new Error(output), { status: result.status, stdout: output, stderr: '' })
  return output
}

async function expectFailure(app: string, expected: RegExp) {
  let output = ''
  const port = await allocatePreviewPort()
  try { run('npm', ['run', 'verify'], app, { PREVIEW_PORT: port }) } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; status?: number }
    output = `${failure.stdout ?? ''}${failure.stderr ?? ''}`
    expect(failure.status).not.toBe(0)
  }
  expect(output).toMatch(expected)
  expect(output).not.toMatch(/PASS: build/)
}

afterAll(async () => {
  for (const app of copiedApps) {
    const link = path.join(app, 'node_modules')
    try {
      if ((await lstat(link)).isSymbolicLink()) await unlink(link)
    } catch {
      // The scratch app may not have created its dependency link yet.
    }
  }
  await rm(scratch, { recursive: true, force: true })
})

describe('production verification failure contract (E2E-002)', () => {
  it('fails a build-breaking copy with a build-phase diagnostic', async () => {
    const app = await copyApp('build-fault')
    const steps = path.join(app, 'src/presentations/how-to-make-a-presentation/steps.tsx')
    await writeFile(steps, `${await readFile(steps, 'utf8')}\nconst injectedBuildFault: number = 'not a number'\n`)
    await expectFailure(app, /Build check failed/)
  }, 90_000)

  it('fails a malformed sample copy with a sample-phase diagnostic', async () => {
    const app = await copyApp('sample-fault')
    const steps = path.join(app, 'src/presentations/how-to-make-a-presentation/steps.tsx')
    const source = await readFile(steps, 'utf8')
    await writeFile(steps, source.replace("const titles = ['You have a topic', 'The skill interviews you'", "const titles = ['The skill interviews you', 'You have a topic'"))
    await expectFailure(app, /Sample check failed at step 1: expected title/)
  }, 90_000)

  it('reports a browser runtime failure at its offending step', async () => {
    const app = await copyApp('runtime-fault')
    const steps = path.join(app, 'src/presentations/how-to-make-a-presentation/steps.tsx')
    const source = await readFile(steps, 'utf8')
    await writeFile(steps, source.replace('  const n = payload.through', "  if (payload.through === 2) throw new Error('injected runtime fault')\n  const n = payload.through"))
    await expectFailure(app, /Render check failed at step 3:.*injected runtime fault/)
  }, 90_000)

  it('reports a stalled public step transition at its target step', async () => {
    const app = await copyApp('transition-fault')
    const nav = path.join(app, 'src/presentation-kit/usePresentationNav.ts')
    const source = await readFile(nav, 'utf8')
    await writeFile(nav, source.replace('setIndex(Math.min(count - 1, index + 1))', 'setIndex(index)'))
    await expectFailure(app, /Render check failed at step 2: transition did not advance/)
  }, 90_000)
})

describe('project-local inspection diagnostics (INT-002)', () => {
  it('captures settled screenshots and warns on overlap, indistinct controls, and default attribution', async () => {
    const app = await copyApp('inspection-fixture')
    const registry = path.join(app, 'src/presentations/index.ts')
    const registrySource = await readFile(registry, 'utf8')
    await writeFile(registry, registrySource.replace('export const presentations: PresentationRegistration[] = [', "export const presentations: PresentationRegistration[] = [{ slug: 'inspection-fixture', title: 'Inspection Fixture', load: () => import('./inspection-fixture/Talk') },"))
    const fixture = path.join(app, 'src/presentations/inspection-fixture')
    await mkdir(fixture, { recursive: true })
    await writeFile(path.join(fixture, 'Talk.tsx'), `import { Presentation } from '../../presentation-kit/Presentation'; import { STEPS } from './steps'; import './style.css'; export default function Talk() { return <Presentation steps={STEPS} title="Inspection Fixture" /> }`)
    await writeFile(path.join(fixture, 'steps.tsx'), `import type { SceneProps, Step } from '../../presentation-kit/types'; import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer'; type Payload = { n: number }; function Scene({ payload }: SceneProps<Payload>) { return <SceneLayer><div className="collision-one">Unmarked collision A {payload.n}</div><div className="collision-two">Unmarked collision B {payload.n}</div><div className="allowed" data-presentation-allow-overlap=""><span>Allowed overlap A</span><span>Allowed overlap B</span></div><div className="settle-marker" data-settle-marker="" /></SceneLayer> }; export const STEPS: Step<Payload>[] = [1, 2].map(n => ({ id: String(n), era: 'Test', title: 'Test ' + n, caption: 'Fixture caption', payload: { n }, Scene, groupKey: 'fixture' }));`)
    await writeFile(path.join(fixture, 'style.css'), `.presentation-progress-item, .presentation-toc-item { color: #222 !important; background: #ddd !important; border: 1px solid #777 !important; font-weight: 400 !important; } .collision-one, .collision-two { position: absolute; left: 180px; top: 110px; color: white; } .collision-two { left: 184px; } .allowed { position:absolute; left:180px; top:150px; } .settle-marker { position:absolute; left:100px; top:100px; width:42px; height:42px; background:rgb(255,0,255); animation:settle 400ms steps(1,end) forwards; } @keyframes settle { 0%,49% {background:rgb(255,0,255)} 50%,100% {background:rgb(0,255,0)} }`)
    run('npm', ['run', 'build'], app)
    const port = await allocatePreviewPort()
    const output = run('npm', ['run', 'inspect', '--', 'inspection-fixture'], app, { INSPECT_SETTLE_MS: '500', PREVIEW_PORT: port })
    expect((await readdir(path.join(app, 'inspection'))).filter(file => file.endsWith('.png'))).toEqual(['inspection-fixture-01.png', 'inspection-fixture-02.png'])
    expect(output).toMatch(/WARN step 1: visible text overlap:.*collision-one.*collision-two/)
    expect(output).not.toMatch(/Allowed overlap/)
    expect(output).toMatch(/active progress or table-of-contents state may be visually indistinct/)
    expect(output).toMatch(/browser-default link styling/)
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      const image = await page.goto(`file://${path.join(app, 'inspection/inspection-fixture-01.png')}`)
      expect(image?.ok()).toBe(true)
      const greenPixels = await page.evaluate(() => {
        const img = document.querySelector('img')
        if (!img) return 0
        const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
        const context = canvas.getContext('2d'); if (!context) return 0
        context.drawImage(img, 0, 0)
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
        let count = 0
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i] === 0 && pixels[i + 1] === 255 && pixels[i + 2] === 0) count++
        return count
      })
      expect(greenPixels).toBeGreaterThan(1000)
    } finally { await browser.close() }
  }, 120_000)
})
