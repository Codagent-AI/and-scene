/**
 * E2E-001: Reference presentation passes production verification.
 *
 * Runs the real `npm run verify` from the repository root against the
 * committed reference sample: whole-app build, the canonical nine-step
 * sample registered/reachable, clean production render on 127.0.0.1 for
 * every step, and an unambiguous success exit code.
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(TEST_DIR, '../..')

const VERIFY_TIMEOUT_MS = 3 * 60 * 1000

describe('production verification (E2E-001)', () => {
  it(
    '`npm run verify` builds, registers, and cleanly renders the canonical nine-step sample on 127.0.0.1',
    () => {
      const output = execFileSync('npm', ['run', 'verify'], {
        cwd: REPO_ROOT,
        timeout: VERIFY_TIMEOUT_MS,
        encoding: 'utf8',
      })

      expect(output).toMatch(/\[verify\] build: OK/)
      expect(output).toMatch(/registry: found \d+ presentation\(s\): .*how-to-make-a-presentation/)
      expect(output).toMatch(/starting `vite preview` on http:\/\/127\.0\.0\.1:\d+/)
      expect(output).toMatch(/render: OK "how-to-make-a-presentation" \(9 steps, no console\/page errors\)/)
      expect(output).toMatch(/All checks passed/)
      expect(output).not.toMatch(/FAILED/)
    },
    VERIFY_TIMEOUT_MS + 15_000,
  )
})
