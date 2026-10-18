import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, processesIn, removeDir, run } from './helpers.mjs'

// INT-002: the screenshot helper against a controlled project with known visual defects.

const scene = (name, body) => `import { Label, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'

export function ${name}({ payload }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      ${body}
    </SceneLayer>
  )
}
`

const COLLIDE = scene(
  'CollideScene',
  `{payload.n === 2 ? (
        <div key="allowed" data-presentation-allow-overlap="" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
          <Label id="low" at={{ x: 100, y: 100, w: 200, h: 30 }}>Allowed back</Label>
          <Label id="high" at={{ x: 110, y: 105, w: 200, h: 30 }}>Allowed front</Label>
        </div>
      ) : payload.n === 4 ? (
        <Label key="parent" id="parent" at={{ x: 100, y: 100, w: 300, h: 30 }}>
          Parent text
          <span style={{ position: 'absolute', left: 0, top: 4 }}>Child text</span>
        </Label>
      ) : (
        [
          <Label key="a" id={\`alpha-\${payload.n}\`} at={{ x: 100, y: 100, w: 200, h: 30 }}>Collision one</Label>,
          <Label key="b" id={\`beta-\${payload.n}\`} at={{ x: 120, y: 104, w: 200, h: 30 }}>Collision two</Label>,
        ]
      )}`,
)

const CLEAN = scene(
  'CleanScene',
  `<Label key="solo" id="solo" at={{ x: 100, y: 100, w: 300, h: 30 }}>Step {payload.n}</Label>`,
)

const talk = (scenes, steps, title) => `import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'
import { ${scenes} } from './Scene'
${title === 'styled' ? "import './styles.css'\n" : ''}
const STEPS: Step<{ n: number }>[] = [1, 2, 3, 4].slice(0, ${steps}).map((n) => ({
  id: \`s\${n}\`,
  era: n < 3 ? 'first' : 'second',
  title: \`Step \${n}\`,
  caption: \`Caption \${n}\`,
  groupKey: 'g',
  Scene: ${scenes},
  payload: { n },
}))

export default function Talk() {
  return <Presentation steps={STEPS} title="${title}" initialMode="browse" />
}
`

const STYLED_CSS = `[data-presentation-progress-dot] { width: 12px; height: 12px; background: #ccc; }
[data-presentation-progress-dot][data-presentation-active] { background: #c00; }
[data-presentation-toc-entry][data-presentation-active] { font-weight: 700; background: #eee; }
[data-presentation-attribution] { font-size: 14px; font-family: monospace; color: #444; }
`

function install(dir) {
  const base = path.join(dir, 'src/presentations')
  const write = (slug, files) => {
    mkdirSync(path.join(base, slug), { recursive: true })
    for (const [name, content] of Object.entries(files)) writeFileSync(path.join(base, slug, name), content)
  }
  write('inspect-collide', { 'Scene.tsx': COLLIDE, 'Talk.tsx': talk('CollideScene', 4, 'collide') })
  write('inspect-styled', { 'Scene.tsx': CLEAN, 'Talk.tsx': talk('CleanScene', 2, 'styled'), 'styles.css': STYLED_CSS })
  const index = path.join(base, 'index.ts')
  writeFileSync(
    index,
    readFileSync(index, 'utf8').replace(
      /\n\]/,
      `\n  { slug: 'inspect-collide', title: 'Collide', load: () => import('./inspect-collide/Talk') },\n  { slug: 'inspect-styled', title: 'Styled', load: () => import('./inspect-styled/Talk') },\n]`,
    ),
  )
}

const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const png = (file) => {
  const bytes = readFileSync(file)
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

let dir
let collide
let styled
let fast
let slow
let unknown

beforeAll(async () => {
  dir = copyProject('inspect')
  install(dir)
  const inspect = (...args) => run('npm', ['run', 'inspect', '--', ...args], { cwd: dir })
  collide = await inspect('inspect-collide')
  const timed = async (settle) => {
    const started = Date.now()
    await inspect('inspect-collide', '--settle', String(settle), '--skip-build')
    return Date.now() - started
  }
  fast = await timed(0)
  slow = await timed(2000)
  styled = await inspect('inspect-styled', '--skip-build')
  unknown = await inspect('no-such-presentation', '--settle', '0', '--skip-build')
})

afterAll(() => removeDir(dir))

const warningsFor = (output, step) => output.split('\n').filter((line) => line.startsWith(`warning: step ${step}:`))

describe('INT-002: screenshot helper', () => {
  it('writes one predictable 1440x900 screenshot per step, each a distinct state', () => {
    expect(collide.code, collide.output).toBe(0)
    const files = [1, 2, 3, 4].map((n) => path.join(dir, `.inspection/inspect-collide/step-0${n}.png`))
    files.forEach((file) => {
      expect(existsSync(file), file).toBe(true)
      expect(png(file)).toEqual({ width: 1440, height: 900 })
    })
    expect(new Set(files.map(sha)).size).toBe(4)
    expect(collide.output.match(/^captured step /gm)).toHaveLength(4)
    expect(existsSync(path.join(dir, '.inspection/inspect-collide/step-05.png'))).toBe(false)
  })

  it('waits for the settle interval before each capture', () => {
    // Four captures at 2000ms vs 0ms: allow slack for timer jitter.
    expect(slow - fast).toBeGreaterThan(4 * 1800)
  })

  it('warns, with the step and both elements, about each unmarked collision', () => {
    const one = warningsFor(collide.output, 1).filter((l) => /overlaps/.test(l))
    expect(one).toHaveLength(1)
    expect(one[0]).toMatch(/alpha-1.*Collision one.*overlaps.*beta-1.*Collision two/)
    const three = warningsFor(collide.output, 3).filter((l) => /overlaps/.test(l))
    expect(three).toHaveLength(1)
    expect(three[0]).toMatch(/alpha-3.*beta-3/)
  })

  it('warns when a child element text collides with its parent text', () => {
    const lines = warningsFor(collide.output, 4).filter((l) => /overlaps/.test(l))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/Parent text.*overlaps.*Child text|Child text.*overlaps.*Parent text/)
  })

  it('stays quiet about the explicitly allowed overlap', () => {
    expect(warningsFor(collide.output, 2).filter((l) => /overlaps/.test(l))).toEqual([])
    expect(collide.output).not.toMatch(/Allowed (back|front).*overlaps/)
  })

  it('warns about indistinct active chrome and unpolished attribution on every step', () => {
    for (const step of [1, 2, 3, 4]) {
      const lines = warningsFor(collide.output, step)
      expect(lines.some((l) => /active progress indicator looks the same/.test(l)), `step ${step} progress`).toBe(true)
      expect(lines.some((l) => /active table-of-contents entry looks the same/.test(l)), `step ${step} toc`).toBe(true)
      expect(lines.some((l) => /attribution still uses the browser-default.*data-presentation-attribution/.test(l)), `step ${step} attribution`).toBe(true)
    }
  })

  it('does not warn about locally styled chrome', () => {
    expect(styled.code, styled.output).toBe(0)
    expect(styled.output).not.toMatch(/^warning:/m)
    expect(styled.output).toMatch(/inspect: 0 advisory warning\(s\)/)
    expect(existsSync(path.join(dir, '.inspection/inspect-styled/step-02.png'))).toBe(true)
  })

  it('treats warnings as advisory and fails only when capture cannot happen', () => {
    expect(collide.output).toMatch(/inspect: \d+ advisory warning\(s\)/)
    expect(collide.code).toBe(0)
    expect(unknown.code).toBe(1)
    expect(unknown.output).toMatch(/^error:/m)
    expect(processesIn(dir)).toEqual([])
  })
})
