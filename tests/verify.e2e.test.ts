import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { REPO, copyRepo, node } from './helpers'

const edit = (dir: string, rel: string, fn: (s: string) => string) => {
  const f = path.join(dir, rel)
  const before = fs.readFileSync(f, 'utf8')
  const after = fn(before)
  expect(after, `${rel} fault was applied`).not.toBe(before)
  fs.writeFileSync(f, after)
}
const SAMPLE = 'src/presentations/how-to-make-a-presentation'

const faults: { name: string; apply: (dir: string) => void; expect: RegExp }[] = [
  {
    name: 'build failure',
    apply: (d) => edit(d, `${SAMPLE}/Talk.tsx`, (s) => `${s}\nexport const broken: number = 'text'\n`),
    expect: /VERIFY FAILED phase=build/,
  },
  {
    name: 'sample unregistered',
    apply: (d) =>
      edit(d, 'src/presentations/index.ts', (s) => s.replace(/\s*\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '\n')),
    expect: /VERIFY FAILED phase=sample.*not registered/,
  },
  {
    name: 'sample entry without a loader of its own, followed by another entry that has one',
    apply: (d) =>
      edit(d, 'src/presentations/index.ts', (s) =>
        s
          .replace("load: () => import('./how-to-make-a-presentation/Talk'),", 'load: loader,')
          .replace('export const presentations', "const loader = () => import('./how-to-make-a-presentation/Talk')\nexport const presentations")
          .replace(/\n\]\s*$/, "\n  { slug: 'decoy', title: 'Decoy', load: () => import('./how-to-make-a-presentation/Talk') },\n]\n"),
      ),
    expect: /VERIFY FAILED phase=sample.*"how-to-make-a-presentation" is not registered/,
  },
  {
    name: 'canonical sample replaced by another reference and configuration',
    apply: (d) => {
      const tpl = path.join(d, 'skills/presentation/templates/bootstrap')
      fs.cpSync(path.join(tpl, 'src/presentations/example'), path.join(d, 'src/presentations/example'), { recursive: true })
      fs.copyFileSync(path.join(tpl, 'verify.config.json'), path.join(d, 'verify.config.json'))
      fs.rmSync(path.join(d, SAMPLE), { recursive: true })
      fs.rmSync(path.join(d, 'tests'), { recursive: true }) // the repo tests import the sample
      fs.writeFileSync(
        path.join(d, 'src/presentations/index.ts'),
        fs.readFileSync(path.join(tpl, 'src/presentations/index.ts'), 'utf8'),
      )
    },
    expect: /VERIFY FAILED phase=sample.*how-to-make-a-presentation/,
  },
  {
    name: 'steps out of order',
    apply: (d) =>
      edit(d, `${SAMPLE}/steps/index.ts`, (s) =>
        s.replace("'You have a topic'", "'TMP'").replace("'The skill interviews you'", "'You have a topic'").replace("'TMP'", "'The skill interviews you'"),
      ),
    expect: /VERIFY FAILED phase=sample step=0/,
  },
  {
    name: 'console error at a step',
    apply: (d) =>
      edit(d, `${SAMPLE}/steps/Scene.tsx`, (s) =>
        s.replace('const { n } = payload', "const { n } = payload\n  if (n === 3) console.error('boom at step 3')"),
      ),
    expect: /VERIFY FAILED phase=render step=2: console.error: boom at step 3/,
  },
  {
    name: 'transition that does not advance',
    apply: (d) =>
      edit(d, 'src/presentation-kit/usePresentationNav.ts', (s) =>
        s.replace('setIndex((i) => clamp(i + 1, count))', 'setIndex((i) => Math.min(i + 1, 1))'),
      ),
    expect: /VERIFY FAILED phase=transition step=2/,
  },
]

// E2E-002: verification failures are actionable, each in an independent throwaway copy.
describe('E2E-002 verification failures', () => {
  it.each(faults)('fails on $name', ({ apply, expect: re }) => {
    const dir = copyRepo()
    apply(dir)
    const r = node(dir, ['scripts/verify.mjs'])
    expect(r.code).not.toBe(0)
    expect(r.out).toMatch(re)
    expect(r.out).not.toContain('VERIFY PASSED')
    const left = spawnSync('pgrep', ['-f', path.join(dir, 'node_modules/.bin/vite')], { encoding: 'utf8' })
    expect(left.stdout.trim(), 'preview process cleaned up').toBe('')
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('passes on an unmodified copy (E2E-001 path) using 127.0.0.1', () => {
    const dir = copyRepo()
    const r = node(dir, ['scripts/verify.mjs'])
    expect(r.code, r.out).toBe(0)
    expect(r.out).toContain('VERIFY PASSED')
    expect(r.out).toContain('9 steps rendered without errors on 127.0.0.1')
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('cleans up the preview when the browser cannot launch', () => {
    const dir = copyRepo()
    const r = node(dir, ['scripts/verify.mjs'], { PLAYWRIGHT_BROWSERS_PATH: '/nonexistent-browsers' })
    expect(r.code).not.toBe(0)
    expect(r.out).toMatch(/VERIFY FAILED phase=render.*browser launch failed/)
    const left = spawnSync('pgrep', ['-f', path.join(dir, 'node_modules/.bin/vite')], { encoding: 'utf8' })
    expect(left.stdout.trim()).toBe('')
    const i = node(dir, ['scripts/inspect-presentation.mjs', 'how-to-make-a-presentation', '--no-build'], { PLAYWRIGHT_BROWSERS_PATH: '/nonexistent-browsers' })
    expect(i.code).not.toBe(0)
    expect(spawnSync('pgrep', ['-f', path.join(dir, 'node_modules/.bin/vite')], { encoding: 'utf8' }).stdout.trim()).toBe('')
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('verifies a project whose kit and registry were renamed, using a presentation made by create.mjs', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-renamed-'))
    const scripts = path.join(REPO, 'skills/presentation/scripts')
    expect(node(os.tmpdir(), [path.join(scripts, 'scaffold.mjs'), dir]).code).toBe(0)
    fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'))
    fs.renameSync(path.join(dir, 'src/presentation-kit'), path.join(dir, 'src/scene-kit'))
    fs.renameSync(path.join(dir, 'src/presentations'), path.join(dir, 'src/talks'))
    fs.renameSync(path.join(dir, 'src/talks/index.ts'), path.join(dir, 'src/talks/registry.ts'))
    for (const rel of ['src/Router.tsx', 'src/Landing.tsx', 'src/route.ts', 'src/talks/example/Talk.tsx', 'src/talks/example/steps/Scene.tsx', 'src/talks/example/steps/index.ts']) {
      edit(dir, rel, (s) => s.replaceAll("presentation-kit'", "scene-kit'").replace(/(['"])\.\/presentations\1/g, "'./talks/registry'"))
    }
    const made = node(dir, [path.join(scripts, 'create.mjs'), dir, 'round-one', 'Round One'])
    expect(made.code, made.out).toBe(0)
    fs.writeFileSync(
      path.join(dir, 'verify.config.json'),
      JSON.stringify({ reference: { slug: 'round-one', steps: [
        { title: 'Round One', caption: 'Replace this caption with the first beat of the story.' },
        { title: 'A second beat', caption: 'Entities from the previous step stay put; new ones enter after they settle.' },
      ] } }),
    )
    const v = node(dir, ['scripts/verify.mjs'])
    expect(v.code, v.out).toBe(0)
    expect(v.out).toContain('VERIFY PASSED')
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('keeps a scaffolded presentation reachable in an existing app with its own entry point', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-partial-'))
    const skill = path.join(REPO, 'skills/presentation/scripts/scaffold.mjs')
    expect(node(os.tmpdir(), [skill, dir, '--anchors', 'build']).code).toBe(0)
    fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'))
    fs.mkdirSync(path.join(dir, 'src'))
    const ownMain = "document.getElementById('root')!.textContent = 'existing app'\n"
    fs.writeFileSync(path.join(dir, 'src/main.tsx'), ownMain)
    const r = node(os.tmpdir(), [skill, dir, '--anchors', 'kit,index'])
    expect(r.code, r.out).toBe(0)
    expect(fs.readFileSync(path.join(dir, 'src/app-main.tsx'), 'utf8')).toBe(ownMain)
    const v = node(dir, ['scripts/verify.mjs'])
    expect(v.code, v.out).toBe(0)
    expect(v.out).toContain('VERIFY PASSED')
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('uses only the IPv4 loopback address for preview and browser URLs', () => {
    const lib = fs.readFileSync(path.join(__dirname, '../scripts/lib.mjs'), 'utf8')
    expect(lib).toContain("HOST = '127.0.0.1'")
    for (const f of ['lib.mjs', 'verify.mjs', 'inspect-presentation.mjs']) {
      expect(fs.readFileSync(path.join(__dirname, '../scripts', f), 'utf8')).not.toContain('localhost')
    }
  })
})
