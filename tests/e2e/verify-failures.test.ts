import { rmSync } from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { copyProject, edit, isListening, previewPort, run, type RunResult } from '../helpers/project'

// E2E-002: each verification phase fails loudly, names the offending phase and step, and
// never leaves a preview process behind.
const dirs: string[] = []
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

async function verifyWithFault(inject: (dir: string) => void): Promise<RunResult> {
  const dir = copyProject()
  dirs.push(dir)
  inject(dir)
  return run('npm', ['run', 'verify'], dir)
}

async function expectCleanFailure(result: RunResult, pattern: RegExp) {
  expect(result.code).not.toBe(0)
  expect(result.stdout).not.toMatch(/^PASS/m)
  expect(result.stderr).toMatch(pattern)
  const port = previewPort(result.stdout)
  if (port !== null) expect(await isListening(port)).toBe(false)
}

describe('E2E-002 verification failures are actionable', () => {
  it('fails the build phase on a type error', async () => {
    const result = await verifyWithFault((dir) =>
      edit(dir, 'src/Landing.tsx', 'export function Landing', "export const broken: number = 'nope'\nexport function Landing"),
    )
    await expectCleanFailure(result, /FAIL \[build\] npm run build failed/)
    expect(result.stderr).toMatch(/Landing\.tsx/)
    expect(previewPort(result.stdout)).toBeNull()
  })

  it('fails when the reference sample is not registered', async () => {
    const result = await verifyWithFault((dir) =>
      edit(dir, 'src/presentations/index.ts', /export const presentations: RegistryEntry\[\] = \[[\s\S]*\n\]/, 'export const presentations: RegistryEntry[] = []'),
    )
    await expectCleanFailure(result, /FAIL \[sample\] required presentation "how-to-make-a-presentation" is not registered/)
  })

  it('fails when the sample steps are out of order', async () => {
    const result = await verifyWithFault((dir) => {
      const file = 'src/presentations/how-to-make-a-presentation/steps/steps.ts'
      edit(dir, file, "'Answers become steps'", "'__SWAP__'")
      edit(dir, file, "'The deck grows'", "'Answers become steps'")
      edit(dir, file, "'__SWAP__'", "'The deck grows'")
    })
    await expectCleanFailure(result, /FAIL \[sample\] how-to-make-a-presentation step 3: expected title "Answers become steps" but found "The deck grows"/)
  })

  it('fails and names the step when a step emits a console error', async () => {
    const result = await verifyWithFault((dir) =>
      edit(
        dir,
        'src/presentation-kit/Presentation.tsx',
        'const wide = useIsWide()',
        "const wide = useIsWide()\n  useEffect(() => {\n    if (index === 3) console.error('injected failure')\n  }, [index])",
      ),
    )
    await expectCleanFailure(result, /FAIL \[render\] how-to-make-a-presentation step 4: console\.error: injected failure/)
  })

  it('fails and names the step when a transition does not advance the step index', async () => {
    const result = await verifyWithFault((dir) =>
      edit(dir, 'src/presentation-kit/usePresentationNav.ts', 'Math.min(count - 1, Math.max(0, index))', 'Math.min(Math.min(count - 1, 2), Math.max(0, index))'),
    )
    await expectCleanFailure(result, /FAIL \[transition\] how-to-make-a-presentation step 3: ArrowRight did not advance data-step-index to 3/)
  })
})
