// E2E-001: `npm run verify` from the repository root passes on the committed sample.
import { describe, expect, it } from 'vitest'
import { isListening, leftoverPreviews, previewPortFrom, repoRoot, run } from '../helpers/process.mjs'

describe('E2E-001 production verification of the reference sample', () => {
  it('builds, serves on 127.0.0.1, steps through all nine steps, exits zero and cleans up', async () => {
    const result = run('npm', ['run', 'verify'], { cwd: repoRoot })
    expect(result.status, result.out).toBe(0)
    expect(result.out).toMatch(/phase build/)
    expect(result.out).toMatch(/PASS verify: build, sample outline, render of 1 presentation\(s\)/)
    expect(result.out).toMatch(/outline: 9 steps match, in order/)
    expect(result.out).toMatch(/stepped through 9 steps/)
    expect(result.out).not.toMatch(/localhost/)
    const urls = [...result.out.matchAll(/https?:\/\/[^\s)]+/g)].map((m) => m[0])
    expect(urls.length).toBeGreaterThan(1)
    for (const url of urls) expect(url, url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\//)
    expect(urls.some((u) => u.endsWith('/how-to-make-a-presentation'))).toBe(true)
    const port = previewPortFrom(result.out)
    expect(port).not.toBeNull()
    expect(await isListening(port)).toBe(false)
    expect(leftoverPreviews(port)).toEqual([])
  })
})
