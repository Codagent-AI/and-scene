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

describe('inspection helper flags scene text that canvas scaling makes unreadable', () => {
  const template = path.join(import.meta.dirname, '../../skills/presentation/templates/bootstrap/scripts')

  it('derives effective text size from the canvas scale and reports it as an advisory', () => {
    const script = read('inspect-presentation.mjs')
    expect(script).toContain('data-presentation-scale')
    expect(script).toMatch(/kind: 'small-text'/)
    expect(script).toMatch(/const MIN_SCENE_TEXT_PX = \d+/)
    expect(script).toContain('page.evaluate(diagnose, MIN_SCENE_TEXT_PX)')
  })

  it('keeps the bootstrap template copy aligned with the root helper', () => {
    expect(readFileSync(path.join(template, 'inspect-presentation.mjs'), 'utf8')).toBe(read('inspect-presentation.mjs'))
  })
})
