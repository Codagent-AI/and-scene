import { cpSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium } from 'playwright'
import { diagnose } from '../../scripts/inspect-presentation.mjs'
import { bootstrapTemplate, cleanupTemp, repoRoot, run, tempDir } from './helpers'

afterAll(cleanupTemp)

const SETTLE = 900

const scene = (extra: string) => `
import { Appear, Box, Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './fixture.css'
function S({ payload }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      <Appear key="a"><Box id="a" at={{ x: 100, y: 100, w: 220, h: 60 }}>alpha text</Box></Appear>
      {payload.n >= 2 && ${extra}}
    </SceneLayer>
  )
}
const steps: Step<{ n: number }>[] = [1, 2, 3].map((n) => ({ id: 's' + n, era: n < 3 ? 'one' : 'two', title: 'Step ' + n, caption: 'Caption ' + n, groupKey: 'g', Scene: S, payload: { n } }))
export default function Talk() { return <Presentation className="fx" steps={steps} title="Fixture" /> }
`
const overlapping = `<Appear key="b"><Label id="b" at={{ x: 104, y: 104, w: 200, h: 40 }}>bravo text</Label></Appear>`
const separate = `<Appear key="b"><Label id="b" at={{ x: 500, y: 250, w: 200, h: 40 }}>bravo text</Label></Appear>`
const allowed = `<Appear key="b"><div data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}><Label id="b" at={{ x: 104, y: 104, w: 200, h: 40 }}>bravo text</Label></div></Appear>`

const POLISHED_CSS = `
.fx [data-presentation-dot] { width: 10px; height: 10px; border-radius: 50%; background: #444; border: 1px solid #888; padding: 0; }
.fx [data-presentation-dot][data-presentation-active="true"] { width: 24px; background: #e6c76a; }
.fx [data-presentation-toc-entry][data-presentation-active="true"] { background: #e6c76a; color: #111; font-weight: 700; }
.fx [data-presentation-attribution] { font-size: 14px; color: #e6c76a; }
.fx { color: #eee; background: #111; }
`

const fixtures: Record<string, { body: string; css: string }> = {
  collision: { body: scene(overlapping), css: POLISHED_CSS },
  allowed: { body: scene(allowed), css: POLISHED_CSS },
  plain: { body: scene(separate), css: '' },
  polished: { body: scene(separate), css: POLISHED_CSS },
}

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  const project = tempDir('inspect')

  beforeAll(() => {
    cpSync(bootstrapTemplate, project, { recursive: true })
    symlinkSync(path.join(repoRoot, 'node_modules'), path.join(project, 'node_modules'), 'dir')
    const registry = Object.keys(fixtures)
      .map((slug) => `  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk') },`)
      .join('\n')
    for (const [slug, { body, css }] of Object.entries(fixtures)) {
      const dir = path.join(project, 'src/presentations', slug)
      mkdirSync(dir, { recursive: true })
      writeFileSync(path.join(dir, 'Talk.tsx'), body)
      writeFileSync(path.join(dir, 'fixture.css'), css)
    }
    const index = path.join(project, 'src/presentations/index.ts')
    writeFileSync(index, readFileSync(index, 'utf8').replace(/\n\]/, `\n${registry}\n]`))
    const build = run('npm', ['run', 'build'], { cwd: project })
    expect(build.status, build.output).toBe(0)
  })

  const inspect = (slug: string) => {
    const res = run('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle', String(SETTLE)], { cwd: project })
    expect(res.status, res.output).toBe(0)
    const report = JSON.parse(readFileSync(path.join(project, '.inspect', slug, 'report.json'), 'utf8'))
    return { res, report, warnings: report.warnings as string[] }
  }

  it('writes one predictable screenshot per step, captured only after the settle interval', () => {
    const { report } = inspect('polished')
    expect(report.captures).toHaveLength(3)
    for (const [i, c] of report.captures.entries()) {
      const file = path.join(project, '.inspect/polished', `step-0${i + 1}.png`)
      expect(existsSync(file)).toBe(true)
      expect(c.file).toBe(path.relative(project, file))
      expect(c.settleMs).toBeGreaterThanOrEqual(SETTLE)
    }
  })

  it('reports an unmarked collision for the exact step and elements', () => {
    const { warnings } = inspect('collision')
    const overlap = warnings.filter((w) => w.includes('[overlap]'))
    expect(overlap.length).toBeGreaterThan(0)
    expect(overlap.every((w) => /step [23] /.test(w))).toBe(true)
    expect(overlap.some((w) => w.includes('step 2') && w.includes('"a"') && w.includes('"b"'))).toBe(true)
    expect(warnings.some((w) => w.startsWith('WARN step 1 ') && w.includes('[overlap]'))).toBe(false)
  })

  it('does not report overlap inside an explicit allow-overlap subtree', () => {
    const { warnings } = inspect('allowed')
    expect(warnings.filter((w) => w.includes('[overlap]'))).toEqual([])
  })

  it('reports indistinct active navigation and unpolished attribution, naming the styling hook', () => {
    const { warnings } = inspect('plain')
    expect(warnings.some((w) => w.includes('[active-chrome]') && w.includes('progress indicator'))).toBe(true)
    expect(warnings.some((w) => w.includes('[active-chrome]') && w.includes('table-of-contents'))).toBe(true)
    expect(warnings.some((w) => w.includes('[attribution]') && w.includes('[data-presentation-attribution]'))).toBe(true)
    expect(warnings.some((w) => w.startsWith('WARN step 3 ') && w.includes('[attribution]'))).toBe(true)
  })

  it('stays quiet for a polished presentation and never fails the command on warnings', () => {
    const { warnings } = inspect('polished')
    expect(warnings).toEqual([])
  })
})

describe('INT-002: diagnostics edge cases', () => {
  const html = (body: string, css = '') => `<style>${css}</style><body>${body}</body>`
  const findings = async (content: string) => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] })
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
      await page.setContent(content)
      return (await page.evaluate(diagnose)) as { kind: string; message: string }[]
    } finally {
      await browser.close()
    }
  }
  const dots = (activeIndex: number, n = 5) =>
    `<footer data-presentation-footer><nav>${Array.from({ length: n }, (_, i) => `<button data-presentation-dot data-presentation-active="${i === activeIndex}"></button>`).join('')}</nav></footer>
     <a data-presentation-attribution style="font-size:14px;color:#222">made</a>`

  it('warns when the active indicator matches any inactive one, even if another inactive differs', async () => {
    const css = '[data-presentation-dot]:nth-child(4){background:red;width:30px}'
    const f = await findings(html(dots(0), css))
    expect(f.some((x) => x.kind === 'active-chrome')).toBe(true)
  })

  it('does not warn when the active indicator is distinct from all inactive ones', async () => {
    const css = '[data-presentation-dot][data-presentation-active="true"]{background:gold;width:30px}'
    const f = await findings(html(dots(0), css))
    expect(f.filter((x) => x.kind === 'active-chrome')).toEqual([])
  })

  it('exempts overlapping chrome inside an allow-overlap subtree but not outside it', async () => {
    const overlap = (marked: boolean) =>
      `<header data-presentation-header ${marked ? 'data-presentation-allow-overlap' : ''}>
         <button style="position:absolute;left:10px;top:10px;width:100px;height:30px">one</button>
         <button style="position:absolute;left:20px;top:15px;width:100px;height:30px">two</button>
       </header>`
    expect((await findings(html(overlap(false)))).some((x) => x.kind === 'overlap')).toBe(true)
    expect((await findings(html(overlap(true)))).filter((x) => x.kind === 'overlap')).toEqual([])
  })
})
