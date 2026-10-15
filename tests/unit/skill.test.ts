// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

const SKILL = path.resolve(import.meta.dirname, '../../skills/presentation')
const lib = await import(pathToFileURL(path.join(SKILL, 'scripts/lib.mjs')).href)
const scaffoldMod = await import(pathToFileURL(path.join(SKILL, 'scripts/scaffold.mjs')).href)

const dirs: string[] = []
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'skill-'))
  dirs.push(d)
  return d
}
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))
const write = (dir: string, rel: string, content: string) => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), content)
}

describe('SKILL.md', () => {
  const md = readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8')
  it('has skill frontmatter', () => {
    expect(md).toMatch(/^---\nname: presentation\ndescription: .{40,}\n---\n/)
  })
  it('directs the agent to the helpers and the project-local inspector', () => {
    for (const s of ['detect-anchors.mjs', 'scaffold.mjs', 'npm run inspect', 'one at a time', 'allow-overlap', 'confirm']) {
      expect(md.toLowerCase()).toContain(s.toLowerCase())
    }
  })
})

describe('detectAnchors / resolveTarget', () => {
  it('empty dir → root, full scaffold needed, no confirmation', () => {
    const d = tmp()
    const r = lib.resolveTarget(d)
    expect(r).toMatchObject({ target: d, reason: 'empty', none: true, needsConfirmation: false })
  })

  it('standalone non-empty project without anchors → root, confirmation required', () => {
    const d = tmp()
    write(d, 'README.md', 'hi')
    expect(lib.resolveTarget(d)).toMatchObject({ target: d, reason: 'standalone', needsConfirmation: true })
  })

  it.each([
    ['workspaces', (d: string) => write(d, 'package.json', '{"workspaces":["packages/*"]}')],
    ['pnpm-workspace', (d: string) => write(d, 'pnpm-workspace.yaml', 'packages: []')],
    ['packages-or-apps', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('monorepo via %s → presentations/', (signal, setup) => {
    const d = tmp()
    setup(d)
    const r = lib.resolveTarget(d)
    expect(r.monorepo).toBe(true)
    expect(r.signals).toContain(signal)
    expect(r).toMatchObject({ target: path.join(d, 'presentations'), reason: 'monorepo', needsConfirmation: true })
  })

  it('partial scaffold: detects exactly the anchors present', () => {
    const d = tmp()
    write(d, 'package.json', JSON.stringify({ scripts: { build: 'tsc -b && vite build' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
    const r = lib.resolveTarget(d)
    expect(r.anchors).toEqual({ buildSetup: true, sceneKit: false, presentationIndex: false })
    expect(r).toMatchObject({ target: d, reason: 'existing-app', needsConfirmation: true })
  })

  it('full scaffold is complete and needs no confirmation (detection is contract-level)', () => {
    const d = tmp()
    lib.scaffold(d)
    // cosmetic change: reformat the registry; still detected
    write(d, 'src/presentations/index.ts', "export const presentations = [{ slug: 'x', title: 'X', load: () => import('./x/Talk') }]\n")
    const r = lib.resolveTarget(d)
    expect(r).toMatchObject({ target: d, complete: true, reason: 'existing-app', needsConfirmation: false })
  })

  it('app inside a monorepo is used in place when anchors are complete', () => {
    const d = tmp()
    write(d, 'pnpm-workspace.yaml', 'packages: []')
    lib.scaffold(path.join(d, 'presentations'))
    expect(lib.resolveTarget(d)).toMatchObject({ target: path.join(d, 'presentations'), complete: true, needsConfirmation: false })
    expect(lib.resolveTarget(path.join(d, 'presentations'))).toMatchObject({ target: path.join(d, 'presentations'), complete: true })
  })
})

describe('scaffold', () => {
  it('copies the full bootstrap into an empty dir, registering the starter', () => {
    const d = tmp()
    const rep = lib.scaffold(d)
    expect(rep.needsInstall).toBe(true)
    for (const f of ['package.json', 'package-lock.json', 'src/presentation-kit/index.ts', 'src/presentations/index.ts', 'scripts/verify.mjs', 'src/presentations/starter/Talk.tsx']) {
      expect(existsSync(path.join(d, f)), f).toBe(true)
    }
    expect(lib.detectAnchors(d).complete).toBe(true)
  })

  it('copies only missing anchors and never overwrites existing files', () => {
    const d = tmp()
    write(d, 'package.json', JSON.stringify({ scripts: { build: 'vite build' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
    write(d, 'src/presentations/index.ts', 'export const presentations = [] // slug\n')
    const before = readFileSync(path.join(d, 'package.json'), 'utf8')
    const rep = lib.scaffold(d)
    expect(rep.missing).toEqual(['sceneKit'])
    expect(readFileSync(path.join(d, 'package.json'), 'utf8')).toBe(before)
    expect(readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')).toContain('slug')
    expect(existsSync(path.join(d, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(d, 'src/presentations/starter'))).toBe(false)
  })

  it('is a no-op on a full scaffold', () => {
    const d = tmp()
    lib.scaffold(d)
    expect(lib.scaffold(d)).toMatchObject({ copied: [], needsInstall: false })
  })

  it('template lookup is independent of the caller cwd', () => {
    const prev = process.cwd()
    const elsewhere = tmp()
    process.chdir(elsewhere)
    try {
      const d = tmp()
      lib.scaffold(d)
      expect(existsSync(path.join(d, 'src/presentation-kit/index.ts'))).toBe(true)
      expect(lib.BOOTSTRAP_DIR).toBe(path.join(SKILL, 'templates/bootstrap'))
    } finally {
      process.chdir(prev)
    }
  })

  it('creates a presentation folder from the template and rejects bad or duplicate slugs', () => {
    const d = tmp()
    lib.scaffold(d)
    const dest = scaffoldMod.createPresentation(d, 'my-talk', 'My Talk')
    for (const f of ['entities.ts', 'Talk.tsx', 'style.css', 'steps/index.ts']) expect(existsSync(path.join(dest, f))).toBe(true)
    expect(readFileSync(path.join(dest, 'Talk.tsx'), 'utf8')).toContain('title="My Talk"')
    expect(readFileSync(path.join(dest, 'entities.ts'), 'utf8')).not.toContain('__SLUG__')
    expect(() => scaffoldMod.createPresentation(d, 'my-talk', 'x')).toThrow(/exists/)
    expect(() => scaffoldMod.createPresentation(d, 'Bad Slug', 'x')).toThrow(/kebab/)
  })
})

