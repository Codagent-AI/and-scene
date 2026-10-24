// E2E-001: `npm run verify` against the committed reference presentation.
import { beforeAll, describe, expect, it } from 'vitest'
import { REPO_ROOT, portOpen, previewPort, run } from '../helpers/project.mjs'

describe('npm run verify on the reference presentation', () => {
  let result

  beforeAll(async () => {
    result = await run('npm', ['run', 'verify'], { cwd: REPO_ROOT })
  })

  it('exits zero with a clear pass result', () => {
    expect(result.code, result.output).toBe(0)
    expect(result.stdout).toContain('VERIFY PASS')
    expect(result.output).not.toContain('VERIFY FAIL')
  })

  it('builds the whole app first', () => {
    expect(result.stdout).toContain('[verify] build: ok')
  })

  it('renders all nine steps of the registered sample with its normative titles and captions', () => {
    expect(result.stdout).toContain('[verify] render how-to-make-a-presentation: 9 steps ok')
  })

  it('uses the IPv4 loopback address for the preview and cleans the server up', async () => {
    expect(result.stdout).toMatch(/preview http:\/\/127\.0\.0\.1:\d+ \(host 127\.0\.0\.1\)/)
    expect(result.output).not.toMatch(/localhost|\[::1\]/)
    expect(await portOpen(previewPort(result.stdout))).toBe(false)
  })
})
