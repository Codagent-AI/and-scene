import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createIsolatedRepoCopy, removeIsolatedRepoCopy, REPO_ROOT, runVerify } from './helpers/isolated-copy'

/**
 * E2E-002: verification failures are actionable. Each test injects one fault
 * into an isolated, disposable copy of the repo (never the source checkout),
 * then asserts `npm run verify` exits non-zero, names the failing phase (and
 * offending step, where applicable), and never reports success.
 */

let tempDir: string | undefined

afterEach(() => {
  if (tempDir) {
    removeIsolatedRepoCopy(tempDir)
    tempDir = undefined
  }
})

describe('E2E-002: verification failures are actionable', () => {
  it('fails the build phase and never reports PASS on a type error', () => {
    tempDir = createIsolatedRepoCopy('and-scene-e2e-fault-build-')
    expect(tempDir).not.toContain(REPO_ROOT)

    const stepsPath = path.join(tempDir, 'src', 'presentations', 'how-to-make-a-presentation', 'steps.ts')
    const source = readFileSync(stepsPath, 'utf8')
    writeFileSync(stepsPath, `${source}\nconst __typeError: number = 'not a number'\n`)

    const result = runVerify(tempDir)

    expect(result.status).not.toBe(0)
    expect(result.stdout + result.stderr).toMatch(/\[verify\] FAIL: npm run build did not succeed/)
    expect(result.stdout).not.toMatch(/\[verify\] PASS/)

    const sourceStillIntact = readFileSync(
      path.join(REPO_ROOT, 'src', 'presentations', 'how-to-make-a-presentation', 'steps.ts'),
      'utf8',
    )
    expect(sourceStillIntact).not.toContain('__typeError')
  }, 180_000)

  it('fails when the reference sample is missing from the registry', () => {
    tempDir = createIsolatedRepoCopy('and-scene-e2e-fault-missing-sample-')

    const registryPath = path.join(tempDir, 'src', 'presentations', 'index.ts')
    const source = readFileSync(registryPath, 'utf8')
    writeFileSync(registryPath, source.replace(/export const presentations[\s\S]*$/, 'export const presentations: PresentationRegistryEntry[] = []\n'))

    const result = runVerify(tempDir)

    expect(result.status).not.toBe(0)
    expect(result.stdout + result.stderr).toMatch(/\[verify\] FAIL: no presentations are registered/)
    expect(result.stdout).not.toMatch(/\[verify\] PASS/)
  }, 180_000)

  it('fails and names the offending step when it throws a console error', () => {
    tempDir = createIsolatedRepoCopy('and-scene-e2e-fault-console-error-')

    const scenePath = path.join(tempDir, 'src', 'presentations', 'how-to-make-a-presentation', 'MainScene.tsx')
    const source = readFileSync(scenePath, 'utf8')
    const withFault = source.replace(
      "export function MainScene({ payload }: SceneProps<ScenePayload>) {\n  const { step } = payload",
      "export function MainScene({ payload }: SceneProps<ScenePayload>) {\n  const { step } = payload\n  if (step === 4 && typeof window !== 'undefined') {\n    // eslint-disable-next-line no-console -- deliberate fault injection for E2E-002\n    console.error('injected fault: step 4 is broken')\n  }",
    )
    expect(withFault).not.toEqual(source)
    writeFileSync(scenePath, withFault)

    const result = runVerify(tempDir)

    expect(result.status).not.toBe(0)
    expect(result.stdout + result.stderr).toMatch(/step 3.*console error: injected fault: step 4 is broken/s)
    expect(result.stdout).not.toMatch(/\[verify\] PASS/)
  }, 180_000)

  it('fails and names the offending step when a transition does not advance', () => {
    tempDir = createIsolatedRepoCopy('and-scene-e2e-fault-stalled-transition-')

    const navPath = path.join(tempDir, 'src', 'presentation-kit', 'usePresentationNav.ts')
    const source = readFileSync(navPath, 'utf8')
    const withFault = source.replace(
      'const next = useCallback(() => {\n    setStepIndex((current) => clamp(current + 1))\n  }, [clamp])',
      'const next = useCallback(() => {\n    setStepIndex((current) => (current === 2 ? current : clamp(current + 1)))\n  }, [clamp])',
    )
    expect(withFault).not.toEqual(source)
    writeFileSync(navPath, withFault)

    const result = runVerify(tempDir)

    expect(result.status).not.toBe(0)
    expect(result.stdout + result.stderr).toMatch(/step 2 did not advance to step 3: data-step-index is still 2/)
    expect(result.stdout).not.toMatch(/\[verify\] PASS/)
  }, 180_000)
})
