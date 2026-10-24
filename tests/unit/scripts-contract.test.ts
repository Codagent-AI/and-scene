import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const scripts = path.join(import.meta.dirname, '../../scripts')
const read = (name: string) => readFileSync(path.join(scripts, name), 'utf8')

describe('verification scripts use the IPv4 loopback address', () => {
  it('builds every preview and browser URL from 127.0.0.1', async () => {
    const preview = (await import(/* @vite-ignore */ path.join(scripts, 'lib/preview.mjs'))) as {
      HOST: string
      baseUrl: (port: number) => string
    }
    expect(preview.HOST).toBe('127.0.0.1')
    expect(preview.baseUrl(4173)).toBe('http://127.0.0.1:4173')
  })

  it('never mentions localhost and always passes --host to vite preview', () => {
    for (const name of ['verify.mjs', 'inspect-presentation.mjs', 'lib/preview.mjs']) {
      expect(read(name), name).not.toMatch(/localhost/i)
    }
    expect(read('lib/preview.mjs')).toMatch(/'--host', HOST/)
    expect(read('verify.mjs')).toContain('preview.url')
  })
})
