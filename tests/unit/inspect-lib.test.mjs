// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULTS, captureSteps, parseInspectArgs, parseViewport, screenshotPath } from '../../scripts/lib/inspect.mjs'
import { HOST, urlFor } from '../../scripts/lib/preview.mjs'

const root = path.resolve(import.meta.dirname, '..', '..')

describe('parseInspectArgs', () => {
  it('uses the ruled defaults', () => {
    expect(parseInspectArgs(['demo'])).toEqual({
      slug: 'demo',
      out: 'inspection',
      viewport: { width: 1440, height: 900 },
      settleMs: 1200,
      build: true,
    })
    expect(DEFAULTS).toEqual({ out: 'inspection', viewport: '1440x900', settleMs: 1200 })
  })

  it('accepts output, viewport, settle and no-build overrides', () => {
    expect(parseInspectArgs(['demo', '--out', 'shots', '--viewport', '390x844', '--settle-ms', '50', '--no-build'])).toEqual({
      slug: 'demo',
      out: 'shots',
      viewport: { width: 390, height: 844 },
      settleMs: 50,
      build: false,
    })
  })

  it('rejects a missing slug and malformed values without starting a browser', () => {
    expect(() => parseInspectArgs([])).toThrow(/usage/)
    expect(() => parseInspectArgs(['demo', '--viewport', 'wide'])).toThrow(/invalid --viewport/)
    expect(() => parseInspectArgs(['demo', '--settle-ms', 'soon'])).toThrow(/invalid --settle-ms/)
    expect(() => parseViewport('10x')).toThrow()
  })

  it('writes one predictable file per step under <out>/<slug>/', () => {
    expect(screenshotPath('inspection', 'demo', 3)).toBe(path.join('inspection', 'demo', 'step-03.png'))
  })
})

describe('captureSteps', () => {
  function run(count, settleMs = 1200) {
    const log = []
    let now = 0
    const warnings = []
    return captureSteps({
      count,
      settleMs,
      advance: async () => log.push('advance'),
      waitForStep: async (i) => log.push(`active:${i}`),
      sleep: async (ms) => {
        now += ms
        log.push(`sleep:${ms}@${now}`)
      },
      screenshot: async (i) => {
        log.push(`shot:${i}@${now}`)
        return `step-${i}`
      },
      collect: async () => ({ elements: [], activeChrome: [], attribution: null }),
      warn: (line) => warnings.push(line),
    }).then((written) => ({ written, log, warnings }))
  }

  it('captures the first step and every later step only after the settle interval', async () => {
    const { log, written } = await run(3, 500)
    expect(written).toEqual(['step-0', 'step-1', 'step-2'])
    expect(log).toEqual([
      'sleep:500@500',
      'shot:0@500',
      'advance',
      'active:1',
      'sleep:500@1000',
      'shot:1@1000',
      'advance',
      'active:2',
      'sleep:500@1500',
      'shot:2@1500',
    ])
  })

  it('emits warnings per step without failing the run', async () => {
    const { warnings, written } = await run(2)
    expect(written).toHaveLength(2)
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toMatch(/^WARN step 0 attribution/)
    expect(warnings[1]).toMatch(/^WARN step 1 attribution/)
  })
})

describe('IPv4 loopback', () => {
  it('builds every URL from one 127.0.0.1 constant', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(urlFor(4173, '/demo')).toBe('http://127.0.0.1:4173/demo')
  })

  it('never mentions localhost in verification or inspection code', () => {
    const files = ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', ...fs.readdirSync(path.join(root, 'scripts/lib')).map((f) => `scripts/lib/${f}`)]
    for (const file of files) expect(fs.readFileSync(path.join(root, file), 'utf8'), file).not.toMatch(/localhost|\[::1\]/)
  })
})

describe('script wiring', () => {
  const verify = fs.readFileSync(path.join(root, 'scripts/verify.mjs'), 'utf8')
  const inspect = fs.readFileSync(path.join(root, 'scripts/inspect-presentation.mjs'), 'utf8')

  it('verify runs the real outline validators, the build, and always stops the preview', () => {
    expect(verify).toMatch(/import \{[^}]*compareOutline[^}]*checkSampleRegistration[^}]*\} from '\.\/lib\/outline\.mjs'|import \{[^}]*checkSampleRegistration[^}]*compareOutline[^}]*\} from '\.\/lib\/outline\.mjs'/)
    expect(verify).toMatch(/compareOutline\(narration\)/)
    expect(verify).toMatch(/buildApp\(root\)/)
    expect(fs.readFileSync(path.join(root, 'scripts/lib/build.mjs'), 'utf8')).toMatch(/\['run', 'build'\]/)
    expect(verify).toMatch(/finally \{[^}]*preview\?\.stop\(\)/s)
    expect(verify).toMatch(/process\.exit\(1\)/)
  })

  it('verify attaches console and page error listeners before navigating', () => {
    expect(verify.indexOf("page.on('console'")).toBeGreaterThan(-1)
    expect(verify.indexOf("page.on('pageerror'")).toBeGreaterThan(-1)
    expect(verify.indexOf("page.on('console'")).toBeLessThan(verify.indexOf('page.goto'))
    expect(verify.indexOf("page.on('pageerror'")).toBeLessThan(verify.indexOf('page.goto'))
  })

  it('inspection warnings never set a failing status and capture goes through captureSteps', () => {
    expect(inspect).toMatch(/captureSteps\(/)
    expect(inspect).toMatch(/warn: \(line\) => console\.log\(line\)/)
    expect(inspect.match(/process\.exit\(/g)).toHaveLength(1)
    expect(inspect).toMatch(/inspect failed[\s\S]*process\.exit\(1\)/)
  })

  it('gitignores the screenshot directory', () => {
    expect(fs.readFileSync(path.join(root, '.gitignore'), 'utf8')).toMatch(/^inspection$/m)
  })
})
