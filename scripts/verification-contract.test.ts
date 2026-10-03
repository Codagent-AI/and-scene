// @vitest-environment node
import { cp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestWorkspace, removeTestWorkspaces, repositoryRoot, runNodeScript } from './test-workspace.ts'

const workspaces: string[] = []

async function createWorkspace() {
  const workspace = await createTestWorkspace(
    'and-scene-verification-',
    join(repositoryRoot, 'scripts/verify.mjs'),
  )
  workspaces.push(workspace)
  return workspace
}

async function writePackage(workspace: string, buildScript: string) {
  await writeFile(join(workspace, 'package.json'), JSON.stringify({
    type: 'module',
    scripts: { build: buildScript },
  }))
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

const firstStepChrome = `
<main data-presentation>
  <div data-step-count="9" data-step-index="0"></div>
  <div data-presentation-step-title>You have a topic</div>
  <div data-presentation-caption>It starts with you, a topic, and mild overconfidence.</div>
</main>
`

afterEach(async () => {
  await removeTestWorkspaces(workspaces)
})

describe('verification failure contract', () => {
  it('reports build failures from an isolated copy', async () => {
    const workspace = await createWorkspace()
    await writeFile(join(workspace, 'fail-build.mjs'), "console.error('synthetic build failure'); process.exit(1)\n")
    await writePackage(workspace, 'node fail-build.mjs')
    await copyReferenceSource(workspace)

    const result = await runNodeScript(workspace, 'scripts/verify.mjs')

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('verify: FAIL build verification failed:')
  })

  it('reports a missing reference sample from an isolated copy', async () => {
    const workspace = await createWorkspace()
    await writePackage(workspace, 'node -e ""')

    const result = await runNodeScript(workspace, 'scripts/verify.mjs')

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('verify: FAIL reference sample is missing or malformed:')
  })

  it('reports browser console failures with the offending step', async () => {
    const workspace = await createWorkspace()
    await writeBrowserFixture(workspace, `
${firstStepChrome}
<script>console.error('synthetic browser failure')</script>
`)

    const result = await runNodeScript(workspace, 'scripts/verify.mjs', [], 15_000)

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('verify: FAIL browser verification failed: step 1: console error: synthetic browser failure')
  }, 15_000)

  it('reports failed transitions with the offending step', async () => {
    const workspace = await createWorkspace()
    await writeBrowserFixture(workspace, `
${firstStepChrome}
<script>
  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') event.preventDefault()
  })
</script>
`)

    const result = await runNodeScript(workspace, 'scripts/verify.mjs', [], 15_000)

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('verify: FAIL browser verification failed: step 1: transition stopped at 0')
  }, 15_000)
})
