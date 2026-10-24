import { readFileSync, rmSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, edit, run } from '../helpers/project'

// INT-002: the project-local screenshot helper emits faithful artifacts and advisory warnings.
const SETTLE_MS = 300

const POLISHED_CSS = `
[data-presentation-progress-item] { width: 20px; height: 8px; border: 0; padding: 0; background: #444; }
[data-presentation-progress-item][data-presentation-active='true'] { width: 40px; background: gold; }
[data-presentation-toc-item] { border: 0; background: transparent; color: #888; }
[data-presentation-toc-item][data-presentation-active='true'] { color: #000; font-weight: 700; background: gold; }
[data-presentation-attribution] { font-size: 14px; color: #357; text-decoration: none; padding: 2px 8px; }
[data-presentation-footer], [data-presentation-header] { padding: 8px 16px; }
`

function talk(body: string, css: boolean): string {
  return `import { Label, Presentation, SceneLayer, type SceneProps } from '../../presentation-kit'
${css ? "import './styles.css'" : ''}

interface P { n: number }
function Scene({ payload }: SceneProps<P>) {
  return (
    <SceneLayer>
      <Label id="alpha" x={40} y={40}>Alpha</Label>
      ${body}
    </SceneLayer>
  )
}
const STEPS = [1, 2, 3].map((n) => ({
  id: 's' + n,
  era: n < 3 ? 'first' : 'second',
  title: 'Title ' + n,
  caption: 'Caption ' + n,
  Scene,
  payload: { n },
  groupKey: 'g',
}))
export default function Talk() {
  return <Presentation steps={STEPS} title="fixture" />
}
`
}

const OVERLAP = `<Label id="beta" x={42} y={42}>Beta</Label>`
const FIXTURES: Record<string, { body: string; css: boolean }> = {
  'fx-polished': { body: `{payload.n >= 2 && <Label id="gamma" x={40} y={160}>Gamma</Label>}`, css: true },
  'fx-overlap': { body: `{payload.n === 2 && ${OVERLAP}}`, css: true },
  'fx-allowed': { body: `{payload.n === 2 && <div data-presentation-allow-overlap="">${OVERLAP}</div>}`, css: true },
  'fx-bare': { body: `{payload.n >= 2 && <Label id="gamma" x={40} y={160}>Gamma</Label>}`, css: false },
}

interface Report {
  steps: Array<{ navigatedAt: number; capturedAt: number }>
  warnings: Array<{ type: string; steps: number[] }>
}

describe('INT-002 screenshot helper', () => {
  let dir: string
  const outputs: Record<string, { code: number | null; stdout: string; stderr: string; report: Report; out: string }> = {}

  beforeAll(async () => {
    dir = copyProject()
    let lines = ''
    for (const [slug, { body, css }] of Object.entries(FIXTURES)) {
      const folder = join(dir, 'src/presentations', slug)
      mkdirSync(folder, { recursive: true })
      writeFileSync(join(folder, 'Talk.tsx'), talk(body, css))
      if (css) writeFileSync(join(folder, 'styles.css'), POLISHED_CSS)
      lines += `  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk') },\n`
    }
    edit(dir, 'src/presentations/index.ts', /\n\]/, `\n${lines}]`)
    const build = await run('npm', ['run', 'build'], dir)
    if (build.code !== 0) throw new Error(build.stdout + build.stderr)
    for (const slug of Object.keys(FIXTURES)) {
      const result = await run('npm', ['run', 'inspect', '--', slug, '--skip-build', '--settle', String(SETTLE_MS)], dir)
      const out = join(dir, '.presentation-artifacts', slug)
      outputs[slug] = { ...result, out, report: JSON.parse(readFileSync(join(out, 'report.json'), 'utf8')) }
    }
  })
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('writes one predictable screenshot per step and exits zero', () => {
    for (const [slug, o] of Object.entries(outputs)) {
      expect(o.code, slug + o.stderr).toBe(0)
      for (const n of ['01', '02', '03']) {
        const file = join(o.out, `step-${n}.png`)
        expect(statSync(file).size, file).toBeGreaterThan(1000)
        expect(readFileSync(file).subarray(1, 4).toString()).toBe('PNG')
      }
      expect(o.report.steps).toHaveLength(3)
    }
  })

  it('captures each screenshot only after the settle interval has elapsed', () => {
    for (const o of Object.values(outputs)) {
      for (const step of o.report.steps) {
        expect(step.capturedAt - step.navigatedAt).toBeGreaterThanOrEqual(SETTLE_MS - 5)
      }
      const times = o.report.steps.map((s) => s.navigatedAt)
      expect([...times].sort((a, b) => a - b)).toEqual(times)
    }
  })

  it('warns about an unmarked text collision on the step where it occurs', () => {
    const { stdout, report } = outputs['fx-overlap']
    expect(stdout).toMatch(/WARN \[overlap\] step 2: "Alpha" overlaps "Beta"/)
    expect(report.warnings.filter((w) => w.type === 'overlap')).toEqual([
      expect.objectContaining({ steps: [2] }),
    ])
  })

  it('does not warn about overlap inside an allow-overlap subtree', () => {
    expect(outputs['fx-allowed'].stdout).not.toMatch(/\[overlap\]/)
  })

  it('stays silent for a polished presentation', () => {
    expect(outputs['fx-polished'].stdout).toMatch(/0 advisory warning/)
    expect(outputs['fx-polished'].stdout).not.toMatch(/WARN/)
  })

  it('warns about indistinct active chrome and unpolished attribution', () => {
    const { stdout, code } = outputs['fx-bare']
    expect(code).toBe(0)
    expect(stdout).toMatch(/WARN \[active-chrome\] steps 1, 2, 3: active progress entry looks identical/)
    expect(stdout).toMatch(/WARN \[active-chrome\] steps 1, 2, 3: active table-of-contents entry looks identical/)
    expect(stdout).toMatch(/WARN \[attribution\] steps 1, 2, 3: uses the browser-default link color; style \[data-presentation-attribution\]/)
  })

  it('fails for an unregistered presentation', async () => {
    const result = await run('npm', ['run', 'inspect', '--', 'nope', '--skip-build'], dir)
    expect(result.code).not.toBe(0)
    expect(result.stderr).toMatch(/FAIL \[usage\] "nope" is not registered/)
  })
})
