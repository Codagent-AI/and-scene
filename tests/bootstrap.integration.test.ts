import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('presentation bootstrap template', () => {
  it('materializes outside the source tree, builds, renders, and matches the canonical kit', () => {
    const script = fileURLToPath(new URL('../skills/presentation/templates/bootstrap/scripts/test-bootstrap.mjs', import.meta.url))
    expect(() => execFileSync(process.execPath, [script], { cwd: '/tmp', stdio: 'inherit', timeout: 180_000 })).not.toThrow()
  }, 360_000)
})
