import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('E2E-001 reference presentation verification', () => {
  it('builds and observes every sample step on IPv4 loopback', () => {
    const output = execFileSync('npm', ['run', 'verify'], { encoding: 'utf8', timeout: 300_000 })
    expect(output).toContain('PASS: build, sample, render')
    for (let step = 0; step < 9; step++) expect(output).toContain(`Observed step indices: ${step}`)
    expect(output).toContain('preview host=http://127.0.0.1:')
    expect(output).toContain('readiness=http://127.0.0.1:')
    expect(output).toContain('browser URL=http://127.0.0.1:')
  }, 300_000)
})
