import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, exec, gone, previewPid, removeDir, tempDir } from './helpers.ts'

const dir = tempDir('inspect-int')
const outDir = path.join(dir, 'shots')

interface Variant {
  slug: string
  css: string
  /** Scene body for step 1 and step 2 (JSX). */
  steps: [string, string]
}

const OVERLAP = `<Label id="one" rect={{ x: 100, y: 100, w: 200, h: 24 }}>first collider</Label><Label id="two" rect={{ x: 110, y: 106, w: 200, h: 24 }}>second collider</Label>`
const ALONE = `<Label id="solo" rect={{ x: 100, y: 100, w: 200, h: 24 }}>alone</Label>`
const OTHER = `<Label id="other" rect={{ x: 400, y: 200, w: 200, h: 24 }}>second step</Label>`

const POLISHED = `
.v-polished [data-presentation-progress-dot][data-presentation-active='true'] { background: #0a7; border-color: #0a7; }
.v-polished [data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; background: #def; }
.v-polished [data-presentation-attribution] { font-size: 13px; color: #456; }
`

const variants: Variant[] = [
  { slug: 'fx-polished', css: POLISHED, steps: [ALONE, OTHER] },
  { slug: 'fx-collision', css: POLISHED.replaceAll('v-polished', 'v-collision'), steps: [ALONE, OVERLAP] },
  { slug: 'fx-allowed', css: POLISHED.replaceAll('v-polished', 'v-allowed'), steps: [ALONE, `<div data-presentation-allow-overlap="">${OVERLAP}</div>`] },
  {
    slug: 'fx-pill',
    // Width alone distinguishes the active dot; the table-of-contents entry is distinguished by weight.
    css: `.v-pill [data-presentation-progress-dot] { width: 14px; padding: 0; }
.v-pill [data-presentation-progress-dot][data-presentation-active='true'] { width: 32px; }
.v-pill [data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; }
.v-pill [data-presentation-attribution] { font-size: 13px; color: #456; }`,
    steps: [ALONE, OTHER],
  },
  {
    slug: 'fx-hidden',
    css: POLISHED.replaceAll('v-polished', 'v-hidden'),
    steps: [ALONE, `<div style={{ opacity: 0 }}>${OVERLAP}</div>`],
  },
  { slug: 'fx-plain', css: '', steps: [ALONE, OTHER] },
  { slug: 'fx-small-attribution', css: `${POLISHED.replaceAll('v-polished', 'v-small-attribution')}.v-small-attribution [data-presentation-attribution] { font-size: 10px; }`, steps: [ALONE, OTHER] },
]

function fixture(v: Variant) {
  const root = path.join(dir, 'src', 'presentations', v.slug)
  mkdirSync(root, { recursive: true })
  const cls = v.slug.replace('fx-', 'v-')
  writeFileSync(path.join(root, 'talk.css'), v.css)
  writeFileSync(
    path.join(root, 'Talk.tsx'),
    `import { useEffect, useState } from 'react'
import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit/index.ts'
import './talk.css'

// Step 2 content only appears 500ms after the step is entered, like an animation that settles late.
function Scene({ payload }: SceneProps<{ n: number }>) {
  const [late, setLate] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLate(true), 500)
    return () => clearTimeout(t)
  }, [payload.n])
  const first = <SceneLayer>${v.steps[0]}</SceneLayer>
  const second = <SceneLayer>${v.steps[1]}</SceneLayer>
  return payload.n === 0 ? first : late ? second : <SceneLayer><Label id="wait" rect={{ x: 0, y: 0, w: 10, h: 10 }}>.</Label></SceneLayer>
}

const steps: Step<{ n: number }>[] = [0, 1].map((n) => ({
  id: 's' + n, era: n === 0 ? 'one' : 'two', title: 'Title ' + n, caption: 'Caption ' + n,
  groupKey: 'g', Scene, payload: { n },
}))

export default function Talk() {
  return <Presentation steps={steps} initialMode="browse" className="${cls}" />
}
`,
  )
}

beforeAll(async () => {
  copyProject(dir)
  for (const v of variants) fixture(v)
  const registryFile = path.join(dir, 'src', 'presentations', 'index.ts')
  const entries = variants.map((v) => `  { slug: '${v.slug}', title: '${v.slug}', load: () => import('./${v.slug}/Talk') },`).join('\n')
  writeFileSync(registryFile, readFileSync(registryFile, 'utf8').replace('export const PRESENTATIONS: PresentationEntry[] = [', `export const PRESENTATIONS: PresentationEntry[] = [\n${entries}`))
  const build = await exec('npm', ['run', 'build'], dir)
  expect(build.code, build.output).toBe(0)
})
afterAll(() => removeDir(dir))

const inspect = (slug: string, extra: string[] = []) =>
  exec('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', '--out', outDir, ...extra], dir)
const shot = (slug: string, n: number) => path.join(outDir, slug, `step-0${n}.png`)
const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  it('writes one 1440×900 PNG per step under the predictable directory, from a 127.0.0.1 preview', async () => {
    const result = await inspect('fx-polished')
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/preview: http:\/\/127\.0\.0\.1:\d+/)
    for (const n of [1, 2]) {
      const file = shot('fx-polished', n)
      expect(existsSync(file), file).toBe(true)
      const png = readFileSync(file)
      expect(png.subarray(1, 4).toString()).toBe('PNG')
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1440, 900])
    }
    expect(existsSync(shot('fx-polished', 3))).toBe(false)
    expect(hash(shot('fx-polished', 1))).not.toBe(hash(shot('fx-polished', 2)))
    expect(result.output).toContain('no advisory warnings')
  })

  it('captures only after transitions settle: a late collision is reported with the default interval but missed with none', async () => {
    const settled = await inspect('fx-collision')
    expect(settled.code, settled.output).toBe(0)
    expect(settled.output).toMatch(/WARN step 2: text\/chrome overlap: .*first collider.* overlaps .*second collider/)
    expect(settled.output).not.toMatch(/WARN step 1: text\/chrome overlap/)
    for (const match of settled.output.matchAll(/after (\d+)ms settle/g)) expect(Number(match[1])).toBeGreaterThanOrEqual(1000)
    const hasty = await inspect('fx-collision', ['--settle-ms', '50'])
    expect(hasty.code).toBe(0)
    expect(hasty.output).not.toMatch(/collider/)
  })

  it('does not warn about an overlap inside an explicit allow-overlap subtree', async () => {
    const result = await inspect('fx-allowed')
    expect(result.code, result.output).toBe(0)
    expect(result.output).not.toMatch(/overlap/)
    expect(result.output).toContain('no advisory warnings')
  })

  it('warns about indistinct active chrome and unpolished attribution, exiting zero', async () => {
    const result = await inspect('fx-plain')
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/WARN step 1: indistinct active chrome: active progress indicator/)
    expect(result.output).toMatch(/WARN step 1: indistinct active chrome: active table-of-contents entry/)
    expect(result.output).toMatch(/WARN step 1: attribution uses the browser-default link color: style \[data-presentation-attribution\]/)
    expect(result.output).toMatch(/WARN step 1: attribution has no author styling rule: add one targeting \[data-presentation-attribution\]/)
    expect(existsSync(shot('fx-plain', 2))).toBe(true)
  })

  it('warns about undersized attribution without flagging the polished chrome', async () => {
    const result = await inspect('fx-small-attribution')
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/WARN step 1: attribution too small \(10px\)/)
    expect(result.output).not.toMatch(/indistinct|browser-default|overlap/)
  })

  it('does not treat width-only active styling as indistinct', async () => {
    const result = await inspect('fx-pill')
    expect(result.code, result.output).toBe(0)
    expect(result.output).toContain('no advisory warnings')
  })

  it('ignores overlapping text inside an invisible ancestor', async () => {
    const result = await inspect('fx-hidden')
    expect(result.code, result.output).toBe(0)
    expect(result.output).not.toMatch(/overlap/)
    expect(result.output).toContain('no advisory warnings')
  })

  it('exits non-zero with a capture failure when capturing fails after the preview started', async () => {
    const blocker = path.join(dir, 'not-a-directory')
    writeFileSync(blocker, 'file')
    const result = await exec('node', ['scripts/inspect-presentation.mjs', 'fx-polished', '--no-build', '--out', blocker], dir)
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/preview: http:\/\/127\.0\.0\.1:\d+ \(pid \d+\)/)
    expect(result.output).toMatch(/FAIL capture: .*ENOTDIR/)
    expect(result.output).not.toContain('done with')
    const pid = previewPid(result.output)
    expect(pid).not.toBeNull()
    expect(await gone(pid!)).toBe(true)
  })

  it('exits non-zero with a capture failure for an unregistered slug', async () => {
    const result = await inspect('nope')
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/FAIL capture: .*fx-polished/)
  })
})
