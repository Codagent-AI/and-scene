import { afterAll, describe, expect, it } from 'vitest'
import { createIsolatedRepoCopy, removeIsolatedRepoCopy, REPO_ROOT, runVerify } from './helpers/isolated-copy'

/**
 * E2E-001: `npm run verify` builds the whole app, starts `vite preview` on
 * 127.0.0.1, opens the registered nine-step reference sample, and steps
 * through it end to end — the successful production verification journey.
 */

describe('E2E-001: reference presentation passes production verification', () => {
  let tempDir: string

  afterAll(() => {
    if (tempDir) removeIsolatedRepoCopy(tempDir)
  })

  it('builds, renders every step on 127.0.0.1, and exits zero with a clear pass', () => {
    tempDir = createIsolatedRepoCopy('and-scene-e2e-success-')
    expect(tempDir).not.toContain(REPO_ROOT)

    const result = runVerify(tempDir)

    expect(result.status, `verify failed:\n${result.stdout}\n${result.stderr}`).toBe(0)
    expect(result.stdout).toMatch(/\[verify\] PASS/)
    expect(result.stdout).toMatch(/preview server ready at http:\/\/127\.0\.0\.1:\d+/)
    expect(result.stdout).toMatch(/"how-to-make-a-presentation" OK \(How to Use This Skill to Make a Presentation\)/)
  }, 180_000)
})
