import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cp, mkdtemp, rm, symlink, readFile, readdir, writeFile, unlink, mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
let temporaryRoot: string

async function materialize() {
  const target = await mkdtemp(path.join(os.tmpdir(), 'and-scene-integration-'))
  await cp(project, target, { recursive: true, filter: (source) => !source.includes(`${path.sep}node_modules`) && !source.includes(`${path.sep}dist`) && !source.includes(`${path.sep}.git`) && !source.includes(`${path.sep}.and-scene`) })
  await symlink(path.join(project, 'node_modules'), path.join(target, 'node_modules'), 'dir')
  return target
}
function command(cwd: string, args: string[], timeout = 180000) {
  return new Promise<{ code: number; output: string }>((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => { output += chunk })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { output += chunk })
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`command timed out: ${args.join(' ')}`)) }, timeout)
    child.once('error', (error) => { clearTimeout(timer); reject(error) })
    child.once('exit', (code) => { clearTimeout(timer); resolve({ code: code ?? 1, output }) })
  })
}

describe('project-local verification and inspection scripts', () => {
  beforeAll(async () => { temporaryRoot = await materialize() })
  afterAll(async () => { if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true }) })

  it('verifies the production reference presentation in a disposable project', async () => {
    const result = await command(temporaryRoot, ['scripts/verify.mjs'])
    expect(result.code, result.output).toBe(0)
    expect(result.output).toContain('PASS verify')
    expect(result.output).toContain('render')
  })

  it('captures settled screenshots without writing into the source checkout', async () => {
    const sourceArtifactsBefore = await sourceArtifactSnapshot()
    const result = await command(temporaryRoot, ['scripts/inspect-presentation.mjs', 'how-to-make-a-presentation', '--settle=25'])
    expect(result.code, result.output).toBe(0)
    expect(result.output).toContain('PASS inspect')
    const screenshots = await readdir(path.join(temporaryRoot, '.and-scene/screenshots/how-to-make-a-presentation'))
    expect(screenshots).toEqual(Array.from({ length: 9 }, (_, index) => `step-${String(index + 1).padStart(2, '0')}.png`))
    expect(await sourceArtifactSnapshot()).toEqual(sourceArtifactsBefore)
  })

  it('reports actionable failures for build, sample, runtime, and transition phases', async () => {
    const expectationsPath = path.join(temporaryRoot, 'scripts/reference-sample.json')
    const navPath = path.join(temporaryRoot, 'src/presentation-kit/usePresentationNav.ts')
    const talkPath = path.join(temporaryRoot, 'src/presentations/how-to-make-a-presentation/Talk.tsx')
    const expectations = await readFile(expectationsPath, 'utf8')
    const nav = await readFile(navPath, 'utf8')
    const talk = await readFile(talkPath, 'utf8')
    try {
      await writeFile(path.join(temporaryRoot, 'src/verification-fault.ts'), 'const broken: number = "not a number"\n')
      const buildFailure = await command(temporaryRoot, ['scripts/verify.mjs'])
      expect(buildFailure.code).not.toBe(0)
      expect(buildFailure.output).toContain('build')
      await unlink(path.join(temporaryRoot, 'src/verification-fault.ts'))

      await writeFile(expectationsPath, expectations.replace('how-to-make-a-presentation', 'missing-reference'))
      const sampleFailure = await command(temporaryRoot, ['scripts/verify.mjs'])
      expect(sampleFailure.code).not.toBe(0)
      expect(sampleFailure.output).toContain('sample')
      await writeFile(expectationsPath, expectations)

      await writeFile(talkPath, talk.replace('return <Presentation', "console.error('intentional verification fault'); return <Presentation"))
      const renderFailure = await command(temporaryRoot, ['scripts/verify.mjs'])
      expect(renderFailure.code).not.toBe(0)
      expect(renderFailure.output).toContain('render')
      expect(renderFailure.output).toContain('step 1')
      await expectPreviewListenerClosed(renderFailure.output)
      await writeFile(talkPath, talk)

      await writeFile(navPath, nav.replace('const next = useCallback(() => setIndex((current) => Math.min(Math.max(0, stepCount - 1), Math.max(0, current) + 1))', 'const next = useCallback(() => setIndex((current) => current)'))
      const transitionFailure = await command(temporaryRoot, ['scripts/verify.mjs'])
      expect(transitionFailure.code).not.toBe(0)
      expect(transitionFailure.output).toContain('render')
      expect(transitionFailure.output).toContain('step 2')
      await expectPreviewListenerClosed(transitionFailure.output)
    } finally {
      await writeFile(expectationsPath, expectations)
      await writeFile(navPath, nav)
      await writeFile(talkPath, talk)
      await rm(path.join(temporaryRoot, 'src/verification-fault.ts'), { force: true })
    }
  })

  it('runs without reference expectations in a scaffold-style copy', async () => {
    await rm(path.join(temporaryRoot, 'scripts/reference-sample.json'))
    const result = await command(temporaryRoot, ['scripts/verify.mjs'])
    expect(result.code, result.output).toBe(0)
    expect(result.output).toContain('PASS verify')
  })

  it('reports inspection warnings per step and exempts marked overlaps', async () => {
    const registryPath = path.join(temporaryRoot, 'src/presentations/index.ts')
    const originalRegistry = await readFile(registryPath, 'utf8')
    const fixtureDir = path.join(temporaryRoot, 'src/presentations/inspection-fixture')
    await mkdir(fixtureDir, { recursive: true })
    await writeFile(path.join(fixtureDir, 'Talk.tsx'), `
import { Presentation } from '../../presentation-kit/Presentation'
import type { SceneProps, Step } from '../../presentation-kit/types'
function Scene({ index }: SceneProps) { return <>
  <div style={{ position: 'absolute', left: 20, top: 20, width: 150, height: 60, zIndex: 2 }}>unmarked-left-{index}</div>
  <div style={{ position: 'absolute', left: 60, top: 35, width: 150, height: 60, zIndex: 3 }}>unmarked-right-{index}</div>
  <div data-presentation-allow-overlap="true" style={{ position: 'absolute', left: 400, top: 20 }}>
    <span style={{ position: 'absolute' }}>allowed-first-{index}</span><span style={{ position: 'absolute' }}>allowed-second-{index}</span>
  </div>
</> }
const steps: Step[] = [1, 2].map((index) => ({ id: String(index), era: 'fixture', title: 'Fixture ' + index, caption: 'Fixture caption ' + index, Scene, payload: undefined }))
export default function Talk() { return <Presentation steps={steps} title="Inspection fixture" /> }
`)
    await writeFile(registryPath, originalRegistry.replace(/\n\]/, "\n  { slug: 'inspection-fixture', title: 'Inspection fixture', load: () => import('./inspection-fixture/Talk') },\n]"))
    try {
      const started = Date.now()
      const result = await command(temporaryRoot, ['scripts/inspect-presentation.mjs', 'inspection-fixture', '--settle=150'])
      expect(result.code, result.output).toBe(0)
      expect(result.output).toContain('Captured step 1/2')
      expect(result.output).toContain('Captured step 2/2')
      expect(result.output).toContain('step 1: overlap between')
      expect(result.output).toContain('unmarked-left-0')
      expect(result.output).toContain('unmarked-right-0')
      expect(result.output).toContain('step 2: overlap between')
      expect(result.output).toContain('visually indistinguishable')
      expect(result.output).toContain('browser-default')
      expect(result.output).not.toContain('allowed-first')
      expect(Date.now() - started).toBeGreaterThanOrEqual(300)
      expect(await readdir(path.join(temporaryRoot, '.and-scene/screenshots/inspection-fixture'))).toEqual(['step-01.png', 'step-02.png'])
    } finally {
      await writeFile(registryPath, originalRegistry)
      await rm(fixtureDir, { recursive: true, force: true })
    }
  })
})

async function sourceArtifactSnapshot() {
  const directory = path.join(project, '.and-scene/screenshots/how-to-make-a-presentation')
  const files = await readdir(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  return Object.fromEntries(await Promise.all(files.map(async (filename) => {
    const contents = await readFile(path.join(directory, filename))
    return [filename, createHash('sha256').update(contents).digest('hex')]
  })))
}

async function expectPreviewListenerClosed(output: string) {
  const preview = output.match(/http:\/\/127\.0\.0\.1:(\d+)\//)
  expect(preview, output).not.toBeNull()
  const port = Number(preview![1])
  const probe = await new Promise<'connected' | NodeJS.ErrnoException['code'] | 'timeout'>((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    const finish = (result: 'connected' | NodeJS.ErrnoException['code'] | 'timeout') => { socket.destroy(); resolve(result) }
    socket.once('connect', () => finish('connected'))
    socket.once('error', (error: NodeJS.ErrnoException) => finish(error.code))
    socket.setTimeout(1000, () => finish('timeout'))
  })
  expect(probe, `preview listener remains open at 127.0.0.1:${port}`).toBe('ECONNREFUSED')
}
