// @vitest-environment node
import { cp, mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

const repositoryRoot = process.cwd()
const verificationScript = join(repositoryRoot, 'scripts/verify.mjs')
const workspaces: string[] = []

async function createWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), 'and-scene-verification-'))
  workspaces.push(workspace)
  await mkdir(join(workspace, 'scripts'), { recursive: true })
  await cp(verificationScript, join(workspace, 'scripts/verify.mjs'))
  await symlink(join(repositoryRoot, 'node_modules'), join(workspace, 'node_modules'), 'dir')
  return workspace
}

async function writePackage(workspace: string, buildScript: string) {
  await writeFile(join(workspace, 'package.json'), JSON.stringify({
    type: 'module',
    scripts: { build: buildScript },
  }))
}

async function runVerification(workspace: string) {
  return await new Promise<{ code: number | null; output: string }>((resolveResult) => {
    const child = spawn(process.execPath, ['scripts/verify.mjs'], { cwd: workspace })
    let output = ''
    let settled = false
    const finish = (code: number | null) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      resolveResult({ code, output })
    }
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      finish(null)
    }, 10_000)
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('error', () => finish(null))
    child.once('exit', (code) => finish(code))
  })
}

async function copyReferenceSource(workspace: string) {
  const stepsDirectory = join(workspace, 'src/presentations/how-to-make-a-presentation/steps')
  await mkdir(stepsDirectory, { recursive: true })
  await cp(
    join(repositoryRoot, 'src/presentations/index.ts'),
    join(workspace, 'src/presentations/index.ts'),
  )
  await cp(
    join(repositoryRoot, 'src/presentations/how-to-make-a-presentation/steps/index.tsx'),
    join(stepsDirectory, 'index.tsx'),
  )
}

async function writeBrowserFixture(workspace: string, body: string) {
  await writeFile(join(workspace, 'build-fixture.mjs'), `
import { mkdir, writeFile } from 'node:fs/promises'
await mkdir('dist', { recursive: true })
await writeFile('dist/index.html', ${JSON.stringify(`<!doctype html>
<html><body>${body}</body></html>`)})
`)
  await writePackage(workspace, 'node build-fixture.mjs')
  await copyReferenceSource(workspace)
}

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { recursive: true, force: true })))
})

describe('verification failure contract', () => {
  it('reports build failures from an isolated copy', async () => {
    const workspace = await createWorkspace()
    await writeFile(join(workspace, 'fail-build.mjs'), "console.error('synthetic build failure'); process.exit(1)\n")
    await writePackage(workspace, 'node fail-build.mjs')
    await copyReferenceSource(workspace)

    const result = await runVerification(workspace)

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('verify: FAIL build verification failed:')
  })

  it('reports a missing reference sample from an isolated copy', async () => {
    const workspace = await createWorkspace()
    await writePackage(workspace, 'node -e ""')

    const result = await runVerification(workspace)

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('verify: FAIL reference sample is missing or malformed:')
  })

  it('reports browser console failures with the offending step', async () => {
    const workspace = await createWorkspace()
    await writeBrowserFixture(workspace, `
<main data-presentation>
  <div data-step-count="9" data-step-index="0"></div>
  <div data-presentation-step-title>You have a topic</div>
  <div data-presentation-caption>It starts with you, a topic, and mild overconfidence.</div>
</main>
<script>console.error('synthetic browser failure')</script>
`)

    const result = await runVerification(workspace)

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('verify: FAIL browser verification failed: step 1: console error: synthetic browser failure')
  }, 15_000)

  it('reports failed transitions with the offending step', async () => {
    const workspace = await createWorkspace()
    await writeBrowserFixture(workspace, `
<main data-presentation>
  <div data-step-count="9" data-step-index="0"></div>
  <div data-presentation-step-title>You have a topic</div>
  <div data-presentation-caption>It starts with you, a topic, and mild overconfidence.</div>
</main>
<script>
  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') event.preventDefault()
  })
</script>
`)

    const result = await runVerification(workspace)

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('verify: FAIL browser verification failed: step 1: transition stopped at 0')
  }, 15_000)
})
