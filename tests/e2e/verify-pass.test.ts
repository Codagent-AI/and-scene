// E2E-001: the reference presentation passes production verification.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupTempDirs, copyApp, isPortOpen, leftoverProcesses, linkNodeModules, previewPort, run, tempDir, type RunResult } from '../helpers'

let dir: string
let result: RunResult

beforeAll(async () => {
  dir = tempDir('and-scene-e2e1-')
  copyApp(dir)
  linkNodeModules(dir)
  result = await run('npm', ['run', 'verify'], { cwd: dir, timeoutMs: 280_000 })
}, 300_000)

afterAll(cleanupTempDirs)

describe('npm run verify on the reference presentation', () => {
  it('exits zero with a clear pass', () => {
    expect(result.code, result.out).toBe(0)
    expect(result.out).toMatch(/\[verify\] PASS/)
    expect(result.out).not.toMatch(/FAIL/)
  })

  it('builds, registers the sample, and matches the nine-step outline', () => {
    expect(result.out).toMatch(/\[build\] ok/)
    expect(result.out).toMatch(/\[sample\] registered: how-to-make-a-presentation/)
    expect(result.out).toMatch(/\[sample\] how-to-make-a-presentation matches the 9-step outline/)
  })

  it('observes every one of the nine step indices without errors', () => {
    for (let i = 1; i <= 9; i++) expect(result.out).toContain(`how-to-make-a-presentation step ${i}/9 ok`)
    expect(result.out).not.toContain('step 10/')
  })

  it('uses 127.0.0.1 for the preview host, the readiness probe, and the browser URL', () => {
    expect(result.out).toMatch(/vite preview --host 127\.0\.0\.1 --port \d+/)
    expect(result.out).toMatch(/probe http:\/\/127\.0\.0\.1:\d+\//)
    expect(result.out).toMatch(/open http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    expect(result.out).not.toMatch(/localhost|\[::1\]/)
  })

  it('cleans up the preview process and releases its port', async () => {
    const port = previewPort(result.out)
    expect(port).not.toBeNull()
    expect(await isPortOpen(port!)).toBe(false)
    expect(await leftoverProcesses(dir)).toEqual([])
  })
})
