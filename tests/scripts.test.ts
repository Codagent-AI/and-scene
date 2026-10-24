import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateReference, phaseFailure } from '../scripts/verify.mjs'
import { parseOptions } from '../scripts/browser-runtime.mjs'
import { diagnoseVisualSnapshot } from '../scripts/visual-diagnostics.mjs'
import canonical from '../scripts/reference-outline.json'

describe('script contracts', () => {
  it('I-39 validator rejects missing reordered mistitled and incorrect-caption data', () => {
    expect(() => validateReference(canonical, canonical)).not.toThrow()
    expect(() => validateReference([], canonical)).toThrow('9 steps')
    expect(() => validateReference([...canonical].reverse(), canonical)).toThrow('step 0')
    for (const key of ['id', 'era', 'title', 'caption']) expect(() => validateReference([{ ...canonical[0], [key]: 'wrong' }, ...canonical.slice(1)], canonical)).toThrow(key)
  })
  it('I-42 errors retain phase and offending step in reporting', () => {
    expect(phaseFailure('render', new Error('step 2: console error'))).toBe('FAIL render: step 2: console error')
    expect(phaseFailure('build', new Error('type error'))).toBe('FAIL build: type error')
  })
  it('I-45 inspection settle configuration validates and preserves requested interval', () => {
    expect(parseOptions(['--settle-ms', '1234']).settleMs).toBe(1234)
    expect(parseOptions([]).settleMs).toBe(850)
    expect(() => parseOptions(['--settle-ms', '-1'])).toThrow('settleMs')
    expect(() => parseOptions(['--slug', '../outside'])).toThrow('slug')
    expect(() => parseOptions(['--width', 'bad'])).toThrow('width')
    expect(() => parseOptions(['--unknown'])).toThrow('Unknown')
  })
  it('I-46 collision geometry exemptions and nonoverlap decisions', () => {
    const a = { element: 1, label: 'a', rect: { left: 0, top: 0, right: 20, bottom: 20 } }
    const b = { ...a, element: 2, label: 'b' }
    const check = (texts: object[]) => diagnoseVisualSnapshot({ texts, chrome: [], attribution: { visible: true, fontSize: 12 } })
    expect(check([a, b])).toEqual(['overlap: a <> b'])
    expect(check([a, { ...b, allowOverlap: true }])).toEqual([])
    expect(check([a, { ...b, element: 1 }])).toEqual([])
    expect(check([a, { ...b, rect: { left: 20, top: 0, right: 40, bottom: 20 } }])).toEqual([])
  })
  it('I-46 chrome boxes detect disjoint-glyph collisions and exempt own labels and allowed subtrees', () => {
    const text = { element: 1, label: 'scene text', rect: { left: 30, top: 10, right: 50, bottom: 20 } }
    const glyph = { element: 3, ancestors: [2], label: 'own label', rect: { left: 1, top: 1, right: 5, bottom: 5 } }
    const box = { element: 2, label: 'icon-only chrome', rect: { left: 0, top: 0, right: 60, bottom: 40 } }
    const check = (texts: object[], chromeBoxes: object[]) => diagnoseVisualSnapshot({ texts, chromeBoxes, chrome: [], attribution: { visible: true, fontSize: 12 } })
    expect(check([text, glyph], [box])).toEqual(['overlap: scene text <> icon-only chrome'])
    expect(check([text, glyph], [{ ...box, allowOverlap: true }])).toEqual([])
    expect(check([glyph], [box])).toEqual([])
    expect(check([], [box, { ...box, element: 4, label: 'second chrome' }])).toEqual(['overlap: icon-only chrome <> second chrome'])
    expect(check([], [box, { ...box, element: 4, ancestors: [2] }])).toEqual([])
  })
  it('I-47 active chrome and attribution defect decisions', () => {
    const good = { visible: true, fontSize: 12, browserDefault: false }
    const diagnose = (attribution: object | null, same = false) => diagnoseVisualSnapshot({ texts: [], chrome: ['progress-item', 'toc-item'].map(hook => ({ hook, controls: [{ active: true, signature: 'a' }, { active: false, signature: same ? 'a' : 'b' }] })), attribution })
    expect(diagnose(good)).toEqual([])
    expect(diagnose(good, true)).toEqual(['indistinct active chrome: data-presentation-progress-item', 'indistinct active chrome: data-presentation-toc-item'])
    expect(diagnose(null)[0]).toContain('missing attribution')
    expect(diagnose({ ...good, visible: false })[0]).toContain('missing attribution')
    expect(diagnose({ ...good, fontSize: 10 })[0]).toContain('unpolished attribution')
    expect(diagnose({ ...good, browserDefault: true })[0]).toContain('unpolished attribution')
  })
  it('I-24 new monorepo app gets its own build setup even when the root already builds', async () => {
    const temporary = await mkdtemp(join(tmpdir(), 'and-scene-monorepo-'))
    const helper = (target: string, anchors: string) => execFileSync(process.execPath, [resolve('skills/presentation/scaffold.mjs'), '--target', target, '--anchors', anchors], { cwd: tmpdir() })
    try {
      const rootPackage = '{"private":true,"workspaces":["presentations/*"],"scripts":{"build":"turbo build"}}\n'
      await writeFile(join(temporary, 'package.json'), rootPackage)
      await writeFile(join(temporary, 'README.md'), 'unrelated')
      helper(join(temporary, 'presentations', 'scene-app'), 'kit,index')
      const written = await readdir(join(temporary, 'presentations', 'scene-app'))
      for (const name of ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'vite.config.ts', 'index.html', 'src']) expect(written).toContain(name)
      expect(await readFile(join(temporary, 'package.json'), 'utf8')).toBe(rootPackage)
      expect((await readdir(temporary)).sort()).toEqual(['README.md', 'package.json', 'presentations'])
      const hosted = join(temporary, 'hosted')
      await mkdir(hosted)
      await writeFile(join(hosted, 'package.json'), '{"scripts":{"build":"custom-build"}}\n')
      helper(hosted, 'kit')
      expect(await readdir(hosted)).not.toContain('vite.config.ts')
    } finally { await rm(temporary, { recursive: true, force: true }) }
  })
})
