import { afterAll, describe, expect, it } from 'vitest'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = resolve(import.meta.dirname, '..')
const scratch: string[] = []
let nextPort = 4200
async function makeCopy() {
  const dir = await mkdtemp(resolve(tmpdir(), 'and-scene-verify-fault-'))
  scratch.push(dir)
  const app = resolve(dir, 'app')
  await mkdir(resolve(app, 'scripts'), { recursive: true })
  await cp(resolve(repo, 'src'), resolve(app, 'src'), { recursive: true })
  await cp(resolve(repo, 'scripts/verify.mjs'), resolve(app, 'scripts/verify.mjs'), { recursive: true })
  await cp(resolve(repo, 'scripts/inspection-diagnostics.mjs'), resolve(app, 'scripts/inspection-diagnostics.mjs'))
  await cp(resolve(repo, 'package.json'), resolve(app, 'package.json'))
  await cp(resolve(repo, 'index.html'), resolve(app, 'index.html'))
  await cp(resolve(repo, 'vite.config.ts'), resolve(app, 'vite.config.ts'))
  for (const config of ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) await cp(resolve(repo, config), resolve(app, config))
  await symlink(resolve(repo, 'node_modules'), resolve(app, 'node_modules'), 'dir')
  return app
}
async function verifyFault(change: (app: string) => Promise<void>) {
  const app = await makeCopy()
  await change(app)
  const result = spawnSync('npm', ['run', 'verify'], { cwd: app, encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, AND_SCENE_VERIFY_PORT: String(nextPort++) } })
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` }
}
afterAll(async () => { await Promise.all(scratch.map(path => rm(path, { recursive: true, force: true }))) })

describe('production verification failure contract (E2E-002)', () => {
  it('fails a build-breaking copy before browser startup', async () => {
    const result = await verifyFault(async app => {
      const file = resolve(app, 'src/main.tsx')
      await writeFile(file, `${await readFile(file, 'utf8')}\nconst compileFailure: number = 'broken'\n`)
    })
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('FAIL:')
    expect(result.output).toContain('build')
  }, 180_000)

  it('rejects a missing canonical title in the isolated sample', async () => {
    const result = await verifyFault(async app => {
      const file = resolve(app, 'src/presentations/how-to-make-a-presentation/steps/index.tsx')
      await writeFile(file, (await readFile(file, 'utf8')).replace('You have a topic', 'Missing title'))
    })
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('sample outline check failed')
  }, 180_000)

  it('rejects a rendered title that differs from the canonical outline even when the source text is present', async () => {
    const result = await verifyFault(async app => {
      const file = resolve(app, 'src/presentations/how-to-make-a-presentation/steps/index.tsx')
      const source = await readFile(file, 'utf8')
      const titlesLine = source.split('\n').find(line => line.startsWith('const titles = '))!
      await writeFile(file, source.replace(titlesLine, `export const UNUSED_CANONICAL ${titlesLine.slice('const titles'.length)}\n${titlesLine.replace("'You have a topic'", "'Unused title'")}`))
    })
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('step 1 outline check failed')
  }, 180_000)

  it('identifies the step that emits a browser console error', async () => {
    const result = await verifyFault(async app => {
      const file = resolve(app, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      const source = await readFile(file, 'utf8')
      await writeFile(file, source.replace('return <SceneLayer', 'if (beat === 3) console.error("injected console failure")\n  return <SceneLayer'))
    })
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('step 3 render failed')
  }, 180_000)

  it('identifies the step whose public index does not advance', async () => {
    const result = await verifyFault(async app => {
      const file = resolve(app, 'src/presentation-kit/usePresentationNav.ts')
      await writeFile(file, (await readFile(file, 'utf8')).replace('goTo(safeIndex + 1)', 'goTo(safeIndex)'))
    })
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('step 2 transition failed')
  }, 180_000)
})
