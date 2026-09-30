import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('production verification entry point', () => {
  it('provides the repository-local verification script', async () => {
    await expect(access(join(process.cwd(), 'scripts', 'verify.mjs'))).resolves.toBeUndefined()
  })
})
