import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('reference verification scripts', () => {
  it('uses the deterministic production browser contract', () => {
    const source = readFileSync(new URL('./verify.mjs', import.meta.url), 'utf8')
    expect(source).toContain('npm run build')
    expect(source).toContain('127.0.0.1')
    expect(source).toContain('data-step-count')
    expect(source).toContain('data-step-index')
    expect(source).toContain('pageerror')
    expect(source).toContain('console')
  })

  it('provides settled screenshots and all advisory diagnostics', () => {
    const source = readFileSync(new URL('./inspect-presentation.mjs', import.meta.url), 'utf8')
    expect(source).toContain('waitForTimeout')
    expect(source).toContain('data-presentation-allow-overlap')
    expect(source).toContain('suspicious overlap')
    expect(source).toContain('visually indistinct')
    expect(source).toContain('attribution')
  })
})
