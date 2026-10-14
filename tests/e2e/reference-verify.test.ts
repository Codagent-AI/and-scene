// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// E2E-001: the committed reference sample passes the full production verification gate.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const VERIFY_TIMEOUT_MS = 420_000

// The normative outline from openspec/changes/create-and-scene/specs. Kept here as
// the test's own copy so a wrong sample cannot pass by editing the verifier.
const OUTLINE = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

describe('E2E-001 reference presentation passes production verification', () => {
  it(
    'builds, renders all nine steps on 127.0.0.1, and exits zero with a pass line',
    () => {
      const run = spawnSync(npm, ['run', 'verify'], {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: VERIFY_TIMEOUT_MS,
        maxBuffer: 32 * 1024 * 1024,
      })
      const output = `${run.stdout ?? ''}${run.stderr ?? ''}`
      if (run.status !== 0) console.error(output)

      expect(run.status).toBe(0)
      expect(output).toMatch(/PASS/)
      expect(output).not.toMatch(/FAIL/)
      expect(output).toMatch(/http:\/\/127\.0\.0\.1:\d+/)
      expect(output).not.toMatch(/localhost/)
      expect(output).toMatch(/how-to-make-a-presentation/)

      // Each step is observed in order with its normative title, at its public index.
      let cursor = 0
      OUTLINE.forEach(([title], index) => {
        const line = new RegExp(`step ${index + 1}/9 \\(index ${index}\\): ${escapeRegExp(title)}`)
        const found = output.slice(cursor).search(line)
        expect(found, `step ${index + 1} line missing or out of order`).toBeGreaterThanOrEqual(0)
        cursor += found + 1
      })
    },
    VERIFY_TIMEOUT_MS + 30_000,
  )
})

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
