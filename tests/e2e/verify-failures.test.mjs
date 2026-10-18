// E2E-002: verification failures are actionable, in disposable copies of the repository.
import { spawn } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { copyRepo, freePort, portIsClosed, sh } from '../helpers/project.mjs'

const SAMPLE = 'src/presentations/how-to-make-a-presentation'

function edit(dir, rel, fn) {
  const file = path.join(dir, rel)
  const before = readFileSync(file, 'utf8')
  const after = fn(before)
  expect(after, `${rel} was not changed`).not.toBe(before)
  writeFileSync(file, after)
}

async function failingRun(mutate) {
  const dir = copyRepo()
  mutate(dir)
  const port = await freePort()
  const r = sh('npm', ['run', 'verify'], dir, { VERIFY_PORT: String(port) })
  expect(await portIsClosed(port), 'preview left running').toBe(true)
  return r
}

describe('E2E-002 verification failures', () => {
  it('fails the build phase on a type error in a non-sample presentation', async () => {
    const r = await failingRun((dir) => {
      mkdirSync(path.join(dir, 'src/presentations/broken'), { recursive: true })
      writeFileSync(path.join(dir, 'src/presentations/broken/Talk.tsx'), "export const bad: number = 'text'\nexport default function Talk() { return null }\n")
    })
    expect(r.status).not.toBe(0)
    expect(r.output).toContain('VERIFY FAILED: build')
    expect(r.output).not.toContain('VERIFY PASSED')
  })

  it('fails the sample phase when the sample is missing', async () => {
    const r = await failingRun((dir) => {
      rmSync(path.join(dir, SAMPLE), { recursive: true })
      edit(dir, 'src/presentations/index.ts', (s) => s.replace(/\n  \{\n    slug: 'how-to-make-a-presentation'[\s\S]*?\n  \},/, ''))
    })
    expect(r.status).not.toBe(0)
    expect(r.output).toContain('VERIFY FAILED: sample')
    expect(r.output).toContain('not registered')
  })

  it('fails the sample phase when the steps are out of order', async () => {
    const r = await failingRun((dir) =>
      edit(dir, `${SAMPLE}/meta.ts`, (s) =>
        s.replace("'You have a topic'", '@@').replace("'The skill interviews you'", "'You have a topic'").replace('@@', "'The skill interviews you'"),
      ),
    )
    expect(r.status).not.toBe(0)
    expect(r.output).toContain('VERIFY FAILED: sample')
    expect(r.output).toMatch(/step 1 title/)
  })

  it('names the failing step for a console error', async () => {
    const r = await failingRun((dir) =>
      edit(dir, `${SAMPLE}/steps/SampleScene.tsx`, (s) => s.replace('const delay =', "if (beat === 5) console.error('boom-injected')\n  const delay =")),
    )
    expect(r.status).not.toBe(0)
    expect(r.output).toContain('VERIFY FAILED: render')
    expect(r.output).toMatch(/at step index 4: console\.error: boom-injected/)
  })

  it('names the failing step for an uncaught page error', async () => {
    const r = await failingRun((dir) =>
      edit(dir, `${SAMPLE}/steps/SampleScene.tsx`, (s) =>
        s.replace('const delay =', "if (beat === 6) setTimeout(() => { throw new Error('late-boom') }, 0)\n  const delay ="),
      ),
    )
    expect(r.status).not.toBe(0)
    expect(r.output).toMatch(/at step index 5: uncaught page error: late-boom/)
  })

  it('names the step whose transition does not advance the public step index', async () => {
    const r = await failingRun((dir) =>
      edit(dir, 'src/presentation-kit/usePresentationNav.ts', (s) => s.replace('Math.min(count - 1, index)', 'Math.min(Math.min(count - 1, 2), index)')),
    )
    expect(r.status).not.toBe(0)
    expect(r.output).toContain('VERIFY FAILED: render')
    expect(r.output).toMatch(/at step index 3: transition did not advance/)
  })

  it('stops the preview and names the render phase when the browser cannot start', async () => {
    const dir = copyRepo()
    const port = await freePort()
    const r = sh('npm', ['run', 'verify'], dir, { VERIFY_PORT: String(port), PLAYWRIGHT_BROWSERS_PATH: '/nonexistent-browsers' })
    expect(r.status).not.toBe(0)
    expect(r.output).toContain('VERIFY FAILED: render')
    expect(r.output).toMatch(/preview\/browser error/)
    expect(await portIsClosed(port)).toBe(true)
  })

  it('stops a preview that is still starting when the process is terminated', async () => {
    const dir = copyRepo()
    const port = await freePort()
    writeFileSync(
      path.join(dir, 'scripts/hold.mjs'),
      "import { withPreview, projectRoot } from './lib.mjs'\nawait withPreview(projectRoot(), Number(process.env.VERIFY_PORT), () => new Promise(() => {}))\n",
    )
    mkdirSync(path.join(dir, 'dist'), { recursive: true })
    writeFileSync(path.join(dir, 'dist/index.html'), '<html></html>')
    const child = spawn(process.execPath, ['scripts/hold.mjs'], { cwd: dir, env: { ...process.env, VERIFY_PORT: String(port) } })
    const exited = new Promise((resolve) => child.once('exit', resolve))
    const previewPids = () => sh('pgrep', ['-f', `vite.js preview --host 127.0.0.1 --port ${port}`], dir).output.trim()
    const deadline = Date.now() + 10000
    while (!previewPids() && Date.now() < deadline) await new Promise((r) => setTimeout(r, 5))
    expect(previewPids()).not.toBe('')
    child.kill('SIGTERM') // delivered while the preview is spawned, possibly before it answers its probe
    await exited
    await new Promise((r) => setTimeout(r, 500))
    expect(previewPids()).toBe('')
    expect(await portIsClosed(port)).toBe(true)
  })
})
