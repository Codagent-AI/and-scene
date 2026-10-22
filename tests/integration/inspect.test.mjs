// INT-002: the project-local screenshot helper emits faithful artifacts and advisory warnings.
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { repoRoot, run, tempDir } from '../helpers/process.mjs'

const cli = path.join(repoRoot, 'skills', 'presentation', 'scripts', 'cli.mjs')
const SETTLE_MS = 250
const STEPS = 3

// Presentation-owned CSS for the polished baseline: distinct active chrome and a legible attribution.
const talkCss = fs.readFileSync(path.join(repoRoot, 'src/presentations/how-to-make-a-presentation/talk.css'), 'utf8')
const chromeCss = talkCss.slice(0, talkCss.indexOf('/* ---- scene entities ---- */'))
const withoutActive = (css) => css.replace(/\[data-presentation-(progress-dot|toc-entry)\]\[data-presentation-active="true"\] \{[^}]*\}/g, '')
const withoutAttribution = (css) => css.replace(/\[data-presentation-attribution\][^{]*\{[^}]*\}/g, '')
const smallAttribution = (css) => css.replace(/(\[data-presentation-attribution\] \{[^}]*)font-size: 12px/, '$1font-size: 9px')

/** slug -> { css, layouts per step, attribution } */
const VARIANTS = {
  clean: { css: chromeCss, layouts: ['plain', 'plain', 'plain'] },
  collision: { css: chromeCss, layouts: ['plain', 'collide', 'plain'] },
  allowed: { css: chromeCss, layouts: ['plain', 'allowed', 'collide'] },
  indistinct: { css: withoutActive(chromeCss), layouts: ['plain', 'plain', 'plain'] },
  'attr-small': { css: smallAttribution(chromeCss), layouts: ['plain', 'plain', 'plain'] },
  'attr-default': { css: withoutAttribution(chromeCss), layouts: ['plain', 'plain', 'plain'] },
  'attr-missing': { css: chromeCss, layouts: ['plain', 'plain', 'plain'], attribution: false },
}

const sceneSource = `import { Appear, Label, SceneLayer } from '../../presentation-kit/index.ts'
import type { SceneProps } from '../../presentation-kit/index.ts'

export interface Payload {
  layout: 'plain' | 'collide' | 'allowed'
}

export function Scene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Appear key="a" delay={0}>
        <Label id="a" x={40} y={40} w={200} h={24}>First label</Label>
      </Appear>
      {payload.layout === 'collide' ? (
        <Appear key="b" delay={0}>
          <Label id="b" x={60} y={46} w={200} h={24}>Second label</Label>
        </Appear>
      ) : null}
      {payload.layout === 'allowed' ? (
        <Appear key="c" delay={0}>
          <div data-presentation-allow-overlap="">
            <Label id="c" x={60} y={46} w={200} h={24}>Stacked label</Label>
          </div>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}
`

const talkSource = (slug, layouts, attribution) => `import { Presentation } from '../../presentation-kit/index.ts'
import type { Step } from '../../presentation-kit/index.ts'
import { Scene } from './Scene.tsx'
import type { Payload } from './Scene.tsx'
import './style.css'

const LAYOUTS: Payload['layout'][] = ${JSON.stringify(layouts)}
const STEPS: Step<Payload>[] = LAYOUTS.map((layout, i) => ({
  id: 'step-' + i,
  era: i === 0 ? 'first' : 'second',
  title: 'Step ' + i,
  caption: 'Caption for step ' + i,
  Scene,
  groupKey: 'scene',
  payload: { layout },
}))

export default function Talk() {
  return <Presentation steps={STEPS} title="${slug}" initialMode="browse" attribution={${attribution}} />
}
`

let work
let app
const results = {}

const inspect = (slug, extra = []) =>
  run('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle-ms', String(SETTLE_MS), '--out', 'shots', ...extra], { cwd: app })
const warnings = (out) => out.split('\n').filter((l) => l.startsWith('WARN '))

beforeAll(() => {
  work = tempDir('int-002')
  app = path.join(work, 'app')
  const scaffold = run('node', [cli, 'scaffold', '--project', app], { cwd: work })
  expect(scaffold.status, scaffold.out).toBe(0)
  fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(app, 'node_modules'), 'dir')
  for (const [slug, variant] of Object.entries(VARIANTS)) {
    const created = run('node', [cli, 'create', '--project', app, '--slug', slug, '--title', slug], { cwd: work })
    expect(created.status, created.out).toBe(0)
    const dir = path.join(app, 'src', 'presentations', slug)
    fs.rmSync(path.join(dir, 'steps'), { recursive: true })
    fs.rmSync(path.join(dir, 'entities.ts'))
    fs.rmSync(path.join(dir, `${slug}.css`))
    fs.writeFileSync(path.join(dir, 'Scene.tsx'), sceneSource)
    fs.writeFileSync(path.join(dir, 'Talk.tsx'), talkSource(slug, variant.layouts, variant.attribution ?? true))
    fs.writeFileSync(path.join(dir, 'style.css'), variant.css)
  }
  const build = run('npm', ['run', 'build'], { cwd: app })
  expect(build.status, build.out).toBe(0)
  for (const slug of Object.keys(VARIANTS)) {
    const started = Date.now()
    results[slug] = { ...inspect(slug), elapsed: Date.now() - started }
  }
})

afterAll(() => fs.rmSync(work, { recursive: true, force: true }))

describe('INT-002 screenshot helper', () => {
  it('writes one predictable screenshot per step under <out>/<slug>/ and exits zero', () => {
    for (const slug of Object.keys(VARIANTS)) {
      expect(results[slug].status, `${slug}\n${results[slug].out}`).toBe(0)
      const dir = path.join(app, 'shots', slug)
      expect(fs.readdirSync(dir).sort()).toEqual(['step-00.png', 'step-01.png', 'step-02.png'])
      for (const file of fs.readdirSync(dir)) {
        const png = fs.readFileSync(path.join(dir, file))
        expect(png.subarray(1, 4).toString(), file).toBe('PNG')
      }
    }
    expect(results.clean.out).toMatch(new RegExp(`inspect: wrote ${STEPS} screenshots`))
  })

  it('uses a standard desktop viewport by default and honours an override', () => {
    expect(results.clean.out).toMatch(/1440x900/)
    const narrow = inspect('clean', ['--viewport', '390x844'])
    expect(narrow.status, narrow.out).toBe(0)
    expect(narrow.out).toMatch(/390x844/)
  })

  it('waits out the settle interval before each capture, including the first step', () => {
    expect(results.clean.elapsed).toBeGreaterThanOrEqual(STEPS * SETTLE_MS)
  })

  it('stays quiet for a polished presentation', () => {
    expect(warnings(results.clean.out)).toEqual([])
  })

  it('warns about an unmarked text collision, naming the step and both elements', () => {
    const lines = warnings(results.collision.out).filter((l) => / overlap:/.test(l))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^WARN step 1 overlap:/)
    expect(lines[0]).toContain('First label')
    expect(lines[0]).toContain('Second label')
  })

  it('does not warn about an allowed overlap but still warns about an unmarked one', () => {
    const lines = warnings(results.allowed.out).filter((l) => / overlap:/.test(l))
    expect(lines.some((l) => l.startsWith('WARN step 1 '))).toBe(false)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^WARN step 2 overlap:.*First label.*Second label|^WARN step 2 overlap:.*First label.*Stacked label/)
  })

  it('warns when active progress and table-of-contents chrome look like inactive chrome, per step', () => {
    const lines = warnings(results.indistinct.out).filter((l) => / active-chrome:/.test(l))
    for (const step of [0, 1, 2]) {
      expect(lines.some((l) => l.startsWith(`WARN step ${step} `) && l.includes('progress indicator'))).toBe(true)
    }
    expect(lines.some((l) => l.includes('table-of-contents entry'))).toBe(true)
  })

  it('does not report active chrome that is visibly distinct', () => {
    expect(warnings(results.clean.out).filter((l) => / active-chrome:/.test(l))).toEqual([])
  })

  it.each([
    ['attr-small', /under 11px/],
    ['attr-default', /browser-default/],
    ['attr-missing', /no \[data-presentation-attribution\]/],
  ])('warns about %s attribution at every step and points to the styling hook', (slug, text) => {
    const lines = warnings(results[slug].out).filter((l) => / attribution:/.test(l))
    expect(lines).toHaveLength(STEPS)
    lines.forEach((line, i) => {
      expect(line).toMatch(new RegExp(`^WARN step ${i} attribution:`))
      expect(line).toMatch(text)
      expect(line).toContain('data-presentation-attribution')
    })
  })

  it('keeps every warning advisory: full capture set and exit zero', () => {
    for (const slug of ['collision', 'allowed', 'indistinct', 'attr-small', 'attr-default', 'attr-missing']) {
      expect(results[slug].status).toBe(0)
      expect(warnings(results[slug].out).length, slug).toBeGreaterThan(0)
      expect(fs.readdirSync(path.join(app, 'shots', slug))).toHaveLength(STEPS)
    }
  })

  it('still fails (non-zero) on a genuine error such as an unknown presentation', () => {
    const missing = inspect('does-not-exist')
    expect(missing.status).not.toBe(0)
    expect(missing.out).toMatch(/inspect failed/)
  })
})
