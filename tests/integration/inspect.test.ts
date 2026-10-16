import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SKILL_CLI, cleanupTmp, exists, materialize, run, write } from '../helpers'

afterAll(cleanupTmp)

const SCENE = `import { AnimatePresence } from 'motion/react'
import { Appear, Box, Label, SceneLayer, type SceneProps } from '../../../presentation-kit'

export interface Payload {
  n: number
}

export function Scene({ payload }: SceneProps<Payload>) {
  const { n } = payload
  return (
    <SceneLayer>
      <Box id="fx-a" x={60} y={60} w={200} h={60}>base</Box>
      <AnimatePresence>
        {n === 2 && (
          <Appear key="collide">
            <Label id="fx-b" x={80} y={150}>colliding words</Label>
            <Label id="fx-c" x={90} y={152}>colliding words</Label>
          </Appear>
        )}
        {n === 3 && (
          <Appear key="allowed">
            <div data-presentation-allow-overlap style={{ position: 'absolute', inset: 0 }}>
              <Label id="fx-d" x={80} y={150}>intentional stack</Label>
              <Label id="fx-e" x={90} y={152}>intentional stack</Label>
            </div>
          </Appear>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
`

const POLISH = `[data-presentation-dot] { width: 10px; height: 10px; border-radius: 50%; border: 1px solid gray; background: transparent; }
[data-presentation-dot][data-presentation-active] { width: 26px; background: gold; }
[data-presentation-toc-entry][data-presentation-active] { font-weight: 700; background: gold; }
[data-presentation-attribution] { font-family: sans-serif; font-size: 13px; color: #556; }
`

let app: string
const inspect = (slug: string, extra: string[] = []) => run('npm', ['run', 'inspect', '--', slug, ...extra], app)
const warnings = (out: string, step: number) =>
  out.split('\n').filter((l) => l.includes(`WARN step ${step}:`))

beforeAll(() => {
  app = materialize()
  for (const slug of ['fixture', 'polished']) {
    const r = run('node', [SKILL_CLI, 'create', app, slug, slug], app)
    if (r.status !== 0) throw new Error(r.out)
  }
  const meta = (id: string) => `  { id: '${id}', era: 'e', title: 'T ${id}', caption: 'C ${id}' },`
  write(
    app,
    'src/presentations/fixture/steps/meta.ts',
    `import type { StepMeta } from '../../../presentation-kit'\nexport const STEP_META: readonly StepMeta[] = [\n${['one', 'two', 'three'].map(meta).join('\n')}\n]\n`,
  )
  write(app, 'src/presentations/fixture/steps/Scene.tsx', SCENE)
  write(app, 'src/presentations/polished/talk.css', POLISH)
})

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  it('writes one settled screenshot per step and flags only the unmarked collision, chrome, and attribution', () => {
    const res = inspect('fixture')
    expect(res.status, res.out).toBe(0)
    for (const n of ['01', '02', '03']) expect(exists(app, `.presentation-artifacts/fixture/step-${n}.png`)).toBe(true)
    const manifest = JSON.parse(readFileSync(path.join(app, '.presentation-artifacts/fixture/manifest.json'), 'utf8'))
    expect(manifest).toHaveLength(3)
    expect(res.out).not.toContain('animations were still running')

    expect(warnings(res.out, 2).some((l) => l.includes('overlap:'))).toBe(true)
    expect(warnings(res.out, 1).some((l) => l.includes('overlap:'))).toBe(false)
    expect(warnings(res.out, 3).some((l) => l.includes('overlap:'))).toBe(false)
    for (const step of [1, 2, 3]) {
      expect(warnings(res.out, step).some((l) => l.includes('active chrome') && l.includes('progress indicator'))).toBe(true)
      expect(warnings(res.out, step).some((l) => l.includes('attribution:') && l.includes('data-presentation-attribution'))).toBe(true)
    }
  })

  it('stays quiet about polished chrome and attribution and supports a narrow viewport directory', () => {
    const res = inspect('polished', ['--viewport', '390x844', '--skip-build'])
    expect(res.status, res.out).toBe(0)
    expect(exists(app, '.presentation-artifacts/polished/390x844/step-02.png')).toBe(true)
    expect(res.out).not.toContain('active chrome')
    expect(res.out).not.toContain('attribution:')
  })

  it('reports an unknown presentation as an error', () => {
    const res = inspect('nope', ['--skip-build'])
    expect(res.status).not.toBe(0)
    expect(res.out).toContain('not registered')
  })
})
