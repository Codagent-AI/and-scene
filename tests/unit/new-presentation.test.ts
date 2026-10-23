import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createPresentation } from '../../skills/presentation/scripts/new-presentation.mjs'
import { applyScaffold } from '../../skills/presentation/scripts/scaffold.mjs'
import { parseRegistry } from '../../scripts/lib/verify-core.mjs'

const dirs: string[] = []
function scaffolded() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'newpres-'))
  dirs.push(dir)
  applyScaffold(dir, { install: false })
  return dir
}
afterEach(() => dirs.splice(0).forEach((d) => fs.rmSync(d, { recursive: true, force: true })))

const registry = (dir: string) => fs.readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')

describe('createPresentation', () => {
  it('writes a self-contained folder with entities, steps, Talk and local CSS, and registers one line', () => {
    const dir = scaffolded()
    const before = registry(dir)
    const result = createPresentation(dir, 'my-talk', "It's a Talk")
    const base = path.join(dir, 'src/presentations/my-talk')
    for (const rel of ['entities.ts', 'Scene.tsx', 'Talk.tsx', 'my-talk.css', 'steps/index.ts', 'steps/step-1.tsx']) {
      expect(fs.existsSync(path.join(base, rel)), rel).toBe(true)
    }
    expect(result.created).toHaveLength(8)
    expect(fs.readFileSync(path.join(base, 'Talk.tsx'), 'utf8')).toContain("import './my-talk.css'")
    expect(fs.readFileSync(path.join(base, 'Talk.tsx'), 'utf8')).toContain("It\\'s a Talk")
    expect(fs.readFileSync(path.join(base, 'my-talk.css'), 'utf8')).toContain('.my-talk')
    for (const file of fs.readdirSync(base, { recursive: true, encoding: 'utf8' })) {
      const full = path.join(base, file)
      if (fs.statSync(full).isFile()) expect(fs.readFileSync(full, 'utf8'), file).not.toMatch(/__[A-Z]+__/)
    }
    const after = registry(dir)
    expect(after.startsWith(before.slice(0, before.lastIndexOf('\n]')))).toBe(true)
    expect(parseRegistry(after).map((e) => e.slug)).toEqual(['starter', 'my-talk'])
    expect(parseRegistry(after)[1].title).toBe("It's a Talk")
    expect(after).toContain("load: () => import('./my-talk/Talk.tsx')")
  })

  it('keeps existing presentations and registry lines byte-identical', () => {
    const dir = scaffolded()
    const starter = fs.readFileSync(path.join(dir, 'src/presentations/starter/Talk.tsx'), 'utf8')
    createPresentation(dir, 'one', 'One')
    createPresentation(dir, 'two', 'Two')
    expect(fs.readFileSync(path.join(dir, 'src/presentations/starter/Talk.tsx'), 'utf8')).toBe(starter)
    expect(parseRegistry(registry(dir)).map((e) => e.slug)).toEqual(['starter', 'one', 'two'])
  })

  it('registers into a renamed registry file', () => {
    const dir = scaffolded()
    fs.renameSync(path.join(dir, 'src/presentations/index.ts'), path.join(dir, 'src/presentations/registry.ts'))
    createPresentation(dir, 'renamed', 'Renamed')
    expect(parseRegistry(fs.readFileSync(path.join(dir, 'src/presentations/registry.ts'), 'utf8')).map((e) => e.slug)).toEqual(['starter', 'renamed'])
  })

  it('refuses an existing presentation, an invalid slug and a missing index, writing nothing', () => {
    const dir = scaffolded()
    createPresentation(dir, 'dup', 'Dup')
    const before = registry(dir)
    expect(() => createPresentation(dir, 'dup', 'Again')).toThrowError(/already exists/)
    expect(() => createPresentation(dir, 'starter', 'x')).toThrowError(/already exists/)
    for (const bad of ['Bad Slug', '../escape', 'UPPER', '', 'a--b']) expect(() => createPresentation(dir, bad, 'x'), bad).toThrowError(/invalid slug/)
    expect(registry(dir)).toBe(before)
    expect(() => createPresentation(fs.mkdtempSync(path.join(os.tmpdir(), 'empty-')), 'x', 'x')).toThrowError(/no presentation index/)
  })
})
