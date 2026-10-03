/**
 * INT-002: Screenshot helper emits faithful artifacts and advisory warnings.
 *
 * Materializes a disposable copy of this repository (reusing its installed
 * `node_modules` via a symlink rather than a real `npm install`, since the
 * dependency set is already proven by INT-001), registers a controlled
 * two-step fixture presentation that deliberately contains an unmarked text
 * collision, an explicitly allowed overlap, a visibility-hidden collision,
 * indistinct active chrome (no presentation CSS at all, since the kit ships
 * zero visual defaults), and unpolished (browser-default) attribution, then
 * runs
 * `npm run inspect -- <fixture-slug>` against a production preview and
 * asserts on its screenshots and advisory warnings. A second fixture marks
 * its active chrome only through the progress-dot child hook and opacity,
 * which must not be reported as indistinct.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepoWithLinkedModules } from './helpers'

const RUN_TIMEOUT_MS = 3 * 60 * 1000
const SETUP_TIMEOUT_MS = RUN_TIMEOUT_MS

const FIXTURE_SLUG = 'overlap-fixture'

const FIXTURE_TALK_SOURCE = `import { Box, Emphasis, Frame, Label, Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'

interface FixturePayload {
  headline: string
}

/**
 * Deliberately ships NO presentation CSS: the kit has zero visual defaults,
 * so the progress dots and table-of-contents entries stay visually
 * identical between active/inactive, and the attribution link keeps the
 * browser's default (blue) link styling. Both are genuine INT-002 fixtures,
 * not accidents.
 */
function UnmarkedOverlapScene({ payload }: SceneProps<FixturePayload>) {
  return (
    <SceneLayer>
      {/* Deliberately positioned to collide with the header chrome above the
          stage, and NOT wrapped in an allow-overlap marker. */}
      <Box layoutId="fixture-unmarked-box" style={{ position: 'absolute', top: -190, left: 0 }}>
        <Label>{payload.headline}</Label>
      </Box>
      {/* Same collision, but explicitly marked as an intentional overlap. */}
      <div data-presentation-allow-overlap="true" style={{ position: 'absolute', top: -190, left: 200 }}>
        <Frame layoutId="fixture-allowed-frame" style={{ width: 120, height: 40 }}>
          <Label>allowed</Label>
        </Frame>
      </div>
      {/* Same collision, but invisible: it must not be reported. */}
      <div style={{ position: 'absolute', top: -190, left: 400, visibility: 'hidden' }}>
        <Emphasis layoutId="fixture-hidden-emphasis">hidden</Emphasis>
      </div>
    </SceneLayer>
  )
}

function PlainScene({ payload }: SceneProps<FixturePayload>) {
  return (
    <SceneLayer>
      <Box layoutId="fixture-plain-box">
        <Label>{payload.headline}</Label>
      </Box>
    </SceneLayer>
  )
}

const STEPS: Step<FixturePayload>[] = [
  {
    id: 'step-one',
    era: 'Era A',
    title: 'Step One',
    caption: 'Has an unmarked overlap and an explicitly allowed one.',
    payload: { headline: 'Hello' },
    Scene: UnmarkedOverlapScene,
  },
  {
    id: 'step-two',
    era: 'Era B',
    title: 'Step Two',
    caption: 'A plain second step, so active/inactive nav states have something to compare.',
    payload: { headline: 'World' },
    Scene: PlainScene,
  },
]

export default function Talk() {
  return <Presentation steps={STEPS} title="Overlap Fixture" initialMode="browse" />
}
`

const DISTINCT_FIXTURE_SLUG = 'distinct-active-fixture'

/**
 * Distinguishes the active step only through the kit's child
 * `[data-presentation-progress-dot]` hook and through opacity — both
 * legitimate treatments that must not be flagged as indistinct.
 */
const DISTINCT_FIXTURE_CSS = `[data-presentation-progress-dot] {
  display: block;
  width: 8px;
  height: 8px;
  background: rgb(120, 120, 120);
}

[data-presentation-progress-item][data-presentation-active] [data-presentation-progress-dot] {
  background: rgb(200, 160, 40);
}

[data-presentation-toc-item] {
  opacity: 0.5;
}

[data-presentation-toc-item][data-presentation-active] {
  opacity: 1;
}

[data-presentation-attribution] {
  color: rgb(90, 90, 90);
  font-size: 12px;
}
`

const DISTINCT_FIXTURE_TALK_SOURCE = `import { Box, Label, Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import './fixture.css'

interface FixturePayload {
  headline: string
}

function PlainScene({ payload }: SceneProps<FixturePayload>) {
  return (
    <SceneLayer>
      <Box layoutId="fixture-plain-box">
        <Label>{payload.headline}</Label>
      </Box>
    </SceneLayer>
  )
}

const STEPS: Step<FixturePayload>[] = [
  { id: 'one', era: 'Era A', title: 'One', caption: 'First.', payload: { headline: 'One' }, Scene: PlainScene },
  { id: 'two', era: 'Era B', title: 'Two', caption: 'Second.', payload: { headline: 'Two' }, Scene: PlainScene },
]

export default function Talk() {
  return <Presentation steps={STEPS} title="Distinct Active Fixture" initialMode="browse" />
}
`

function run(command: string, args: string[], cwd: string, timeout: number): string {
  return execFileSync(command, args, {
    cwd,
    timeout,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

let tempDir: string
let setupError: Error | null = null

describe('screenshot helper integration (INT-002)', () => {
  beforeAll(() => {
    try {
      tempDir = copyRepoWithLinkedModules('and-scene-inspect-')

      const presentationDir = path.join(tempDir, 'src', 'presentations', FIXTURE_SLUG)
      fs.mkdirSync(presentationDir, { recursive: true })
      fs.writeFileSync(path.join(presentationDir, 'Talk.tsx'), FIXTURE_TALK_SOURCE)

      const distinctDir = path.join(tempDir, 'src', 'presentations', DISTINCT_FIXTURE_SLUG)
      fs.mkdirSync(distinctDir, { recursive: true })
      fs.writeFileSync(path.join(distinctDir, 'Talk.tsx'), DISTINCT_FIXTURE_TALK_SOURCE)
      fs.writeFileSync(path.join(distinctDir, 'fixture.css'), DISTINCT_FIXTURE_CSS)

      const registryPath = path.join(tempDir, 'src', 'presentations', 'index.ts')
      const registrySource = fs.readFileSync(registryPath, 'utf8')
      const updatedRegistry = registrySource.replace(
        'export const presentations: PresentationRegistryEntry[] = [',
        `export const presentations: PresentationRegistryEntry[] = [\n` +
          `  { slug: '${FIXTURE_SLUG}', title: 'Overlap Fixture', load: () => import('./${FIXTURE_SLUG}/Talk') },\n` +
          `  { slug: '${DISTINCT_FIXTURE_SLUG}', title: 'Distinct Active Fixture', load: () => import('./${DISTINCT_FIXTURE_SLUG}/Talk') },`,
      )
      if (updatedRegistry === registrySource) {
        throw new Error('could not locate the registry array to append the fixture entry')
      }
      fs.writeFileSync(registryPath, updatedRegistry)
    } catch (err) {
      setupError = err instanceof Error ? err : new Error(String(err))
    }
  }, SETUP_TIMEOUT_MS)

  afterAll(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it(
    'captures one screenshot per step and reports the expected advisory warnings',
    () => {
      if (setupError) throw setupError

      const output = run('npm', ['run', 'inspect', '--', FIXTURE_SLUG], tempDir, RUN_TIMEOUT_MS)

      // One predictable screenshot per step, written under a project-local dir.
      const outDir = path.join(tempDir, 'screenshots', FIXTURE_SLUG)
      expect(fs.existsSync(path.join(outDir, 'step-00.png'))).toBe(true)
      expect(fs.existsSync(path.join(outDir, 'step-01.png'))).toBe(true)

      // Unmarked collision is reported, naming the colliding node type.
      expect(output).toMatch(/stage content \(box\) overlaps \[data-presentation-header\]/)

      // The explicitly allowed overlap (a Frame) must NOT be reported.
      expect(output).not.toMatch(/stage content \(frame\) overlaps/)

      // A visibility-hidden collision (an Emphasis) must NOT be reported.
      expect(output).not.toMatch(/stage content \(emphasis\) overlaps/)

      // Indistinct active progress + table-of-contents chrome (no CSS shipped).
      expect(output).toMatch(/\[data-presentation-progress-item\]\[data-presentation-active="true"\] is visually identical/)
      expect(output).toMatch(/\[data-presentation-toc-item\]\[data-presentation-active="true"\] is visually identical/)

      // Unpolished (browser-default) attribution styling.
      expect(output).toMatch(/attribution appears to use untouched browser-default link styling/)
    },
    RUN_TIMEOUT_MS + 15_000,
  )

  it(
    'does not report active chrome as indistinct when only a child hook or opacity differs',
    () => {
      if (setupError) throw setupError

      const output = run('npm', ['run', 'inspect', '--', DISTINCT_FIXTURE_SLUG], tempDir, RUN_TIMEOUT_MS)

      expect(output).not.toMatch(/is visually identical/)
      expect(output).not.toMatch(/attribution appears to use untouched browser-default link styling/)
    },
    RUN_TIMEOUT_MS + 15_000,
  )
})
