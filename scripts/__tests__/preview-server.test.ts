import { describe, expect, it } from 'vitest'
import { stripAnsi } from '../preview-server.mjs'

describe('preview readiness probe', () => {
  it('sees the loopback address through vite\'s colorized banner', () => {
    const banner = '\u001B[32m➜\u001B[39m  \u001B[1mLocal\u001B[22m:   \u001B[36mhttp://127.0.0.1:\u001B[1m4173\u001B[22m/\u001B[39m'
    expect(stripAnsi(banner)).toContain('http://127.0.0.1:4173')
  })

  it('leaves plain output untouched', () => {
    expect(stripAnsi('http://127.0.0.1:4173/')).toBe('http://127.0.0.1:4173/')
  })
})
