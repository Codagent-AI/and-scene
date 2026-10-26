import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const rootVerifier = 'scripts/verify.mjs'
const rootInspector = 'scripts/inspect-presentation.mjs'
const bootstrapVerifier = 'skills/presentation/templates/bootstrap/scripts/verify.mjs'
const bootstrapInspector = 'skills/presentation/templates/bootstrap/scripts/inspect-presentation.mjs'

describe('verification scripts', () => {
  it('settles every active browser step before evaluating errors or advancing', async () => {
    const source = await readFile(rootVerifier, 'utf8')

    expect(source).toContain('const settleMs = 700')
    expect(source).toContain('await page.waitForTimeout(settleMs)')
    expect(source.indexOf('await page.waitForTimeout(settleMs)')).toBeLessThan(source.indexOf("if (await presentation.getAttribute('data-step-index')"))
  })

  it('builds current source before the inspection preview starts', async () => {
    const source = await readFile(rootInspector, 'utf8')

    expect(source).toContain("await runCommand('npm', ['run', 'build'])")
    expect(source.indexOf("await runCommand('npm', ['run', 'build'])")).toBeLessThan(source.indexOf('server = await startPreview'))
  })

  it('keeps the distributable verifier generic and slug-driven', async () => {
    const source = await readFile(bootstrapVerifier, 'utf8')

    expect(source).toContain('const slug = process.argv[2]')
    expect(source).toContain('provide a registered presentation slug')
    expect(source).not.toContain('canonicalSlug')
    expect(source).not.toContain('canonicalOutline')
    expect(source).not.toContain('how-to-make-a-presentation')
  })

  it('keeps the distributable inspector generic and builds current source', async () => {
    const source = await readFile(bootstrapInspector, 'utf8')

    expect(source).toContain('const slug = process.argv[2]')
    expect(source).toContain('provide a registered presentation slug')
    expect(source).toContain("await runCommand('npm', ['run', 'build'])")
    expect(source).not.toContain('how-to-make-a-presentation')
  })
})
