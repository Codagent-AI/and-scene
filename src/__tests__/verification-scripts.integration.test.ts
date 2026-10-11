import { afterAll, describe, expect, it } from 'vitest'
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { closeSync, openSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { execFileSync } from 'node:child_process'

const checkout = process.cwd()
const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-scripts-'))
const projects: string[] = []
let commandId = 0
const sample = 'src/presentations/how-to-make-a-presentation/steps/01.tsx'
const registry = 'src/presentations/index.ts'

async function disposable(name: string) {
  const root = path.join(tempRoot, name)
  await cp(checkout, root, {
    recursive: true,
    filter: source => !/(^|\/)(node_modules|dist|\.git|\.and-scene)(\/|$)/.test(source),
  })
  await symlink(path.join(checkout, 'node_modules'), path.join(root, 'node_modules'), 'dir')
  projects.push(root)
  return root
}

function command(root: string, script: string, args: string[] = []) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const log = path.join(tempRoot, `command-${process.pid}-${commandId++}.log`)
    const descriptor = openSync(log, 'w')
    // File descriptors let leaked grandchildren be detected without keeping
    // the script's stdout pipe open after its own process exits.
    const child = spawn(process.execPath, [script, ...args], { cwd: root, env: { ...process.env, CI: '1' }, stdio: ['ignore', descriptor, descriptor] })
    child.once('error', reject)
    child.once('close', async code => {
      closeSync(descriptor)
      resolve({ code, output: await readFile(log, 'utf8') })
    })
  })
}

async function verify(root: string, args: string[] = []) {
  return command(root, 'scripts/verify.mjs', args)
}

function expectPreviewStopped(root: string) {
  const processes = execFileSync('ps', ['-eo', 'args'], { encoding: 'utf8' })
  expect(processes.split('\n').some(line => line.startsWith(`node ${root}/node_modules/.bin/vite preview`))).toBe(false)
}

afterAll(async () => {
  await Promise.all(projects.map(root => rm(root, { recursive: true, force: true })))
  await rm(tempRoot, { recursive: true, force: true })
})

describe('project verification scripts in disposable project copies', () => {
  it('passes strict production verification of the registered nine-step sample', async () => {
    const root = await disposable('strict-success')
    const result = await verify(root)
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/PASS:.*build.*sample.*render/i)
    expect(result.output).toContain('127.0.0.1')
    expectPreviewStopped(root)
  }, 180_000)

  it.each([
    ['missing sample', async (root: string) => {
      await rm(path.join(root, 'src/presentations/how-to-make-a-presentation'), { recursive: true })
    }, /FAIL: sample:.*canonical sample source is missing/i],
    ['out-of-order sample', async (root: string) => {
      const file = path.join(root, 'src/presentations/how-to-make-a-presentation/steps/index.ts')
      const source = await readFile(file, 'utf8')
      await writeFile(file, source.replace('step01, step02', 'step02, step01'))
    }, /FAIL: sample:.*step order/i],
    ['build failure', async (root: string) => {
      await writeFile(path.join(root, 'src/presentations/how-to-make-a-presentation/steps/broken.tsx'), 'export const broken: number = "not a number"')
      const index = path.join(root, 'src/presentations/how-to-make-a-presentation/steps/index.ts')
      await writeFile(index, `${await readFile(index, 'utf8')}\nimport './broken'\n`)
    }, /FAIL: build:/i],
    ['browser console fault', async (root: string) => {
      const file = path.join(root, sample)
      const source = await readFile(file, 'utf8')
      await writeFile(file, source.replace('export const step01:', "if (typeof window !== 'undefined') console.error('injected browser fault')\nexport const step01:"))
    }, /FAIL: render:.*console\.error at step 1: injected browser fault/i],
    ['stuck public step index', async (root: string) => {
      const file = path.join(root, 'src/presentation-kit/usePresentationNav.ts')
      const source = await readFile(file, 'utf8')
      await writeFile(file, source.replace('setIndex((current) => Math.min(count - 1, current + 1))', 'setIndex((current) => current)'))
    }, /FAIL: render:.*step 2: step transition did not advance/i],
  ])('reports %s with its phase and cleans up the preview', async (_label, mutate, expected) => {
    const root = await disposable(`failure-${String(_label).replaceAll(' ', '-')}`)
    await mutate(root)
    const result = await verify(root)
    expect(result.code, result.output).not.toBe(0)
    expect(result.output).toMatch(expected)
    expect(result.output).not.toMatch(/PASS:/)
    expectPreviewStopped(root)
  }, 180_000)

  it('supports smoke success and rejects empty registries and unknown slugs', async () => {
    const success = await disposable('smoke-success')
    const good = await verify(success, ['--smoke'])
    expect(good.code, good.output).toBe(0)
    expect(good.output).toMatch(/PASS:/)
    expectPreviewStopped(success)

    const empty = await disposable('smoke-empty')
    await writeFile(path.join(empty, registry), "export const presentations = []\n")
    const emptyResult = await verify(empty, ['--smoke'])
    expect(emptyResult.code).not.toBe(0)
    expect(emptyResult.output).toMatch(/FAIL: render:.*registry is empty/i)

    const unknown = await disposable('smoke-unknown')
    const unknownResult = await verify(unknown, ['--smoke', '--slug', 'not-registered'])
    expect(unknownResult.code).not.toBe(0)
    expect(unknownResult.output).toMatch(/FAIL: render:.*unknown presentation slug/i)
  }, 360_000)
})

describe('inspection helper browser artifacts and advisories', () => {
  it('captures settled per-step screenshots and diagnoses collision, active chrome, and attribution', async () => {
    const root = await disposable('inspection')
    const fixture = `import { Presentation } from '../presentation-kit/Presentation'
import type { Step } from '../presentation-kit/types'
import './fixture.css'
type Payload = { step: number }
function Scene({ payload }: { payload: Payload }) {
  return <><div className="collision-a">collision alpha</div><div className="collision-b">collision beta</div><div data-presentation-allow-overlap=""><div className="allowed-a">allowed alpha</div><div className="allowed-b">allowed beta</div></div><div className="step-state">settled step {payload.step}</div></>
}
const steps: Step<Payload>[] = [1, 2].map(step => ({ id: String(step), era: step === 1 ? 'fixture first' : 'fixture second', title: 'Fixture', caption: 'Fixture step', diagram: { scene: Scene, payload: { step } } }))
export default function Fixture() { return <Presentation steps={steps} title="Diagnostic fixture" /> }
`
    await writeFile(path.join(root, 'src/presentations/fixture.tsx'), fixture)
    await writeFile(path.join(root, 'src/presentations/fixture.css'), `.collision-a,.collision-b{position:absolute;left:40px;top:40px;width:180px;height:50px}.collision-b{left:60px;top:50px}.allowed-a,.allowed-b{position:absolute;left:300px;top:40px;width:180px;height:50px}.allowed-b{left:320px;top:50px}.step-state{position:absolute;top:140px;left:40px;transition:transform 900ms ease}.step-state{transform:translateX(0)}[data-presentation-step-index="1"] .step-state{transform:translateX(24px)}[data-presentation-progress] button,[data-presentation-toc] button{color:#222!important;background:transparent!important;border-color:transparent!important;font-weight:400!important;text-decoration:none!important;box-shadow:none!important}[data-presentation-attribution]{font-size:8px!important;color:blue!important;text-decoration:underline!important}`)
    const index = path.join(root, registry)
    const source = await readFile(index, 'utf8')
    await writeFile(index, source.replace('export const presentations: readonly PresentationRegistration[] = [', "export const presentations: readonly PresentationRegistration[] = [\n  { slug: 'fixture', title: 'Fixture', load: () => import('./fixture') },"))
    const result = await command(root, 'scripts/inspect-presentation.mjs', ['fixture', '--settle-ms', '10', '--viewport', '1280x800'])
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/WARN step 1: visible overlap:.*collision alpha.*collision beta/)
    expect(result.output).not.toMatch(/WARN step \d+: visible overlap:.*allowed alpha.*allowed beta/)
    expect(result.output).toMatch(/WARN step 1: active progress indicator is visually indistinguishable/i)
    expect(result.output).toMatch(/WARN step 1: active table-of-contents entry is visually indistinguishable/i)
    expect(result.output).toMatch(/WARN step 1:.*attribution.*data-presentation-attribution/i)
    expectPreviewStopped(root)
    const screenshots = path.join(root, '.and-scene/inspection/fixture/1280x800')
    expect((await readdir(screenshots)).sort()).toEqual(['step-01.png', 'step-02.png'])
    const files = await Promise.all(['step-01.png', 'step-02.png'].map(file => readFile(path.join(screenshots, file))))
    expect(files.every(file => file.length > 1000)).toBe(true)
  }, 180_000)
})
