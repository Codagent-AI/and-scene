// INT-002: the screenshot helper emits faithful artifacts and advisory warnings.
import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { createPresentation } from '../../skills/presentation/scripts/scaffold.mjs'
import { linkModules, scaffoldCli, sh, tempDir } from '../helpers/project.mjs'

const SETTLE = 150
let dir
const run = {}

const COLLIDE = `import { Label, SceneLayer, type SceneProps } from '../../../presentation-kit'
export interface MainPayload { beat: number }
export function MainScene({ payload: { beat } }: SceneProps<MainPayload>) {
  return (
    <SceneLayer>
      <Label key="a" layoutId="a" x={100} y={100}>Alpha text</Label>
      {beat >= 2 && <Label key="b" layoutId="b" x={110} y={102}>Bravo text</Label>}
      <div data-presentation-allow-overlap="">
        <div><Label x={300} y={200}>Inner one</Label></div>
        <Label x={305} y={202}>Inner two</Label>
      </div>
      {beat >= 3 && <Label key="g" layoutId="g" x={500} y={300}>Gamma text</Label>}
      {beat >= 3 && <Label key="d" layoutId="d" x={505} y={302}>Delta text</Label>}
    </SceneLayer>
  )
}
`

function inspect(slug) {
  const r = sh(process.execPath, ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle', String(SETTLE)], dir)
  const out = path.join(dir, '.inspection', slug)
  const manifest = existsSync(path.join(out, 'manifest.json')) ? JSON.parse(readFileSync(path.join(out, 'manifest.json'), 'utf8')) : []
  return { ...r, out, manifest, warns: r.output.split('\n').filter((l) => l.startsWith('WARN')) }
}

beforeAll(() => {
  dir = tempDir('int002-')
  expect(sh(process.execPath, [scaffoldCli, 'scaffold', dir], tempDir('int002-cwd-')).status).toBe(0)
  linkModules(dir)
  for (const slug of ['good', 'collide', 'indistinct', 'small', 'noattr']) createPresentation(dir, { slug, title: slug })
  const pres = (s, f) => path.join(dir, 'src/presentations', s, f)
  writeFileSync(pres('collide', 'steps/MainScene.tsx'), COLLIDE)
  writeFileSync(pres('indistinct', 'talk.css'), '/* deliberately unstyled */\n')
  appendFileSync(pres('small', 'talk.css'), '\n.deck-small [data-presentation-attribution] { font-size: 10px; }\n')
  const talk = pres('noattr', 'Talk.tsx')
  writeFileSync(talk, readFileSync(talk, 'utf8').replace('initialMode="browse"', 'initialMode="browse" attribution={false}'))
  const build = sh('npm', ['run', 'build'], dir)
  expect(build.status, build.output).toBe(0)
  for (const slug of ['good', 'collide', 'indistinct', 'small', 'noattr']) run[slug] = inspect(slug)
})

describe('INT-002 screenshot helper', () => {
  it('writes one predictable, distinct, non-empty screenshot per step', () => {
    const { out, status, manifest } = run.good
    expect(status).toBe(0)
    const files = ['step-01.png', 'step-02.png', 'step-03.png']
    const hashes = files.map((f) => {
      const bytes = readFileSync(path.join(out, f))
      expect(bytes.subarray(1, 4).toString()).toBe('PNG')
      return createHash('sha1').update(bytes).digest('hex')
    })
    expect(new Set(hashes).size).toBe(3)
    expect(manifest.map((m) => m.file)).toEqual(files)
    expect(out.endsWith(path.join('.inspection', 'good'))).toBe(true)
  })

  it('captures only after the settle interval and with no animation still running', () => {
    for (const m of run.good.manifest) {
      expect(m.settleMs).toBe(SETTLE)
      expect(m.capturedAfterMs).toBeGreaterThanOrEqual(SETTLE)
      expect(m.pendingAnimations).toBe(0)
    }
  })

  it('stays quiet for a polished presentation', () => {
    expect(run.good.warns).toEqual([])
  })

  it('reports an unmarked collision per step, exempts the allow-overlap subtree, and still exits 0', () => {
    const { warns, status, manifest } = run.collide
    expect(status).toBe(0)
    expect(manifest).toHaveLength(3)
    const overlaps = warns.filter((w) => w.includes('overlap'))
    expect(overlaps.some((w) => w.includes('step 2') && w.includes('Alpha text') && w.includes('Bravo text'))).toBe(true)
    expect(overlaps.some((w) => w.includes('step 3') && w.includes('Gamma text') && w.includes('Delta text'))).toBe(true)
    expect(overlaps.some((w) => w.includes('step 1'))).toBe(false)
    expect(overlaps.some((w) => w.includes('Inner'))).toBe(false)
  })

  it('reports indistinct active progress and table-of-contents chrome and default attribution', () => {
    const text = run.indistinct.warns.join('\n')
    expect(run.indistinct.status).toBe(0)
    expect(text).toMatch(/step 1: active progress indicator/)
    expect(text).toMatch(/step 1: active table-of-contents entry/)
    expect(text).toMatch(/attribution uses the browser-default link color; style \[data-presentation-attribution\]/)
  })

  it('reports undersized attribution, and missing attribution, naming the styling hook', () => {
    expect(run.small.warns.join('\n')).toMatch(/step 1: attribution font size 10px is below 12px; style \[data-presentation-attribution\]/)
    expect(run.small.warns.join('\n')).not.toMatch(/active progress/)
    expect(run.noattr.status).toBe(0)
    expect(run.noattr.manifest).toHaveLength(3)
    expect(run.noattr.warns.join('\n')).toMatch(/step 1: attribution link is missing; style \[data-presentation-attribution\]/)
  })
})
