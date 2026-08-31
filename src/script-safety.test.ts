import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('presentation helper safety contracts', () => {
  it('keeps inspection output inside a validated artifact directory and builds before previewing', async () => {
    const source = await readFile(join(root, 'scripts/inspect-presentation.mjs'), 'utf8')

    expect(source).toContain("const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/")
    expect(source).toContain('const artifactsRoot = resolve')
    expect(source).toContain('relative(artifactsRoot, output)')
    expect(source).toContain("await run(npmCommand, ['run', 'build'])")
  })

  it('shares bounded preview lifecycle handling across both browser helpers', async () => {
    const [inspect, verify, runtime] = await Promise.all([
      readFile(join(root, 'scripts/inspect-presentation.mjs'), 'utf8'),
      readFile(join(root, 'scripts/verify.mjs'), 'utf8'),
      readFile(join(root, 'scripts/browser-runtime.mjs'), 'utf8'),
    ])

    expect(inspect).toContain("from './browser-runtime.mjs'")
    expect(verify).toContain("from './browser-runtime.mjs'")
    expect(runtime).toContain('AbortSignal.timeout(500)')
    expect(runtime).toContain('await waitForExit(preview)')
  })
})
