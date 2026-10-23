import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { REPO, freePort, isListening, previewProcessAlive, run, type RunResult } from '../support/workspace.ts'

// E2E-001: the reference presentation passes production verification (`npm run verify`).
const outline: { era: string; title: string; caption: string }[] = JSON.parse(
  readFileSync(path.join(REPO, 'src/presentations/how-to-make-a-presentation/outline.json'), 'utf8'),
)

describe('E2E-001 reference presentation passes production verification', () => {
  let result: RunResult
  let port: number
  let startedAt = 0
  beforeAll(async () => {
    startedAt = Date.now()
    port = await freePort()
    result = await run('npm', ['run', 'verify', '--', '--port', String(port)], REPO)
  })

  it('exits zero with a clear pass result', () => {
    expect(result.code, result.out).toBe(0)
    expect(result.out).toMatch(/verify: PASS \(build, sample, render: 1 presentation\(s\), 9 steps\)/)
    expect(result.out).not.toMatch(/FAIL/)
  })

  it('builds the whole app before rendering', () => {
    expect(statSync(path.join(REPO, 'dist/index.html')).mtimeMs).toBeGreaterThanOrEqual(startedAt - 1000)
  })

  it('opens the registered sample route and observes all nine steps in order', () => {
    const lines = result.out.split('\n').filter((l) => l.startsWith('verify: /how-to-make-a-presentation step'))
    expect(lines).toHaveLength(9)
    lines.forEach((l, i) => {
      expect(l).toContain(`step ${i + 1}/9 (index ${i})`)
      expect(l).toContain(`"${outline[i].title}"`)
    })
  })

  it('uses 127.0.0.1 for the preview host, readiness probe and browser URL, and never localhost', () => {
    expect(result.out).toContain(`verify: preview ready at http://127.0.0.1:${port}/ (readiness probe)`)
    expect(result.out).toContain(`verify: opening http://127.0.0.1:${port}/how-to-make-a-presentation`)
    expect(result.out).not.toMatch(/localhost/i)
  })

  it('cleans up the preview server and browser after success', async () => {
    expect(await isListening(port)).toBe(false)
    expect(previewProcessAlive(port)).toBe(false)
  })
})
