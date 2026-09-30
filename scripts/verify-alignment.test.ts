import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '..')
const templateScriptsDir = path.join(repoRoot, 'skills/presentation/templates/bootstrap/scripts')

function read(relative: string): string {
  return readFileSync(path.join(repoRoot, relative), 'utf8')
}

function readTemplate(name: string): string {
  return readFileSync(path.join(templateScriptsDir, name), 'utf8')
}

// Pulls one top-level `async function <name>(…) { … }` out of a script, using
// the closing brace in column 0 as the terminator.
function extractFunction(source: string, name: string): string {
  const start = source.indexOf(`async function ${name}(`)
  expect(start, `${name} not found`).toBeGreaterThan(-1)
  const end = source.indexOf('\n}\n', start)
  expect(end, `end of ${name} not found`).toBeGreaterThan(start)
  return source.slice(start, end + 3)
}

// CLAUDE.md asks that the root verification/inspection scripts stay aligned with
// their bootstrap-template copies. The root copy carries an extra
// reference-sample check that scaffolded projects have no use for, so the two
// files are not byte-identical — but the browser-facing routines that decide
// pass/fail must not drift, or a fix lands in one copy only.
describe('root and bootstrap verification scripts', () => {
  for (const fn of ['verifyRoute', 'verifyNarrowViewport']) {
    it(`keeps ${fn} identical in both copies of verify.mjs`, () => {
      expect(extractFunction(readTemplate('verify.mjs'), fn)).toBe(
        extractFunction(read('scripts/verify.mjs'), fn),
      )
    })
  }

  it('spawns the preview identically in every script that starts one', () => {
    const spawnCall = /const preview = spawn\([\s\S]*?\n {2}\}?\)\n/
    const sources = [
      read('scripts/verify.mjs'),
      read('scripts/inspect-presentation.mjs'),
      readTemplate('verify.mjs'),
      readTemplate('inspect-presentation.mjs'),
    ]
    const calls = sources.map((source) => {
      const match = source.match(spawnCall)
      expect(match, 'no preview spawn found').not.toBeNull()
      return match![0]
    })
    for (const call of calls) {
      expect(call).toBe(calls[0])
    }
  })
})
