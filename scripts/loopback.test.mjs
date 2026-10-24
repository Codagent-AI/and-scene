import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOST } from './lib.mjs'

describe('IPv4 loopback', () => {
  it('uses 127.0.0.1 for the preview host, readiness probe, and browser URLs', () => {
    expect(HOST).toBe('127.0.0.1')
    for (const f of ['lib.mjs', 'verify.mjs', 'inspect-presentation.mjs']) {
      const src = readFileSync(path.join(import.meta.dirname, f), 'utf8')
      expect(src, f).not.toMatch(/localhost|\[::1\]/)
    }
    const lib = readFileSync(path.join(import.meta.dirname, 'lib.mjs'), 'utf8')
    expect(lib).toContain("'--host', HOST")
    expect(lib).toContain('http://${HOST}:${port}')
  })
})
