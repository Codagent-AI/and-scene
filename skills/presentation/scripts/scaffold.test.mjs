import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { ConfirmationRequired, addPresentation, apply, detectAnchors, isMonorepo, plan, resolveTarget } from './scaffold.mjs'

const tmpRoots = []
const tmp = () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'scaffold-'))
  tmpRoots.push(d)
  return d
}
const put = (dir, rel, content = '') => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), content)
}
const json = (dir, rel) => JSON.parse(readFileSync(path.join(dir, rel), 'utf8'))
afterAll(() => tmpRoots.forEach((d) => rmSync(d, { recursive: true, force: true })))

const buildOnly = (dir, extra = {}) => {
  put(dir, 'package.json', JSON.stringify({ name: 'host', scripts: { build: 'vite build' }, dependencies: { react: '^18.0.0' }, ...extra }))
  put(dir, 'vite.config.ts', 'export default {}')
}

describe('anchor detection', () => {
  it('finds no anchors in an empty directory', () => {
    expect(detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
  })

  it('finds all three after a full scaffold', () => {
    const dir = tmp()
    apply(dir)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  // A renamed, reformatted kit that still has every part of the contract.
  const RENAMED_KIT = `
    import { AnimatePresence } from 'motion/react'
    export type Step = { id: string; caption: string }
    export type SceneProps = { payload: unknown }
    const Toc = () => null // table of contents chrome
    export function Presentation() {
      window.addEventListener('keydown', () => {})
      window.addEventListener('touchstart', () => {})
      window.addEventListener('touchend', () => {})
      const scale = 1
      return [AnimatePresence, Toc, scale]
    }`

  it('is contract-level: cosmetic differences do not hide an anchor', () => {
    const dir = tmp()
    buildOnly(dir)
    put(dir, 'vite.config.mjs', 'export default {}')
    put(dir, 'src/presentation-kit/engine.tsx', RENAMED_KIT)
    put(dir, 'src/presentations/index.tsx', 'export const registry = [{ slug: "a", title: "A", load: () => import("./a") }]')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not accept a stub that names the pieces without implementing the contract', () => {
    const dir = tmp()
    put(dir, 'src/presentation-kit/stub.tsx', 'export type Step = {}; export type SceneProps = {}; export function Presentation() {}')
    expect(detectAnchors(dir).kit).toBe(false)
    put(dir, 'src/presentations/index.ts', 'export const unrelated = 1')
    expect(detectAnchors(dir).index).toBe(false)
  })

  it.each(['keydown', 'AnimatePresence', 'touch', 'caption', 'scale'])('requires the kit to provide %s', (part) => {
    const dir = tmp()
    put(dir, 'src/presentation-kit/engine.tsx', RENAMED_KIT.replaceAll(part, 'x'))
    expect(detectAnchors(dir).kit).toBe(false)
  })

  it('reports build only when both a build script and a vite config exist', () => {
    const dir = tmp()
    put(dir, 'package.json', JSON.stringify({ scripts: { build: 'x' } }))
    expect(detectAnchors(dir).build).toBe(false)
  })
})

describe('target resolution', () => {
  it.each([
    ['workspaces in package.json', (d) => put(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d) => put(d, 'pnpm-workspace.yaml', 'packages: []')],
    ['packages/ layout', (d) => mkdirSync(path.join(d, 'packages'))],
    ['apps/ layout', (d) => mkdirSync(path.join(d, 'apps'))],
  ])('scaffolds under presentations/ in a monorepo (%s)', (_, setup) => {
    const dir = tmp()
    setup(dir)
    expect(isMonorepo(dir)).toBe(true)
    expect(resolveTarget(dir)).toEqual({ target: path.join(dir, 'presentations'), reason: 'monorepo' })
  })

  it('scaffolds at the root of an empty or standalone project', () => {
    const dir = tmp()
    expect(resolveTarget(dir)).toEqual({ target: dir, reason: 'standalone' })
    buildOnly(dir)
    expect(resolveTarget(dir).target).toBe(dir)
  })

  it('reuses an app that already has the kit or index, even inside a monorepo', () => {
    const dir = tmp()
    apply(dir)
    mkdirSync(path.join(dir, 'packages'))
    expect(resolveTarget(dir)).toEqual({ target: dir, reason: 'existing-app' })
  })
})

describe('apply', () => {
  it('fully scaffolds an empty directory with the declared dependency set and no styling framework', () => {
    const dir = tmp()
    const result = apply(dir)
    expect(result.scaffolded).toEqual(['build', 'kit', 'index'])
    expect(result.nextSteps).toEqual(['npm install'])
    const pkg = json(dir, 'package.json')
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const d of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(deps, d).toContain(d)
    }
    expect(deps.filter((d) => /tailwind/.test(d))).toEqual([])
    expect(pkg.scripts).toMatchObject({ build: expect.any(String), lint: expect.any(String), verify: expect.any(String), inspect: expect.any(String) })
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(true)
    expect(existsSync(path.join(dir, 'src/presentations/index.ts'))).toBe(true)
  })

  it('does nothing when all three anchors are present', () => {
    const dir = tmp()
    apply(dir)
    const second = apply(dir)
    expect(second.scaffolded).toEqual([])
    expect(second.created).toEqual([])
    expect(second.nextSteps).toEqual([])
  })

  it('scaffolds only the missing anchors and leaves existing files untouched', () => {
    const dir = tmp()
    apply(dir)
    rmSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    put(dir, 'src/presentations/index.ts', "// customised\nimport type { PresentationEntry } from './types.ts'\nexport const presentations: PresentationEntry[] = []\n")
    const result = apply(dir, { confirmed: true })
    expect(result.scaffolded).toEqual(['kit'])
    expect(result.created.every((f) => f.startsWith('src/presentation-kit/') || f.startsWith('scripts/'))).toBe(true)
    expect(readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')).toContain('// customised')
  })

  it('does not assume dependencies are installed: adds missing ones, never changes existing ones', () => {
    const dir = tmp()
    buildOnly(dir, { devDependencies: { vite: '^1.0.0' } })
    put(dir, 'README.md', 'keep me')
    apply(dir, { confirmed: true })
    // standalone project: scaffold at root, merging package.json
    const pkg = json(dir, 'package.json')
    expect(pkg.name).toBe('host')
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.devDependencies.vite).toBe('^1.0.0')
    expect(pkg.dependencies.motion).toBeDefined()
    expect(pkg.devDependencies.playwright).toBeDefined()
    expect(pkg.scripts.build).toBe('vite build')
    expect(pkg.scripts.verify).toBeDefined()
    expect(readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe('keep me')
  })

  it('requires confirmation before writing into a non-empty project missing the kit or index', () => {
    const dir = tmp()
    buildOnly(dir)
    const p = plan(dir)
    expect(p.needsConfirmation).toBe(true)
    expect(() => apply(dir)).toThrow(ConfirmationRequired)
    expect(existsSync(path.join(dir, 'src'))).toBe(false)
    expect(() => apply(dir, { confirmed: true })).not.toThrow()
  })

  it('needs no confirmation in an empty directory', () => {
    expect(plan(tmp()).needsConfirmation).toBe(false)
  })

  it('in a partial monorepo preserves root content and writes a self-contained app under presentations/', () => {
    const dir = tmp()
    buildOnly(dir, { workspaces: ['packages/*'] })
    put(dir, 'packages/lib/index.ts', 'export {}')
    const before = readFileSync(path.join(dir, 'package.json'), 'utf8')
    const p = plan(dir)
    expect(p.target).toBe(path.join(dir, 'presentations'))
    expect(p.needsConfirmation).toBe(true)
    const result = apply(dir, { confirmed: true })
    expect(result.target).toBe(path.join(dir, 'presentations'))
    expect(readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(before)
    expect(existsSync(path.join(dir, 'src'))).toBe(false)
    expect(detectAnchors(path.join(dir, 'presentations'))).toEqual({ build: true, kit: true, index: true })
  })

  it('flags a pre-existing main.tsx for manual wiring instead of overwriting it', () => {
    const dir = tmp()
    put(dir, 'src/main.tsx', '// mine')
    const result = apply(dir, { confirmed: true })
    expect(readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('// mine')
    expect(result.manual.join(' ')).toMatch(/main\.tsx/)
  })

  it('resolves templates from the skill directory regardless of the working directory', () => {
    const cwd = tmp()
    const dir = tmp()
    const cli = path.resolve(import.meta.dirname, 'scaffold.mjs')
    const run = spawnSync(process.execPath, [cli, 'apply', dir], { cwd, encoding: 'utf8' })
    expect(run.status).toBe(0)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('the CLI exits 3 when confirmation is required', () => {
    const dir = tmp()
    buildOnly(dir)
    const cli = path.resolve(import.meta.dirname, 'scaffold.mjs')
    const run = spawnSync(process.execPath, [cli, 'apply', dir], { encoding: 'utf8' })
    expect(run.status).toBe(3)
    expect(run.stderr).toMatch(/confirmation/)
  })
})

describe('addPresentation', () => {
  it('writes a self-contained folder and registers it, keeping existing entries', () => {
    const dir = tmp()
    apply(dir)
    addPresentation(dir, 'first-talk', 'First "Talk"')
    const out = addPresentation(dir, 'second-talk', 'Second')
    expect(out.route).toBe('/second-talk')
    const index = readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    expect(index).toContain("slug: 'first-talk'")
    expect(index).toContain("slug: 'second-talk'")
    expect(index).toContain('import(\'./second-talk/Talk.tsx\')')
    expect(index.indexOf('first-talk')).toBeLessThan(index.indexOf('second-talk'))
    for (const f of ['Talk.tsx', 'entities.ts', 'steps/index.ts', 'steps/Scene.tsx', 'styles.css']) {
      expect(existsSync(path.join(dir, 'src/presentations/first-talk', f)), f).toBe(true)
    }
    const entities = readFileSync(path.join(dir, 'src/presentations/second-talk/entities.ts'), 'utf8')
    expect(entities).toContain('second-talk-subject')
    expect(entities).not.toContain('__SLUG__')
  })

  it('leaves existing presentations untouched', () => {
    const dir = tmp()
    apply(dir)
    addPresentation(dir, 'one', 'One')
    const before = readFileSync(path.join(dir, 'src/presentations/one/Talk.tsx'), 'utf8')
    addPresentation(dir, 'two', 'Two')
    expect(readFileSync(path.join(dir, 'src/presentations/one/Talk.tsx'), 'utf8')).toBe(before)
  })

  it('rejects invalid and duplicate slugs and a missing index', () => {
    const dir = tmp()
    expect(() => addPresentation(dir, 'ok', 'Ok')).toThrow(/index/)
    apply(dir)
    expect(() => addPresentation(dir, 'Bad Slug', 'x')).toThrow(/Invalid slug/)
    addPresentation(dir, 'dup', 'Dup')
    expect(() => addPresentation(dir, 'dup', 'Dup')).toThrow(/already exists/)
  })

  it('registers into a customised index.tsx without markers, keeping its entries', () => {
    const dir = tmp()
    apply(dir)
    rmSync(path.join(dir, 'src/presentations/index.ts'))
    put(dir, 'src/presentations/index.tsx', "import type { PresentationEntry } from './types.ts'\nexport const presentations: PresentationEntry[] = [{ slug: 'old', title: 'Old', load: () => import('./old/Talk.tsx') }] // [done]\n")
    addPresentation(dir, 'fresh', 'Fresh')
    const index = readFileSync(path.join(dir, 'src/presentations/index.tsx'), 'utf8')
    expect(index).toContain("slug: 'old'")
    expect(index).toContain("slug: 'fresh'")
    expect(index.indexOf("slug: 'old'")).toBeLessThan(index.indexOf("slug: 'fresh'"))
    expect(index).toMatch(/\},\s*\{\s*slug: 'fresh'/)
  })

  it('registers into an empty one-line array', () => {
    const dir = tmp()
    apply(dir)
    put(dir, 'src/presentations/index.ts', 'export const presentations = []\n')
    addPresentation(dir, 'solo', 'Solo')
    expect(readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')).toMatch(/\[\s*\{\s*slug: 'solo'[\s\S]*\},?\s*\]/)
  })

  it('fails loudly, writing nothing, when the index has no array it can extend', () => {
    const dir = tmp()
    apply(dir)
    put(dir, 'src/presentations/index.ts', 'export const presentations = buildList()\n')
    expect(() => addPresentation(dir, 'nope', 'Nope')).toThrow(/by hand/)
    expect(existsSync(path.join(dir, 'src/presentations/nope'))).toBe(false)
  })

  it('substitutes any title as a valid string literal in every generated file', () => {
    const dir = tmp()
    apply(dir)
    const title = `Say "hi" \\ {x} <b> it's`
    addPresentation(dir, 'quoted', title)
    const talk = readFileSync(path.join(dir, 'src/presentations/quoted/Talk.tsx'), 'utf8')
    expect(talk).toContain(`title={${JSON.stringify(title)}}`)
    expect(readFileSync(path.join(dir, 'src/presentations/quoted/steps/index.ts'), 'utf8')).toContain(`title: ${JSON.stringify(title)}`)
    expect(readFileSync(path.join(dir, 'src/presentations/quoted/steps/Scene.tsx'), 'utf8')).toContain(`<strong>{${JSON.stringify(title)}}</strong>`)
  })

  it('adds into presentations/ for a monorepo target', () => {
    const dir = tmp()
    put(dir, 'pnpm-workspace.yaml', 'packages: []')
    apply(dir, { confirmed: true })
    addPresentation(dir, 'mono', 'Mono')
    expect(existsSync(path.join(dir, 'presentations/src/presentations/mono/Talk.tsx'))).toBe(true)
  })
})
