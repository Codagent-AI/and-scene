// E2E-002: every verification phase fails loudly on a throwaway copy of the repository.
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { REPO_ROOT, copyProject, edit, portOpen, previewPort, run, tmpDir } from '../helpers/project.mjs'

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const copies = []

/** Applies one fault to a fresh copy of the repository and runs `npm run verify` in it. */
async function verifyWithFault(fault) {
  const dir = copyProject(REPO_ROOT, tmpDir('and-scene-fault-'))
  copies.push(dir)
  fault(dir)
  const result = await run('npm', ['run', 'verify'], { cwd: dir })
  return { ...result, dir }
}

async function expectFailure(result, { phase, step }) {
  expect(result.code, result.output).not.toBe(0)
  expect(result.output).not.toContain('VERIFY PASS')
  expect(result.stderr).toMatch(new RegExp(`VERIFY FAIL \\[${phase}\\]${step ? ` step ${step}\\b` : ''}`))
  const port = previewPort(result.output)
  if (port) expect(await portOpen(port), 'preview server still running').toBe(false)
}

afterAll(() => {
  for (const dir of copies) fs.rmSync(dir, { recursive: true, force: true })
})

describe('verification failures', () => {
  it('fails the build phase on a type error, before any browser work', async () => {
    const result = await verifyWithFault((dir) =>
      edit(path.join(dir, SAMPLE, 'steps/index.ts'), (s) => `${s}\nexport const broken: number = 'not a number'\n`),
    )
    await expectFailure(result, { phase: 'build' })
    expect(result.stderr).toMatch(/TS2322|not assignable/)
    expect(result.stdout).not.toContain('preview http')
  })

  it('fails when the reference sample is not registered', async () => {
    const result = await verifyWithFault((dir) =>
      edit(path.join(dir, 'src/presentations/index.ts'), (s) => s.replace(/\n {2}\{\n {4}slug: 'how-to-make-a-presentation'[\s\S]*?\n {2}\},/, '')),
    )
    await expectFailure(result, { phase: 'reference-sample' })
    expect(result.stderr).toContain('is not registered')
  })

  it('fails when the sample steps are out of order, naming the step', async () => {
    const result = await verifyWithFault((dir) =>
      edit(path.join(dir, SAMPLE, 'steps/index.ts'), (s) => s.replace('step2, step3,', 'step3, step2,')),
    )
    await expectFailure(result, { phase: 'reference-sample', step: 2 })
    expect(result.stderr).toContain('The skill interviews you')
  })

  it('fails when a step has the wrong step count', async () => {
    const result = await verifyWithFault((dir) =>
      edit(path.join(dir, SAMPLE, 'steps/index.ts'), (s) => s.replace("import { step9 } from './step9'\n", '').replace('step8, step9,', 'step8,')),
    )
    await expectFailure(result, { phase: 'reference-sample' })
    expect(result.stderr).toContain('expected 9 steps, found 8')
  })

  it('fails on a console error and names the step that emitted it', async () => {
    const result = await verifyWithFault((dir) =>
      edit(path.join(dir, SAMPLE, 'scene.tsx'), (s) =>
        s
          .replace("import { Blocks,", "import { useEffect } from 'react'\nimport { Blocks,")
          .replace('  return (\n    <SceneLayer>', "  useEffect(() => {\n    if (payload.upTo === 4) console.error('boom at four')\n  }, [payload.upTo])\n  return (\n    <SceneLayer>"),
      ),
    )
    await expectFailure(result, { phase: 'render', step: 4 })
    expect(result.stderr).toContain('boom at four')
  })

  it('fails on an uncaught page error and names the step', async () => {
    const result = await verifyWithFault((dir) =>
      edit(path.join(dir, SAMPLE, 'scene.tsx'), (s) =>
        s
          .replace("import { Blocks,", "import { useEffect } from 'react'\nimport { Blocks,")
          .replace('  return (\n    <SceneLayer>', "  useEffect(() => {\n    if (payload.upTo === 6) setTimeout(() => { throw new Error('uncaught at six') })\n  }, [payload.upTo])\n  return (\n    <SceneLayer>"),
      ),
    )
    await expectFailure(result, { phase: 'render', step: 6 })
    expect(result.stderr).toContain('uncaught at six')
  })

  it('fails when a transition does not advance the public step index', async () => {
    const result = await verifyWithFault((dir) =>
      edit(path.join(dir, 'src/presentation-kit/usePresentationNav.ts'), (s) =>
        s.replace('clampIndex(i + 1, count)', 'clampIndex(Math.min(i + 1, 3), count)'),
      ),
    )
    await expectFailure(result, { phase: 'render', step: 5 })
    expect(result.stderr).toContain('did not advance')
  })
})
