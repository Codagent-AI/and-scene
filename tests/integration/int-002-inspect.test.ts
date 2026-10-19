import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REPO, run } from '../helpers/proc.ts'

const TEMPLATE = join(REPO, 'skills/presentation/templates/bootstrap')

const scene = (body: string) => `import { Label, SceneLayer } from '../../presentation-kit/index.ts'
import type { SceneProps } from '../../presentation-kit/index.ts'
export interface Payload { stage: number }
export function Scene({ payload }: SceneProps<Payload>) {
  const s = payload.stage
  return (
    <SceneLayer>
${body}
    </SceneLayer>
  )
}
`

const talk = (slug: string, extra = '') => `import { Presentation } from '../../presentation-kit/index.ts'
import type { Step } from '../../presentation-kit/index.ts'
import { Scene } from './Scene.tsx'
import type { Payload } from './Scene.tsx'
${extra}
const steps: Step<Payload>[] = [1, 2, 3].map((n) => ({
  id: 's' + n, era: n < 3 ? 'first' : 'second', title: 'Title ' + n, caption: 'Caption ' + n, Scene, groupKey: '${slug}', payload: { stage: n },
}))
export default function Talk() {
  return <Presentation steps={steps} title="${slug}" initialMode="browse" />
}
`

// rough: unmarked collision (1), allowed overlap (2), clean + a moving label throughout.
const ROUGH = scene(`      <Label layoutId="mover" x={s === 2 ? 600 : 40} y={300} w={120} h={20}>mover</Label>
      {s === 1 ? <Label layoutId="collide-a" x={100} y={100} w={160} h={30}>collide alpha</Label> : null}
      {s === 1 ? <Label layoutId="collide-b" x={120} y={110} w={160} h={30}>collide beta</Label> : null}
      {s === 2 ? (
        <div data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}>
          <Label layoutId="ok-a" x={100} y={100} w={160} h={30}>allowed alpha</Label>
          <Label layoutId="ok-b" x={120} y={110} w={160} h={30}>allowed beta</Label>
        </div>
      ) : null}
      {s === 3 ? <Label layoutId="clean" x={100} y={100} w={160} h={30}>clean</Label> : null}`)

const POLISHED = scene(`      <Label layoutId="one" x={100} y={100} w={160} h={30}>one {s}</Label>
      <Label layoutId="two" x={400} y={200} w={160} h={30}>two {s}</Label>`)

const POLISHED_CSS = `
[data-presentation-header] { display: flex; align-items: center; gap: 16px; height: 64px; padding: 0 24px; }
[data-presentation-title] { margin: 0; font-size: 20px; }
[data-presentation-footer] { padding: 8px 24px 40px; }
[data-presentation-caption] { margin: 0 0 8px; }
[data-presentation-progress-item] { width: 10px; height: 10px; border-radius: 50%; border: 1px solid #888; background: transparent; }
[data-presentation-progress-item][data-presentation-active='true'] { width: 26px; background: #c7a755; border-color: #c7a755; }
[data-presentation-toc-entry] { color: #888; background: transparent; border: 0; padding: 6px 10px; }
[data-presentation-toc-entry][data-presentation-active='true'] { color: #fff; font-weight: 700; background: #333; }
[data-presentation-attribution] { font-size: 14px; color: #c7a755; text-decoration: none; padding: 6px 10px; }
`

let dir: string
let rough: { code: number; out: string }
let polished: { code: number; out: string }
let impatient: { code: number; out: string }

const warnings = (out: string) => out.split('\n').filter((l) => l.startsWith('warning: ')).map((l) => l.slice(9))
const forStep = (w: string[], n: number) => w.filter((l) => l.startsWith(`step ${n}:`))
const png = (p: string) => {
  const b = readFileSync(p)
  return { b, width: b.readUInt32BE(16), height: b.readUInt32BE(20), sig: b.subarray(0, 8).toString('hex') }
}

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'and-scene-int2-'))
    cpSync(TEMPLATE, dir, { recursive: true })
    symlinkSync(join(REPO, 'node_modules'), join(dir, 'node_modules'))
    for (const [slug, body, css] of [['rough', ROUGH, ''], ['polished', POLISHED, POLISHED_CSS]]) {
      const d = join(dir, 'src/presentations', slug)
      mkdirSync(d, { recursive: true })
      writeFileSync(join(d, 'Scene.tsx'), body)
      writeFileSync(join(d, 'Talk.tsx'), talk(slug, css ? "import './talk.css'" : ''))
      if (css) writeFileSync(join(d, 'talk.css'), css)
    }
    const idx = join(dir, 'src/presentations/index.ts')
    writeFileSync(
      idx,
      readFileSync(idx, 'utf8').replace(
        "export const PRESENTATIONS: readonly PresentationEntry[] = [",
        "export const PRESENTATIONS: readonly PresentationEntry[] = [\n  { slug: 'rough', title: 'Rough', load: () => import('./rough/Talk.tsx') },\n  { slug: 'polished', title: 'Polished', load: () => import('./polished/Talk.tsx') },",
      ),
    )
    rough = await run('node', ['scripts/inspect-presentation.mjs', 'rough', '--settle', '700'], dir)
    polished = await run('node', ['scripts/inspect-presentation.mjs', 'polished', '--skip-build', '--settle', '700'], dir)
    impatient = await run('node', ['scripts/inspect-presentation.mjs', 'rough', '--skip-build', '--settle', '0', '--out', 'impatient'], dir)
  })
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('writes one decodable desktop screenshot per step at predictable paths, each showing its own step', () => {
    expect(rough.code).toBe(0)
    const hashes = new Set<string>()
    for (const n of ['01', '02', '03']) {
      const p = join(dir, '.presentation-inspect/rough', `step-${n}.png`)
      expect(statSync(p).size).toBeGreaterThan(1000)
      const { b, width, height, sig } = png(p)
      expect(sig).toBe('89504e470d0a1a0a')
      expect([width, height]).toEqual([1440, 900])
      hashes.add(createHash('sha1').update(b).digest('hex'))
    }
    expect(hashes.size).toBe(3)
    expect(rough.out).toMatch(/inspect: 3 screenshots/)
  })

  it('captures only after the settle interval and after transitions finish', () => {
    const cap = JSON.parse(readFileSync(join(dir, '.presentation-inspect/rough/captures.json'), 'utf8'))
    expect(cap.settleMs).toBe(700)
    for (const c of cap.captures) expect(c.waitedMs).toBeGreaterThanOrEqual(700)
    // with no settle interval the helper still waits for the moving label's layout animation to stop
    const quick = JSON.parse(readFileSync(join(dir, 'impatient/rough/captures.json'), 'utf8'))
    expect(quick.settleMs).toBe(0)
    expect(quick.captures[1].waitedMs).toBeGreaterThanOrEqual(400)
  })

  it('warns, by step and element, about the unmarked text collision only', () => {
    const w = warnings(rough.out)
    const s1 = forStep(w, 1).filter((l) => l.includes('collide'))
    expect(s1).toHaveLength(1)
    expect(s1[0]).toMatch(/collide alpha/)
    expect(s1[0]).toMatch(/collide beta/)
    expect(s1[0]).toMatch(/data-presentation-allow-overlap/)
    expect(w.filter((l) => l.includes('collide'))).toHaveLength(1)
    expect(forStep(w, 3).filter((l) => l.includes('clean'))).toEqual([])
  })

  it('does not warn about the explicitly allowed readable overlap', () => {
    const w = forStep(warnings(rough.out), 2)
    expect(w.filter((l) => /allowed (alpha|beta)/.test(l))).toEqual([])
    expect(rough.out).toContain('captured step 2/3')
  })

  it('warns, per step, about indistinct active progress and table-of-contents chrome', () => {
    const w = warnings(rough.out)
    for (const n of [1, 2, 3]) {
      expect(forStep(w, n).some((l) => l.includes('progress indicator is visually indistinct'))).toBe(true)
      expect(forStep(w, n).some((l) => l.includes('table-of-contents entry is visually indistinct'))).toBe(true)
    }
  })

  it('warns about unpolished attribution and points at the styling hook', () => {
    const w = warnings(rough.out)
    for (const n of [1, 2, 3]) {
      const a = forStep(w, n).filter((l) => l.includes('attribution'))
      expect(a).toHaveLength(1)
      expect(a[0]).toMatch(/browser-default link color and underline/)
      expect(a[0]).toMatch(/\[data-presentation-attribution\]/)
    }
  })

  it('stays advisory: exit zero with warnings, and no warnings for a polished presentation', () => {
    expect(rough.code).toBe(0)
    expect(warnings(rough.out).length).toBeGreaterThan(0)
    expect(impatient.code).toBe(0)
    expect(polished.code).toBe(0)
    expect(warnings(polished.out)).toEqual([])
    expect(polished.out).toMatch(/inspect: 3 screenshots, 0 advisory warning/)
  })

  it('fails with a clear error (non-zero) on a script fault such as an unknown presentation', async () => {
    const r = await run('node', ['scripts/inspect-presentation.mjs', 'missing', '--skip-build', '--out', 'x'], dir)
    expect(r.code).toBe(1)
    expect(r.out).toMatch(/inspect: ERROR/)
  })
})
