import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('presentation bootstrap template', () => {
  it('materializes outside the source tree, builds, renders, and matches the canonical kit', () => {
    const script = fileURLToPath(new URL('../skills/presentation/templates/bootstrap/scripts/test-bootstrap.mjs', import.meta.url))
    expect(() => execFileSync(process.execPath, [script], { cwd: tmpdir(), stdio: 'inherit', timeout: 180_000 })).not.toThrow()
  }, 360_000)
})
