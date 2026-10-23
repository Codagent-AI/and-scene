import { afterAll, describe, expect, it } from 'vitest'
import { cleanupTmp, portIsClosed, processesMentioning, run, tmpDir } from '../helpers/proc'
import { ROOT, specOutline } from '../helpers/spec-outline'

afterAll(cleanupTmp)

// E2E-001: the reference presentation passes production verification.
describe('E2E-001: `npm run verify` on the committed repository', () => {
  it('builds, finds the nine-step sample, renders every step on 127.0.0.1 and exits zero with a clear pass', async () => {
    const scratch = tmpDir('e2e001-tmp') // the browser profile lives here, so leftover browsers are findable
    const result = await run('npm', ['run', 'verify', '--silent'], { cwd: ROOT, timeoutMs: 400000, env: { TMPDIR: scratch } })
    const out = result.stdout + result.stderr
    expect(result.code, out).toBe(0)
    expect(result.stdout).toMatch(/^PASS verify:/m)
    expect(out).not.toMatch(/FAIL/)

    // build then sample then render, in order
    const order = ['build: ok', 'sample: "how-to-make-a-presentation" is registered and matches its 9-step outline', 'render: opening']
    let at = -1
    for (const marker of order) {
      const next = out.indexOf(marker)
      expect(next, marker).toBeGreaterThan(at)
      at = next
    }
    expect(specOutline()).toHaveLength(9)

    // every one of the nine step indices observed in order
    expect(out).toContain('observed step indices 0,1,2,3,4,5,6,7,8 with no console or page errors')

    // IPv4 loopback for the preview host, the readiness probe and the browser URL
    const probe = /preview host 127\.0\.0\.1 port (\d+); readiness probe http:\/\/127\.0\.0\.1:\1\//.exec(out)
    expect(probe, out).not.toBeNull()
    const port = Number(probe![1])
    expect(out).toContain(`render: opening http://127.0.0.1:${port}/how-to-make-a-presentation`)
    expect(out).not.toMatch(/localhost|\[::1\]/)

    // the preview is gone once verification exits
    expect(await portIsClosed(port)).toBe(true)
    // and so is the browser it launched
    expect(processesMentioning(scratch)).toEqual([])
  })
})
