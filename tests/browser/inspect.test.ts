import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, processesMentioning, removeProject, run } from './helpers'

const SLUG = 'fixture-inspect'

// Controlled presentation: step 1 has an unmarked text collision, step 2 an allowed overlap,
// step 3 a collision that only exists after a delayed enter animation. No CSS at all, so the
// active chrome is indistinct and the attribution is browser-default.
const FIXTURE_TALK = `
import { Appear, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'

const box = (left: number, top: number) => ({ position: 'absolute' as const, left, top, fontSize: 20 })

function Scene({ payload }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      {payload.n === 1 && (
        <>
          <div style={box(100, 100)}>COLLIDE-A text</div>
          <div style={box(110, 105)}>COLLIDE-B text</div>
        </>
      )}
      {payload.n === 2 && (
        <div data-presentation-allow-overlap="">
          <div style={box(100, 100)}>ALLOWED-A text</div>
          <div style={box(110, 105)}>ALLOWED-B text</div>
        </div>
      )}
      {payload.n === 3 && (
        <>
          <div style={box(100, 100)}>LATE-A text</div>
          <Appear>
            <div style={box(110, 105)}>LATE-B text</div>
          </Appear>
        </>
      )}
    </SceneLayer>
  )
}

const mk = (n: number, era: string): Step<{ n: number }> => ({
  id: 's' + n, era, title: 'Fixture ' + n, caption: 'Caption ' + n, Scene, payload: { n },
})

export default function Talk() {
  return <Presentation steps={[mk(1, 'One'), mk(2, 'One'), mk(3, 'Two')]} title="Fixture" initialMode="browse" />
}
`

const FIXTURE_REGISTRY = `
import type { ComponentType } from 'react'
export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}
export const presentations: PresentationEntry[] = [
  { slug: '${SLUG}', title: 'Fixture', load: () => import('./fixture/Talk') },
]
`

let dir: string
beforeAll(() => {
  dir = copyProject()
  mkdirSync(path.join(dir, 'src/presentations/fixture'), { recursive: true })
  writeFileSync(path.join(dir, 'src/presentations/fixture/Talk.tsx'), FIXTURE_TALK)
  writeFileSync(path.join(dir, 'src/presentations/index.ts'), FIXTURE_REGISTRY)
})
afterAll(() => removeProject(dir))

const warnings = (output: string, step: string, kind: string) =>
  output.split('\n').filter((l) => l.startsWith(`WARN step ${step} [${kind}]`))

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  it('captures settled screenshots and reports step-specific advisories without failing', async () => {
    const { code, output } = await run('node', ['scripts/inspect-presentation.mjs', SLUG, '--root', dir, '--settle', '1500'], dir)
    expect(code).toBe(0)
    expect(output).toContain('settle 1500ms')
    for (const n of ['01', '02', '03']) expect(existsSync(path.join(dir, '.inspect', SLUG, `step-${n}.png`))).toBe(true)
    expect(existsSync(path.join(dir, '.inspect', SLUG, 'step-04.png'))).toBe(false)

    // unmarked collision on step 1 only
    const s1 = warnings(output, '01', 'overlap')
    expect(s1.some((l) => l.includes('COLLIDE-A') && l.includes('COLLIDE-B'))).toBe(true)
    // explicitly allowed overlap produces nothing
    expect(output).not.toContain('ALLOWED')
    // the delayed enter is only visible after the settle wait, so it is captured in its final state
    expect(warnings(output, '03', 'overlap').some((l) => l.includes('LATE-A') && l.includes('LATE-B'))).toBe(true)
    // indistinct active chrome and unpolished attribution are reported per step
    for (const n of ['01', '02', '03']) {
      expect(warnings(output, n, 'active-chrome').some((l) => l.includes('progress-dot'))).toBe(true)
      expect(warnings(output, n, 'attribution').some((l) => l.includes('[data-presentation-attribution]'))).toBe(true)
    }
    expect(await processesMentioning(dir)).toEqual([])
  })

  it('does not capture before transitions settle', async () => {
    const { code, output } = await run('node', ['scripts/inspect-presentation.mjs', SLUG, '--root', dir, '--settle', '0', '--skip-build'], dir)
    expect(code).toBe(0)
    expect(warnings(output, '03', 'overlap').some((l) => l.includes('LATE-B'))).toBe(false)
  })

  it('exits non-zero for operational errors (unknown route)', async () => {
    const { code, output } = await run('node', ['scripts/inspect-presentation.mjs', 'no-such-slug', '--root', dir, '--skip-build'], dir)
    expect(code).not.toBe(0)
    expect(output).toContain('route not found')
    expect(await processesMentioning(dir)).toEqual([])
  })
})
