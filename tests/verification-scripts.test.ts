import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')

describe('browser verification script contracts', () => {
  it('uses native filesystem paths for both browser scripts', async () => {
    const verify = await readFile(join(root, 'scripts/verify.mjs'), 'utf8')
    const inspect = await readFile(join(root, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(verify).toContain("import { fileURLToPath } from 'node:url'")
    expect(inspect).toContain("import { fileURLToPath } from 'node:url'")
    expect(verify).toContain('fileURLToPath(new URL')
    expect(inspect).toContain('fileURLToPath(new URL')
  })

  it('inspection owns the preview lifecycle', async () => {
    const inspect = await readFile(join(root, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(inspect).toContain("spawn('npm'")
    expect(inspect).toContain("['run', 'build']")
    expect(inspect).toContain('waitForPreview(preview)')
    expect(inspect).toContain('preview.kill')
  })

  it('verification waits for its own preview process before HTTP readiness', async () => {
    const verify = await readFile(join(root, 'scripts/verify.mjs'), 'utf8')
    expect(verify).toContain("started ||= output.includes('127.0.0.1:4173')")
    expect(verify).toContain('if (started)')
    expect(verify).toContain('preview.exitCode')
  })
})
