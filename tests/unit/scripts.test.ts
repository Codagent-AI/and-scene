import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM scripts without type declarations
import { HOST, freePort, startPreview, urlFor } from '../../scripts/lib/preview.mjs'
// @ts-expect-error plain ESM scripts without type declarations
import { DEFAULTS, MIN_ATTRIBUTION_PX, attributionIssue, findOverlaps, isIndistinct, parseArgs, rectsOverlap, shotPath, warningsFor } from '../../scripts/inspect-presentation.mjs'
// @ts-expect-error plain ESM scripts without type declarations
import { VerifyError, formatFailure, runVerify, validateSample } from '../../scripts/verify.mjs'
import { listFiles, text } from '../helpers/tree.ts'

const manifest = JSON.parse(text('scripts/verify-manifest.json'))
const good = () => manifest.steps.map((s: object) => ({ ...s }))
const registry = "export const P = [{ slug: 'how-to-make-a-presentation', title: 'x' }]"

describe('validateSample', () => {
  it('accepts the canonical sample', () => {
    expect(validateSample({ registrySource: registry, narration: good(), manifest })).toEqual([])
  })

  it('normalises whitespace only', () => {
    const n = good()
    n[0].title = `  You   have a\ntopic `
    expect(validateSample({ registrySource: registry, narration: n, manifest })).toEqual([])
    n[0].title = 'You have a Topic'
    expect(validateSample({ registrySource: registry, narration: n, manifest })).toHaveLength(1)
  })

  it('fails when the sample is not registered', () => {
    expect(validateSample({ registrySource: 'export const P = []', narration: good(), manifest })[0]).toMatch(/not registered/)
  })

  it('fails on wrong count, missing fields and wrong era, title or caption, even if the manifest itself is right', () => {
    const short = good().slice(0, 8)
    expect(validateSample({ registrySource: registry, narration: short, manifest })[0]).toMatch(/expected 9 steps, found 8/)
    const broken = good()
    broken[2].caption = 'nope'
    broken[4].era = 'wrong'
    delete broken[6].title
    const errors = validateSample({ registrySource: registry, narration: broken, manifest })
    expect(errors.join('\n')).toMatch(/step 3 caption/)
    expect(errors.join('\n')).toMatch(/step 5 era/)
    expect(errors.join('\n')).toMatch(/step 7 title/)
  })

  it('fails on out-of-order steps', () => {
    const n = good()
    ;[n[0], n[1]] = [n[1], n[0]]
    expect(validateSample({ registrySource: registry, narration: n, manifest }).length).toBeGreaterThanOrEqual(2)
  })

  it('fails on malformed narration data', () => {
    expect(validateSample({ registrySource: registry, narration: undefined, manifest })[0]).toMatch(/missing or malformed/)
    expect(validateSample({ registrySource: registry, narration: 'x', manifest })[0]).toMatch(/malformed/)
  })
})

describe('failure reporting', () => {
  it('names the phase and step', () => {
    expect(formatFailure(new VerifyError('render', 'boom', 3))).toBe('verify: FAIL phase=render step=3: boom')
    expect(formatFailure(new VerifyError('build', 'bad'))).toBe('verify: FAIL phase=build: bad')
    expect(formatFailure(new Error('x'))).toBe('verify: FAIL phase=internal: x')
    expect(formatFailure(new VerifyError('render', 'first', 0))).toContain('step=0')
    expect(formatFailure(new VerifyError('render', 'last', 8))).toContain('step=8')
  })

  it('returns a failing result (never a pass) when the build phase cannot run, without starting a preview', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'verify-unit-'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: { build: 'node -e "process.exit(3)"' } }))
    const lines: string[] = []
    const result = await runVerify({ cwd: dir, log: (l: string) => lines.push(l) })
    expect(result.ok).toBe(false)
    expect(lines.at(-1)).toMatch(/^verify: FAIL phase=build/)
    expect(lines.join('\n')).not.toMatch(/PASS|preview ready/)
    rmSync(dir, { recursive: true, force: true })
  })

  it('fails the sample phase when the manifest or sample is missing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'verify-unit-'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: { build: 'node -e ""' } }))
    const lines: string[] = []
    expect((await runVerify({ cwd: dir, log: (l: string) => lines.push(l) })).ok).toBe(false)
    expect(lines.at(-1)).toMatch(/phase=sample/)
    rmSync(dir, { recursive: true, force: true })
  })
})

describe('IPv4 loopback', () => {
  it('builds every URL from 127.0.0.1', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(urlFor(4173)).toBe('http://127.0.0.1:4173/')
    expect(urlFor(1, '/x')).toBe('http://127.0.0.1:1/x')
  })

  it('never mentions localhost or ::1 in the scripts (root or bootstrap copies)', () => {
    for (const dir of ['scripts', 'skills/presentation/templates/bootstrap/scripts']) {
      for (const f of listFiles(dir).filter((x) => /\.(mjs|json)$/.test(x))) {
        expect(text(join(dir, f)).replace(/^\s*\/\/.*$/gm, ''), f).not.toMatch(/localhost|\[::1\]/)
      }
    }
  })

  it('binds a free port on 127.0.0.1 and refuses to start without vite', async () => {
    const port = await freePort()
    expect(port).toBeGreaterThan(0)
    const dir = mkdtempSync(join(tmpdir(), 'preview-unit-'))
    await expect(startPreview(dir)).rejects.toThrow(/vite not installed/)
    rmSync(dir, { recursive: true, force: true })
  })

  it('serves the production build on 127.0.0.1 and the stop() kills the process', async () => {
    if (!existsSync('dist/index.html')) return
    const p = await startPreview(process.cwd())
    expect(p.url).toBe(`http://127.0.0.1:${p.port}/`)
    expect((await fetch(p.url)).ok).toBe(true)
    await p.stop()
    expect(() => process.kill(p.pid, 0)).toThrow()
    await expect(fetch(p.url)).rejects.toThrow()
  })
})

describe('inspection helper options', () => {
  it('defaults to a 1440x900 viewport, 1200ms settle and the project-local artifact directory', () => {
    const o = parseArgs(['demo'])
    expect(o).toMatchObject({ slug: 'demo', viewport: { width: 1440, height: 900 }, settleMs: 1200, outDir: '.presentation-inspect', build: true })
    expect(DEFAULTS.settleMs).toBe(1200)
  })

  it('parses viewport, settle, output and skip-build options and rejects bad ones', () => {
    expect(parseArgs(['--viewport', '390x844', 'demo', '--settle', '50', '--out', 'o', '--skip-build'])).toMatchObject({
      slug: 'demo', viewport: { width: 390, height: 844 }, settleMs: 50, outDir: 'o', build: false,
    })
    expect(() => parseArgs([])).toThrow(/usage/)
    expect(() => parseArgs(['demo', '--viewport', 'wide'])).toThrow(/WIDTHxHEIGHT/)
    expect(() => parseArgs(['demo', '--settle', 'x'])).toThrow(/milliseconds/)
    expect(() => parseArgs(['demo', '--nope'])).toThrow(/unknown/)
  })

  it('writes predictable per-step paths', () => {
    expect(shotPath('.presentation-inspect', 'demo', 0)).toBe('.presentation-inspect/demo/step-01.png')
    expect(shotPath('out', 'demo', 11)).toBe('out/demo/step-12.png')
  })

  it('exits non-zero with a clear error on script faults (not on warnings)', () => {
    const r = spawnSync(process.execPath, ['scripts/inspect-presentation.mjs'], { encoding: 'utf8' })
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/inspect: ERROR usage/)
  })
})

const r = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })
const item = (name: string, rect: ReturnType<typeof r>, extra = {}) => ({ name, rect, visible: true, allowOverlap: false, ...extra })

describe('overlap diagnostics', () => {
  it('detects intersection but not separation or edge-touching', () => {
    expect(rectsOverlap(r(0, 0, 10, 10), r(5, 5, 10, 10))).toBe(true)
    expect(rectsOverlap(r(0, 0, 10, 10), r(10, 0, 10, 10))).toBe(false)
    expect(rectsOverlap(r(0, 0, 10, 10), r(0, 10, 10, 10))).toBe(false)
    expect(rectsOverlap(r(0, 0, 10, 10), r(20, 20, 5, 5))).toBe(false)
  })

  it('reports unmarked pairs by name, skips invisible ones, and exempts allow-overlap subtrees only', () => {
    const items = [
      item('a', r(0, 0, 50, 20)),
      item('b', r(10, 5, 50, 20)),
      item('hidden', r(0, 0, 50, 20), { visible: false }),
      item('empty', r(0, 0, 0, 0)),
      item('marked1', r(200, 0, 50, 20), { allowOverlap: true }),
      item('marked2', r(210, 5, 50, 20), { allowOverlap: true }),
      item('c', r(400, 0, 50, 20)),
      item('d', r(420, 5, 50, 20)),
    ]
    expect(findOverlaps(items)).toEqual([['a', 'b'], ['c', 'd']])
  })

  it('does not let an exemption mask unrelated collisions', () => {
    const items = [item('x', r(0, 0, 50, 20), { allowOverlap: true }), item('y', r(5, 5, 50, 20), { allowOverlap: true }), item('p', r(300, 0, 50, 20)), item('q', r(310, 0, 50, 20))]
    expect(findOverlaps(items)).toEqual([['p', 'q']])
  })
})

describe('chrome diagnostics', () => {
  const base = { color: 'rgb(1, 1, 1)', backgroundColor: 'rgba(0, 0, 0, 0)', borderTopColor: 'rgb(1, 1, 1)', borderTopWidth: '0px', fontWeight: '400', opacity: '1', textDecorationLine: 'none', outlineStyle: 'none', outlineWidth: '0px', outlineColor: 'rgb(1, 1, 1)', boxShadow: 'none', width: '12px', height: '12px' }

  it('flags an active item identical to an inactive one', () => {
    expect(isIndistinct(base, { ...base })).toBe(true)
  })

  it.each(['color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'fontWeight', 'opacity', 'textDecorationLine', 'outlineStyle', 'outlineWidth', 'outlineColor', 'boxShadow', 'width', 'height'])('treats a different %s as distinct', (k) => {
    expect(isIndistinct({ ...base, [k]: 'changed' }, base)).toBe(false)
  })

  it('flags missing, tiny, and browser-default attribution but not a polished one', () => {
    expect(attributionIssue(null)).toMatch(/missing/)
    expect(attributionIssue({ fontSize: MIN_ATTRIBUTION_PX - 1, color: 'rgb(9, 9, 9)', textDecorationLine: 'none' })).toMatch(/under 12px/)
    expect(attributionIssue({ fontSize: 16, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline' })).toMatch(/browser-default/)
    expect(attributionIssue({ fontSize: 16, color: 'rgb(0, 0, 238)', textDecorationLine: 'none' })).toBeNull()
    expect(attributionIssue({ fontSize: 13, color: 'rgb(199, 167, 85)', textDecorationLine: 'none' })).toBeNull()
  })

  it('aggregates step-specific advisory warnings naming the hook, and none for a clean step', () => {
    const polished = { fontSize: 14, color: 'rgb(9, 9, 9)', textDecorationLine: 'none' }
    const clean = { items: [item('a', r(0, 0, 5, 5))], progress: { active: { ...base, width: '30px' }, inactive: base }, toc: null, attribution: polished }
    expect(warningsFor(2, clean)).toEqual([])
    const dirty = {
      items: [item('a', r(0, 0, 50, 20)), item('b', r(10, 5, 50, 20))],
      progress: { active: base, inactive: base },
      toc: { active: base, inactive: base },
      attribution: { fontSize: 10, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline' },
    }
    const w = warningsFor(4, dirty)
    expect(w).toHaveLength(4)
    expect(w.every((l: string) => l.startsWith('step 4:'))).toBe(true)
    expect(w[0]).toMatch(/overlap between a and b/)
    expect(w.join('\n')).toMatch(/progress indicator is visually indistinct/)
    expect(w.join('\n')).toMatch(/table-of-contents entry is visually indistinct/)
    expect(w.join('\n')).toMatch(/\[data-presentation-attribution\]/)
  })
})
