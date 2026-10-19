// INT-002: the project-local screenshot helper against a controlled production build.
// Run with: npm run test:integration -- tests/integration/inspect
import { execFile, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readdir, readFile, readFile as read, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const FIXTURE_DIR = join(REPO, 'tests/integration/fixtures/inspect-app')
// Build-irrelevant paths are not copied. tests/ is excluded because the copied tsconfig would type-check it.
const COPY_SKIP =
  /^(\.git|node_modules|dist|\.inspection|tests|validator_logs|\.agent-runner|skills)(\/|$)|\.test\.tsx?$|__fixtures__/

// Variants whose own CSS replaces the per-step hue (the settle probe paints its own canvas).
const SKIP_ORDER = new Set<string>(['inspect-settle-probe'])

let APP = ''
/** Separate artifact root so the narrow run cannot overwrite the default-viewport captures. */
let NARROW_OUT = ''
/** Results of the variant runs started once in beforeAll, keyed by run name. */
const batch = new Map<string, RunResult>()

async function copyFixtureFiles(from: string, to: string): Promise<void> {
  for (const entry of await readdir(from, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.txt')) continue
    const source = join(entry.parentPath, entry.name)
    const rel = relative(from, source).replace(/\.txt$/, '')
    await mkdir(dirname(join(to, rel)), { recursive: true })
    await writeFile(join(to, rel), await readFile(source))
  }
}

beforeAll(async () => {
  APP = await mkdtemp(join(tmpdir(), 'and-scene-inspect-'))
  NARROW_OUT = join(APP, 'narrow-out')
  await cp(REPO, APP, { recursive: true, filter: (src) => !COPY_SKIP.test(relative(REPO, src)) })
  await symlink(join(REPO, 'node_modules'), join(APP, 'node_modules'), 'dir')
  // Keep the repo's registry type; replace the sample registry with the controlled one.
  await rm(join(APP, 'src/presentations/how-to-make-a-presentation'), { recursive: true, force: true })
  await copyFixtureFiles(FIXTURE_DIR, APP)
  // Keep tsc build info out of the shared node_modules directory.
  for (const file of ['tsconfig.app.json', 'tsconfig.node.json']) {
    const path = join(APP, file)
    const text = await read(path, 'utf8')
    await writeFile(path, text.replace('./node_modules/.tmp/', './.tsbuild/'))
  }
  try {
    execFileSync('npm', ['run', 'build'], { cwd: APP, stdio: 'pipe', timeout: 240_000 })
  } catch (err) {
    const output = String((err as { stdout?: Buffer }).stdout ?? '') + String((err as { stderr?: Buffer }).stderr ?? '')
    throw new Error(`fixture build failed:\n${output.slice(-4000)}`, { cause: err })
  }
  // Variant captures run three at a time; each has its own preview server and browser.
  const jobs: { key: string; args: string[] }[] = [
    ...VARIANTS.map((slug) => ({ key: slug, args: [slug] })),
    { key: 'polished-narrow', args: ['inspect-polished', '--viewport', '900x700', '--out', NARROW_OUT] },
  ]
  let next = 0
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++]
      batch.set(job.key, await runHelper([...job.args, '--no-build']))
    }
  }
  await Promise.all([worker(), worker(), worker()])
}, 420_000)

afterAll(async () => {
  if (APP) await rm(APP, { recursive: true, force: true })
})

interface RunResult {
  code: number
  stdout: string
  stderr: string
}

function runHelper(args: string[]): Promise<RunResult> {
  return new Promise((done) => {
    execFile(
      process.execPath,
      [join(APP, 'scripts/inspect-presentation.mjs'), ...args],
      { cwd: APP, timeout: 150_000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0
        done({ code, stdout: String(stdout), stderr: String(stderr) })
      },
    )
  })
}

const VARIANTS = [
  'inspect-collision',
  'inspect-allowed-overlap',
  'inspect-indistinct',
  'inspect-polished',
  'inspect-attr-small',
  'inspect-attr-default-link',
  'inspect-attr-default-serif',
  'inspect-attr-missing',
] as const

/**
 * Variant runs use the default settle. Diagnostics read the DOM, so a short settle would catch the
 * previous step's exit animation and the newcomer's entrance mid-flight and report false overlaps.
 */
function captured(key: string): RunResult {
  const run = batch.get(key)
  if (!run) throw new Error(`no batch run named ${key}`)
  return run
}

interface Warning {
  step: number
  kind: string
  message: string
}

function warningsOf(stdout: string): Warning[] {
  return stdout
    .split('\n')
    .map((line) => /^warning: step (\d+): ([^:]+): (.*)$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({ step: Number(match[1]), kind: match[2], message: match[3] }))
}

interface Decoded {
  width: number
  height: number
  channels: number
  pixels: Buffer
}

/** Minimal 8-bit RGB/RGBA PNG decoder; throws when the file is not a decodable PNG. */
function decodePng(buf: Buffer): Decoded {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  if (!signature.every((byte, i) => buf[i] === byte)) throw new Error('not a PNG')
  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  const idat: Buffer[] = []
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset)
    const type = buf.toString('latin1', offset + 4, offset + 8)
    const data = buf.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      interlace = data[12]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }
  if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`unsupported PNG colour type ${colorType} / depth ${bitDepth}`)
  }
  const channels = colorType === 6 ? 4 : 3
  const stride = width * channels
  const raw = inflateSync(Buffer.concat(idat))
  if (raw.length !== height * (stride + 1)) throw new Error('scanline data does not match the header')
  const out = Buffer.alloc(height * stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const source = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const row = out.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? row[x - channels] : 0
      const up = prev ? prev[x] : 0
      const upLeft = prev && x >= channels ? prev[x - channels] : 0
      let value = source[x]
      if (filter === 1) value += left
      else if (filter === 2) value += up
      else if (filter === 3) value += (left + up) >> 1
      else if (filter === 4) {
        const p = left + up - upLeft
        const pa = Math.abs(p - left)
        const pb = Math.abs(p - up)
        const pc = Math.abs(p - upLeft)
        value += pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft
      } else if (filter !== 0) throw new Error(`unknown PNG filter ${filter}`)
      row[x] = value & 0xff
    }
  }
  return { width, height, channels, pixels: out }
}

function greenFraction(png: Decoded): number {
  const total = png.width * png.height
  let green = 0
  for (let i = 0; i < total; i++) {
    const o = i * png.channels
    if (png.pixels[o] < 100 && png.pixels[o + 1] > 200 && png.pixels[o + 2] < 100) green++
  }
  return green / total
}

/** Canvas hue painted by the fixture for each step (see fixture BASE_CSS); index = step position. */
const STEP_HUES: [number, number, number][] = [
  [250, 0, 0],
  [0, 0, 250],
  [250, 0, 250],
]

/** Index of the step hue that covers the most pixels, or -1 if none is present. */
function dominantStepHue(png: Decoded): number {
  const counts = STEP_HUES.map(() => 0)
  const total = png.width * png.height
  for (let i = 0; i < total; i++) {
    const o = i * png.channels
    STEP_HUES.forEach(([r, g, b], k) => {
      if (png.pixels[o] === r && png.pixels[o + 1] === g && png.pixels[o + 2] === b) counts[k]++
    })
  }
  const best = Math.max(...counts)
  return best === 0 ? -1 : counts.indexOf(best)
}

/** Reads the captured step files for a slug and checks count, decodability, size and distinctness. */
async function readCaptures(slug: string, count: number, width: number, height: number, outRoot = join(APP, '.inspection')) {
  const dir = join(outRoot, slug)
  const names = (await readdir(dir)).filter((n) => /^step-\d+\.png$/.test(n)).sort()
  const expected = Array.from({ length: count }, (_, i) => `step-${String(i + 1).padStart(2, '0')}.png`)
  expect(names).toEqual(expected)
  const buffers: Buffer[] = []
  const pngs: Decoded[] = []
  for (const name of names) {
    const buf = await readFile(join(dir, name))
    expect(buf.length).toBeGreaterThan(1000)
    const png = decodePng(buf)
    expect({ name, width: png.width, height: png.height }).toEqual({ name, width, height })
    buffers.push(buf)
    pngs.push(png)
  }
  const hashes = buffers.map((b) => createHash('sha256').update(b).digest('hex'))
  expect(new Set(hashes).size).toBe(count)
  // Step identity and order: capture k must show step k's content, not merely a distinct image.
  if (count === STEP_HUES.length && !SKIP_ORDER.has(slug)) {
    expect(pngs.map(dominantStepHue)).toEqual(STEP_HUES.map((_, i) => i))
  }
  return { buffers, pngs }
}

function expectWarnings(warnings: Warning[], expected: { step: number; kind: string; includes: string[] }[]) {
  expect(warnings.map((w) => `${w.step}:${w.kind}`).sort()).toEqual(expected.map((e) => `${e.step}:${e.kind}`).sort())
  for (const want of expected) {
    const match = warnings.find((w) => w.step === want.step && w.kind === want.kind && want.includes.every((s) => w.message.includes(s)))
    expect(match, `missing ${want.kind} warning for step ${want.step} with ${want.includes.join(', ')}`).toBeDefined()
  }
}

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  it('rejects bad options before any browser work (usage error exits 2)', async () => {
    const run = await runHelper(['inspect-polished', '--viewport', '0x900', '--no-build'])
    expect(run.code).toBe(2)
    expect(run.stderr).toContain('viewport')
  })

  it('captures every step at the default 1440x900 with distinct content, and exits 0 on warnings (L-59, L-60, I-51)', async () => {
    const run = captured('inspect-collision')
    expect(run.code).toBe(0)
    expect(run.stdout).toContain('captured 3 step(s)')
    await readCaptures('inspect-collision', 3, 1440, 900)
  })

  it('reports an unmarked text/text collision and a text/chrome collision, each naming its step and elements (L-61)', async () => {
    const run = captured('inspect-collision')
    const warnings = warningsOf(run.stdout).filter((w) => w.kind === 'overlap')
    expect(warnings.every((w) => w.kind === 'overlap')).toBe(true)
    const chromeCollision = (w: Warning) => w.message.includes('data-presentation-marker') && w.message.includes('brand-collide')
    const textCollision = (w: Warning) => w.message.includes('collide-a') && w.message.includes('collide-b')
    expect(warnings.filter((w) => w.step === 1 && chromeCollision(w))).toHaveLength(1)
    expect(warnings.filter((w) => w.step === 2 && chromeCollision(w))).toHaveLength(1)
    expect(warnings.filter((w) => w.step === 2 && textCollision(w))).toHaveLength(1)
    expect(warnings.filter((w) => w.step === 3 && chromeCollision(w))).toHaveLength(1)
    expect(warnings.filter((w) => w.step === 3 && textCollision(w))).toHaveLength(0)
    expect(warnings).toHaveLength(4)
  })

  it('does not warn about an explicitly marked overlap but still warns about an unmarked collision in the same step (L-62)', async () => {
    const run = captured('inspect-allowed-overlap')
    expect(run.code).toBe(0)
    await readCaptures('inspect-allowed-overlap', 3, 1440, 900)
    expect(run.stdout).not.toContain('data-presentation-id="marked-')
    expectWarnings(warningsOf(run.stdout), [
      { step: 2, kind: 'overlap', includes: ['unmarked-a', 'unmarked-b'] },
    ])
  })

  it('reports indistinct progress and ToC active chrome per step, naming the chrome (L-63)', async () => {
    const run = captured('inspect-indistinct')
    expect(run.code).toBe(0)
    await readCaptures('inspect-indistinct', 3, 1440, 900)
    const expected = [1, 2, 3].flatMap((step) => [
      { step, kind: 'indistinct-active', includes: ['data-presentation-progress-item', 'data-presentation-active="true"'] },
      { step, kind: 'indistinct-active', includes: ['data-presentation-toc-item', 'data-presentation-active="true"'] },
    ])
    expectWarnings(warningsOf(run.stdout), expected)
  })

  it('emits no warnings for distinctly styled active chrome and legible attribution (L-63, L-64)', async () => {
    const run = captured('inspect-polished')
    expect(run.code).toBe(0)
    await readCaptures('inspect-polished', 3, 1440, 900)
    expect(warningsOf(run.stdout)).toEqual([])
  })

  it('reports an attribution font size below 11 px against the attribution hook (L-64)', async () => {
    const run = captured('inspect-attr-small')
    expect(run.code).toBe(0)
    await readCaptures('inspect-attr-small', 3, 1440, 900)
    expectWarnings(
      warningsOf(run.stdout),
      [1, 2, 3].map((step) => ({ step, kind: 'attribution', includes: ['data-presentation-attribution', 'font-size 10px'] })),
    )
  })

  it('reports a browser-default blue underlined attribution link (L-64)', async () => {
    const run = captured('inspect-attr-default-link')
    expect(run.code).toBe(0)
    await readCaptures('inspect-attr-default-link', 3, 1440, 900)
    expectWarnings(
      warningsOf(run.stdout),
      [1, 2, 3].map((step) => ({ step, kind: 'attribution', includes: ['data-presentation-attribution', 'browser-default link'] })),
    )
  })

  it('reports a browser-default serif attribution font (L-64)', async () => {
    const run = captured('inspect-attr-default-serif')
    expect(run.code).toBe(0)
    await readCaptures('inspect-attr-default-serif', 3, 1440, 900)
    expectWarnings(
      warningsOf(run.stdout),
      [1, 2, 3].map((step) => ({ step, kind: 'attribution', includes: ['data-presentation-attribution', 'browser-default serif'] })),
    )
  })

  it('reports a missing attribution against the attribution hook (L-64)', async () => {
    const run = captured('inspect-attr-missing')
    expect(run.code).toBe(0)
    await readCaptures('inspect-attr-missing', 3, 1440, 900)
    expectWarnings(
      warningsOf(run.stdout),
      [1, 2, 3].map((step) => ({ step, kind: 'attribution', includes: ['data-presentation-attribution', 'missing'] })),
    )
  })

  it('honours --viewport for both the captured dimensions and the browser view (L-43)', async () => {
    const run = captured('polished-narrow')
    expect(run.code).toBe(0)
    await readCaptures('inspect-polished', 3, 900, 700, NARROW_OUT)
  })

  it('waits the configured settle interval after each transition before capturing (L-60)', async () => {
    // The probe animates red to green over 3000 ms after each step mounts. A capture 150 ms after the step
    // change must still be mid-transition; one taken after a 4000 ms settle must show the final green state.
    const early = await runHelper(['inspect-settle-probe', '--no-build', '--settle', '150'])
    expect(early.code).toBe(0)
    const earlyPngs = (await readCaptures('inspect-settle-probe', 3, 1440, 900)).pngs
    for (const png of earlyPngs) expect(greenFraction(png)).toBeLessThan(0.02)

    const settled = await runHelper(['inspect-settle-probe', '--no-build', '--settle', '4000'])
    expect(settled.code).toBe(0)
    const settledPngs = (await readCaptures('inspect-settle-probe', 3, 1440, 900)).pngs
    for (const png of settledPngs) expect(greenFraction(png)).toBeGreaterThan(0.3)
  }, 120_000)

  it('exits non-zero for an unknown slug, distinguishing capture failure from advisory warnings (I-51)', async () => {
    const run = await runHelper(['no-such-presentation', '--no-build'])
    expect(run.code).toBe(1)
    expect(run.stderr).toContain('render failed')
  })

  it('keeps screenshots out of git: .inspection is ignored and nothing under it is tracked (I-51)', async () => {
    const gitignore = await readFile(join(REPO, '.gitignore'), 'utf8')
    expect(gitignore.split('\n').map((l) => l.trim())).toContain('.inspection')
    // git check-ignore -q exits 0 only when the path is ignored.
    expect(() => execFileSync('git', ['check-ignore', '-q', '.inspection/some-slug/step-01.png'], { cwd: REPO })).not.toThrow()
    const tracked = execFileSync('git', ['ls-files', '--', '.inspection'], { cwd: REPO }).toString().trim()
    expect(tracked).toBe('')
  })
})
