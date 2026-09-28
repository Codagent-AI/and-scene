import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { createIsolatedRepoCopy, playwrightEnv, removeIsolatedRepoCopy, REPO_ROOT } from './helpers/isolated-copy'

/**
 * INT-002: the project-local screenshot helper (`scripts/inspect-presentation.mjs`)
 * captures a settled screenshot per step and surfaces advisory warnings for an
 * unmarked text/chrome collision, an indistinct active nav state, and
 * unpolished attribution — while not flagging an explicitly allowed overlap.
 * Runs against a controlled fixture presentation in an isolated repo copy so
 * it never touches the committed reference sample or the source checkout.
 */

const FIXTURE_SLUG = 'int-002-fixture'

const FIXTURE_TALK_TSX = `
import { Box, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import { Presentation } from '../../presentation-kit'

interface FixturePayload {
  label: string
}

/**
 * Deliberately unstyled fixture: two boxes collide (unmarked), two more
 * collide inside an explicit allow-overlap wrapper, and there is no CSS at
 * all — so the active nav state stays indistinct and the attribution link
 * stays browser-default.
 */
function FixtureScene({ payload }: SceneProps<FixturePayload>) {
  return (
    <SceneLayer>
      <Box layoutId="fixture-a" style={{ position: 'absolute', left: 40, top: 40, width: 160, height: 60 }}>
        {payload.label}
      </Box>
      <Box layoutId="fixture-b" style={{ position: 'absolute', left: 80, top: 50, width: 160, height: 60 }}>
        unmarked overlap
      </Box>
      <div data-presentation-allow-overlap="" style={{ position: 'absolute', left: 40, top: 150, width: 260, height: 60 }}>
        <Box layoutId="fixture-c" style={{ position: 'absolute', left: 0, top: 0, width: 160, height: 60 }}>
          allowed
        </Box>
        <Box layoutId="fixture-d" style={{ position: 'absolute', left: 40, top: 10, width: 160, height: 60 }}>
          overlap
        </Box>
      </div>
    </SceneLayer>
  )
}

const STEPS: Step<FixturePayload>[] = [
  { id: 'fixture-1', era: 'one', title: 'Fixture step one', caption: 'First.', payload: { label: 'one' }, Scene: FixtureScene },
  { id: 'fixture-2', era: 'two', title: 'Fixture step two', caption: 'Second.', payload: { label: 'two' }, Scene: FixtureScene },
]

export default function Talk() {
  return <Presentation steps={STEPS} title="INT-002 fixture" />
}
`

function registerFixture(tempDir: string) {
  const fixtureDir = path.join(tempDir, 'src', 'presentations', FIXTURE_SLUG)
  mkdirSync(fixtureDir, { recursive: true })
  writeFileSync(path.join(fixtureDir, 'Talk.tsx'), FIXTURE_TALK_TSX)

  const registryPath = path.join(tempDir, 'src', 'presentations', 'index.ts')
  const registrySource = readFileSync(registryPath, 'utf8')
  writeFileSync(
    registryPath,
    `${registrySource}\npresentations.push({ slug: '${FIXTURE_SLUG}', title: 'INT-002 fixture', load: () => import('./${FIXTURE_SLUG}/Talk') })\n`,
  )
}

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  let tempDir: string

  afterAll(() => {
    if (tempDir) removeIsolatedRepoCopy(tempDir)
  })

  it('captures one settled screenshot per step and reports the expected warnings', () => {
    tempDir = createIsolatedRepoCopy('and-scene-int-002-')
    expect(tempDir).not.toContain(REPO_ROOT)
    registerFixture(tempDir)

    const result = spawnSync('npm', ['run', 'inspect', '--', FIXTURE_SLUG], {
      cwd: tempDir,
      encoding: 'utf8',
      env: playwrightEnv(),
    })
    expect(result.status, `inspect failed:\n${result.stdout}\n${result.stderr}`).toBe(0)

    for (const index of [0, 1]) {
      const shotPath = path.join(tempDir, 'inspection', FIXTURE_SLUG, `step-${index}.png`)
      expect(existsSync(shotPath), `expected screenshot at ${shotPath}`).toBe(true)
      expect(statSync(shotPath).size).toBeGreaterThan(0)
    }

    expect(result.stdout).toMatch(/unmarked overlap between "one" and "unmarked overlap"/)
    expect(result.stdout).toMatch(/progress indicator active state is not visually distinct/)
    expect(result.stdout).toMatch(/table-of-contents entry active state is not visually distinct/)
    expect(result.stdout).toMatch(/attribution link appears too small or browser-default/)

    // The explicitly allowed overlap (fixture-c / fixture-d) must not be reported.
    expect(result.stdout).not.toMatch(/"allowed" and "overlap"/)
  }, 180_000)
})
