import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, run, type RunResult } from './helpers'

// INT-002: the screenshot helper drives a production preview of registered fixtures in Chromium.
let project: string
let script: string
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const SHARED = `import { useEffect, useRef, type CSSProperties } from 'react'
import { Presentation, type AttributionOptions, type SceneProps, type Step } from '../../presentation-kit'

export interface DeckConfig {
  title: string
  collisions: boolean
  allowedOverlap: boolean
  styled: boolean
  attribution: 'default' | 'polished' | 'absent'
  /** Icon-only control fixed at the bottom-right corner, over the attribution. */
  iconCollision?: boolean
  /** Step 1 holds an opacity:0 ancestor over overlapping text; step 2 holds a visible collision. */
  hiddenOverlap?: boolean
}

interface Payload {
  n: number
  config: DeckConfig
}

const BEATS = [
  { id: 'one', era: 'AA', title: 'First beat', caption: 'Alpha and Beta share one spot.' },
  { id: 'two', era: 'AA', title: 'Second beat', caption: 'Gamma and Delta overlap on purpose.' },
  { id: 'three', era: 'BB', title: 'Third beat', caption: 'Nothing collides here.' },
]

const at = (left: number, top: number): CSSProperties => ({ position: 'absolute', left, top })

function Beat({ payload }: SceneProps<Payload>) {
  const { n, config } = payload
  return (
    <>
      <span style={at(40, 40)}>Beat {n}</span>
      {config.hiddenOverlap && n === 1 ? (
        <>
          <span style={at(200, 120)}>Alpha</span>
          <div style={{ opacity: 0 }}>
            <span style={at(200, 120)}>Beta</span>
          </div>
        </>
      ) : null}
      {config.collisions && n === 1 ? (
        <>
          <span style={at(200, 120)}>Alpha</span>
          <span style={at(200, 120)}>Beta</span>
        </>
      ) : null}
      {config.allowedOverlap && n === 2 ? (
        <div data-presentation-allow-overlap="" style={at(200, 120)}>
          <span style={at(0, 0)}>Gamma</span>
          <span style={at(0, 0)}>Delta</span>
        </div>
      ) : null}
      {(config.collisions || config.hiddenOverlap) && n === 2 ? (
        <>
          <span style={at(500, 260)}>Epsilon</span>
          <span style={at(500, 260)}>Zeta</span>
        </>
      ) : null}
    </>
  )
}

const SIZE_CSS = '[data-presentation-toc-item],[data-presentation-progress-item]{width:64px;height:28px}'
const DISTINCT_CSS =
  '[data-presentation-progress-item][data-presentation-active="true"],[data-presentation-toc-item][data-presentation-active="true"]{color:#b00020;font-weight:700;text-decoration:underline;background-color:#ffe4e1;border:2px solid #b00020}'
const POLISHED_ATTR = '[data-presentation-attribution]{font-size:12px;color:#555;font-family:sans-serif}'

export function makeDeck(config: DeckConfig) {
  const steps: Step<Payload>[] = BEATS.map((beat, i) => ({
    ...beat,
    groupKey: 'deck',
    Scene: Beat,
    payload: { n: i + 1, config },
  }))
  const attribution: AttributionOptions | null = config.attribution === 'absent' ? null : {}
  const css = [SIZE_CSS, config.styled ? DISTINCT_CSS : '', config.attribution === 'polished' ? POLISHED_ATTR : ''].join('\\n')
  return function Deck() {
    return (
      <Presentation
        steps={steps}
        title={config.title}
        initialMode="browse"
        attribution={attribution}
        brand={
          <>
            {config.iconCollision ? (
              <button
                type="button"
                aria-label="Help"
                style={{ position: 'fixed', right: 0, bottom: 0, width: 24, height: 24, padding: 0 }}
              >
                <svg width="12" height="12" viewBox="0 0 10 10">
                  <rect width="10" height="10" />
                </svg>
              </button>
            ) : null}
            <style>{css}</style>
          </>
        }
      />
    )
  }
}

// Each step's background moves from red to its payload colour over 1.6s after the step mounts, using
// a requestAnimationFrame clock. The clock is local to the scene so the timing does not depend on how
// motion treats colours under AnimatePresence initial={false}.
const PROBE_MS = 1600
const channel = (hex: string, i: number) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16)
function mix(from: string, to: string, t: number): string {
  const parts = [0, 1, 2].map((i) => Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * t))
  return 'rgb(' + parts.join(', ') + ')'
}

function Probe({ payload }: SceneProps<string>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const start = performance.now()
    let frame = 0
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / PROBE_MS)
      if (ref.current) ref.current.style.backgroundColor = mix('#ff0000', payload, t)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [payload])
  return <div ref={ref} style={{ position: 'absolute', left: 240, top: 100, width: 400, height: 180, backgroundColor: '#ff0000' }} />
}

export function makeProbe() {
  const steps: Step<string>[] = [
    { id: 'green', era: 'P', title: 'Green', caption: 'Transitions to green.', groupKey: 'probe', Scene: Probe, payload: '#00ff00' },
    { id: 'blue', era: 'P', title: 'Blue', caption: 'Transitions to blue.', groupKey: 'probe', Scene: Probe, payload: '#0000ff' },
  ]
  return function ProbeDeck() {
    return <Presentation steps={steps} title="Settle probe" initialMode="browse" />
  }
}
`

const FIXTURES: Record<string, string> = {
  'inspect-defects': "import { makeDeck } from './shared'\nexport default makeDeck({ title: 'Inspect defects', collisions: true, allowedOverlap: true, styled: false, attribution: 'default' })\n",
  'inspect-clean': "import { makeDeck } from './shared'\nexport default makeDeck({ title: 'Inspect clean', collisions: false, allowedOverlap: true, styled: true, attribution: 'polished' })\n",
 'inspect-icon-collision': "import { makeDeck } from './shared'\nexport default makeDeck({ title: 'Inspect icon collision', collisions: false, allowedOverlap: false, styled: true, attribution: 'polished', iconCollision: true })\n",
  'inspect-hidden-overlap': "import { makeDeck } from './shared'\nexport default makeDeck({ title: 'Inspect hidden overlap', collisions: false, allowedOverlap: false, styled: true, attribution: 'polished', hiddenOverlap: true })\n",
  'inspect-no-attribution': "import { makeDeck } from './shared'\nexport default makeDeck({ title: 'Inspect no attribution', collisions: false, allowedOverlap: false, styled: true, attribution: 'absent' })\n",
  'inspect-settle': "import { makeProbe } from './shared'\nexport default makeProbe()\n",
}

function writeFixtures(dir: string) {
  // The copy serves only the fixtures: drop the sample and the unit tests under src, which tsc -b
  // would otherwise type-check as part of the app build.
  rmSync(join(dir, 'src/presentations/how-to-make-a-presentation'), { recursive: true, force: true })
  for (const rel of readdirSync(join(dir, 'src'), { recursive: true })) {
    if (/\.test\.(ts|tsx|mjs)$/.test(rel)) rmSync(join(dir, 'src', rel), { force: true })
  }
  const fixtureDir = join(dir, 'src/presentations/inspect-fixtures')
  mkdirSync(fixtureDir, { recursive: true })
  writeFileSync(join(fixtureDir, 'shared.tsx'), SHARED)
  for (const [slug, source] of Object.entries(FIXTURES)) writeFileSync(join(fixtureDir, `${slug}.tsx`), source)
  const entries = Object.entries(FIXTURES)
    .map(([slug]) => `  { slug: '${slug}', title: '${slug}', load: () => import('./inspect-fixtures/${slug}') },`)
    .join('\n')
  writeFileSync(
    join(dir, 'src/presentations/index.ts'),
    `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: readonly PresentationEntry[] = [
${entries}
]
`,
  )
}

interface Png {
  width: number
  height: number
  channels: number
  pixels: Buffer
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

/** Minimal 8-bit RGB/RGBA PNG decoder: validates the signature, IHDR and every scanline. */
function decodePng(file: Buffer): Png {
  expect(file.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true)
  let offset = 8
  let header: { width: number; height: number; bitDepth: number; colorType: number } | undefined
  const idat: Buffer[] = []
  while (offset < file.length) {
    const length = file.readUInt32BE(offset)
    const type = file.toString('latin1', offset + 4, offset + 8)
    const data = file.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      header = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8], colorType: data[9] }
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }
  if (!header) throw new Error('PNG has no IHDR')
  const channels = header.colorType === 2 ? 3 : header.colorType === 6 ? 4 : 0
  if (!channels || header.bitDepth !== 8) throw new Error(`unsupported PNG colorType ${header.colorType} depth ${header.bitDepth}`)
  const stride = header.width * channels
  const raw = inflateSync(Buffer.concat(idat))
  expect(raw.length).toBe(header.height * (stride + 1))
  const out = Buffer.alloc(header.height * stride)
  for (let y = 0; y < header.height; y++) {
    const filter = raw[y * (stride + 1)]
    const src = y * (stride + 1) + 1
    const dst = y * stride
    for (let x = 0; x < stride; x++) {
      const v = raw[src + x]
      const a = x >= channels ? out[dst + x - channels] : 0
      const b = y > 0 ? out[dst - stride + x] : 0
      const c = x >= channels && y > 0 ? out[dst - stride + x - channels] : 0
      let p: number
      if (filter === 0) p = v
      else if (filter === 1) p = v + a
      else if (filter === 2) p = v + b
      else if (filter === 3) p = v + ((a + b) >> 1)
      else if (filter === 4) p = v + paeth(a, b, c)
      else throw new Error(`bad PNG filter ${filter}`)
      out[dst + x] = p & 0xff
    }
  }
  return { width: header.width, height: header.height, channels, pixels: out }
}

function countColor(png: Png, [r, g, b]: [number, number, number]): number {
  let n = 0
  for (let i = 0; i < png.pixels.length; i += png.channels) {
    if (png.pixels[i] === r && png.pixels[i + 1] === g && png.pixels[i + 2] === b) n++
  }
  return n
}

const inspectDir = (slug: string, narrow = false) => join(project, '.inspection', slug, ...(narrow ? ['narrow'] : []))
const readPng = (slug: string, step: number, narrow = false) =>
  readFileSync(join(inspectDir(slug, narrow), `step-${String(step).padStart(2, '0')}.png`))

function inspect(args: string[], cwd = project): Promise<RunResult> {
  return run(process.execPath, [script, ...args], { cwd })
}

const warningLines = (output: string) => output.split('\n').filter((l) => l.startsWith('WARN '))

beforeAll(() => {
  project = copyProject('and-scene-inspect-')
  script = join(project, 'scripts', 'inspect-presentation.mjs')
  writeFixtures(project)
}, 240_000)

afterAll(() => {
  if (project) rmSync(project, { recursive: true, force: true })
})

describe('inspection helper (INT-002)', () => {
  let defectsOutput = ''

  it('builds, then writes one decodable 1440x900 PNG per step with step-specific content, from any caller cwd', async () => {
    const result = await inspect(['inspect-defects'], tmpdir())
    defectsOutput = result.output
    expect(result.code, result.output).toBe(0)
    const files = ['step-01.png', 'step-02.png', 'step-03.png']
    const dir = inspectDir('inspect-defects')
    expect(new Set(readdirSync(dir))).toEqual(new Set(files))
    const hashes = files.map((_, i) => {
      const bytes = readPng('inspect-defects', i + 1)
      expect(bytes.length).toBeGreaterThan(1000)
      const png = decodePng(bytes)
      expect(png.width).toBe(1440)
      expect(png.height).toBe(900)
      return bytes.toString('base64')
    })
    expect(new Set(hashes).size).toBe(3)
  }, 240_000)

  it('reports step-specific advisory warnings for the unmarked collisions, indistinct chrome and attribution defect', () => {
    const lines = warningLines(defectsOutput)
    const overlap1 = lines.find((l) => l.startsWith('WARN step 1 [overlap]'))
    expect(overlap1).toBeDefined()
    expect(overlap1).toMatch(/Alpha/)
    expect(overlap1).toMatch(/Beta/)
    const overlap2 = lines.find((l) => l.startsWith('WARN step 2 [overlap]'))
    expect(overlap2).toMatch(/Epsilon/)
    expect(overlap2).toMatch(/Zeta/)
    const overlapLines = lines.filter((l) => l.includes('[overlap]'))
    expect(overlapLines.some((l) => /Gamma|Delta/.test(l))).toBe(false)
    for (const step of [1, 2, 3]) {
      expect(lines.some((l) => l.startsWith(`WARN step ${step} [active-chrome]`))).toBe(true)
      expect(lines.some((l) => l.startsWith(`WARN step ${step} [attribution]`) && l.includes('data-presentation-attribution'))).toBe(true)
    }
  })

  it('reports an icon-only control colliding with the attribution chrome, on every step', async () => {
    const result = await inspect(['inspect-icon-collision', '--no-build'])
    expect(result.code, result.output).toBe(0)
    const lines = warningLines(result.output)
    for (const step of [1, 2, 3]) {
      const line = lines.find((l) => l.startsWith(`WARN step ${step} [overlap]`))
      expect(line, result.output).toBeDefined()
      expect(line).toMatch(/button/)
      expect(line).toMatch(/data-presentation-attribution/)
    }
  })

  it('does not report text under an opacity:0 ancestor, but still reports a visible collision on the same deck', async () => {
    const result = await inspect(['inspect-hidden-overlap', '--no-build'])
    expect(result.code, result.output).toBe(0)
    const overlaps = warningLines(result.output).filter((l) => l.includes('[overlap]'))
    expect(overlaps).toHaveLength(1)
    expect(overlaps[0]).toMatch(/^WARN step 2 \[overlap\]/)
    expect(overlaps[0]).toMatch(/Epsilon/)
    expect(overlaps[0]).toMatch(/Zeta/)
    expect(overlaps[0]).not.toMatch(/Beta/)
  })

  it('captures are settled: every step, including the first, shows the finished transition', async () => {
    const settled = await inspect(['inspect-settle', '--no-build'])
    expect(settled.code, settled.output).toBe(0)
    const green = decodePng(readPng('inspect-settle', 1))
    expect(countColor(green, [0, 255, 0])).toBeGreaterThan(5000)
    const blue = decodePng(readPng('inspect-settle', 2))
    expect(countColor(blue, [0, 0, 255])).toBeGreaterThan(5000)
    expect(countColor(blue, [0, 255, 0])).toBe(0)
    expect(readPng('inspect-settle', 1).equals(readPng('inspect-settle', 2))).toBe(false)

    // With no settle interval the captures land mid-transition, so the pixels are not the settled colour.
    const eager = await inspect(['inspect-settle', '--no-build', '--settle', '0'])
    expect(eager.code, eager.output).toBe(0)
    expect(countColor(decodePng(readPng('inspect-settle', 1)), [0, 255, 0])).toBeLessThan(5000)
    expect(countColor(decodePng(readPng('inspect-settle', 2)), [0, 0, 255])).toBeLessThan(5000)
  }, 240_000)

  it('exits zero with no warnings for a polished, locally styled variant with an allowed overlap', async () => {
    const result = await inspect(['inspect-clean', '--no-build'])
    expect(result.code, result.output).toBe(0)
    expect(warningLines(result.output)).toEqual([])
    expect(decodePng(readPng('inspect-clean', 3)).width).toBe(1440)
  })

  it('narrow runs write 390x844 screenshots into the narrow subdirectory', async () => {
    const result = await inspect(['inspect-clean', '--no-build', '--narrow'])
    expect(result.code, result.output).toBe(0)
    const png = decodePng(readPng('inspect-clean', 1, true))
    expect([png.width, png.height]).toEqual([390, 844])
  })

  it('reports missing attribution for every step and still exits zero', async () => {
    const result = await inspect(['inspect-no-attribution', '--no-build'])
    expect(result.code, result.output).toBe(0)
    const lines = warningLines(result.output)
    for (const step of [1, 2, 3]) {
      expect(lines.some((l) => l.startsWith(`WARN step ${step} [attribution]`) && l.includes('data-presentation-attribution'))).toBe(true)
    }
    expect(decodePng(readPng('inspect-no-attribution', 3)).height).toBe(900)
  })

  it('exits non-zero for a route that is not a registered presentation', async () => {
    const result = await run('npm', ['run', 'inspect', '--', 'no-such-presentation', '--no-build'], { cwd: project })
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/route not found/)
  })
})
