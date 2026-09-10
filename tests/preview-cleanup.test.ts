import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const scripts = ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']

describe('preview subprocess cleanup', () => {
  it.each(scripts)('retains the exit promise when %s stops before cleanup', async (script) => {
    const source = await readFile(script, 'utf8')

    expect(source).toMatch(/const previewExited = once\(preview, 'exit'\)/)
    expect(source).toMatch(/if \(preview\.exitCode === null && preview\.signalCode === null\) preview\.kill\('SIGTERM'\)/)
    expect(source).toMatch(/await previewExited\.catch\(\(\) => undefined\)/)
  })
})
