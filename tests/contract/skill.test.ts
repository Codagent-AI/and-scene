import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script without type declarations
import { bootstrap, detect, detectAnchors, newPresentation } from '../../skills/presentation/scripts/presentation-tool.mjs'
// @ts-expect-error plain ESM script without type declarations
import { isTestFile, sharedFiles } from '../../scripts/sync-templates.mjs'
import { BOOTSTRAP, ROOT, read, walk } from './helpers.ts'

const dirs: string[] = []
const temp = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skill-test-'))
  dirs.push(dir)
  return dir
}
const write = (file: string, content: string) => {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('bootstrap template parity', () => {
  it('keeps every shared file byte-identical with its canonical copy', () => {
    const files: string[] = sharedFiles(ROOT)
    expect(files.length).toBeGreaterThan(20)
    expect(sharedFiles(BOOTSTRAP)).toEqual(files)
    for (const file of files) {
      expect(readFileSync(path.join(BOOTSTRAP, file)).equals(readFileSync(path.join(ROOT, file))), file).toBe(true)
    }
  })

  it('does not copy tests into the template', () => {
    expect(walk(BOOTSTRAP, (f) => !f.includes('node_modules') && isTestFile(f))).toEqual([])
  })

  it('ships a committed lockfile and a starter presentation with at least two steps', () => {
    expect(existsSync(path.join(BOOTSTRAP, 'package-lock.json'))).toBe(true)
    expect(read('skills/presentation/templates/bootstrap/src/presentations/index.ts')).toContain("slug: 'starter'")
    expect(read('skills/presentation/templates/bootstrap/src/presentations/starter/steps/index.ts').match(/beat\('/g)!.length).toBeGreaterThanOrEqual(2)
  })
})

describe('skill package', () => {
  it('has valid frontmatter and bundled templates', () => {
    const skill = read('skills/presentation/SKILL.md')
    const front = /^---\n([\s\S]*?)\n---\n/.exec(skill)![1]
    expect(front).toMatch(/^name: presentation$/m)
    expect(front).toMatch(/^description: .{40,}/m)
    for (const rel of ['templates/bootstrap/package.json', 'templates/presentation/Talk.tsx.tmpl', 'scripts/presentation-tool.mjs']) {
      expect(existsSync(path.join(ROOT, 'skills/presentation', rel)), rel).toBe(true)
    }
  })
})

describe('anchor detection and target resolution', () => {
  it('scaffolds an empty directory at its root without asking', () => {
    const dir = temp()
    const result = detect(dir)
    expect(result).toMatchObject({ kind: 'empty', target: dir, missing: ['build', 'kit', 'index'], needsConfirmation: false })
    bootstrap(dir, { install: false })
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(detect(dir)).toMatchObject({ kind: 'existing-app', missing: [] })
    expect(existsSync(path.join(dir, 'src/presentations/starter/Talk.tsx'))).toBe(true)
    expect(existsSync(path.join(dir, 'scripts/verify.mjs'))).toBe(true)
  })

  it('scaffolds a non-empty standalone project at its root, after confirmation', () => {
    const dir = temp()
    write(path.join(dir, 'README.md'), 'mine')
    expect(detect(dir)).toMatchObject({ kind: 'standalone', target: dir, needsConfirmation: true })
  })

  it.each([
    ['workspaces', (dir: string) => write(path.join(dir, 'package.json'), '{"name":"mono","workspaces":["packages/*"]}')],
    ['pnpm-workspace.yaml', (dir: string) => write(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - "pkgs/*"\n')],
    ['packages/ layout', (dir: string) => mkdirSync(path.join(dir, 'packages/a'), { recursive: true })],
    ['apps/ layout', (dir: string) => mkdirSync(path.join(dir, 'apps/a'), { recursive: true })],
  ])('targets presentations/ in a monorepo detected by %s and leaves the root untouched', (_name, setup) => {
    const dir = temp()
    write(path.join(dir, 'unrelated.txt'), 'keep me')
    setup(dir)
    const before = walk(dir)
    const result = detect(dir)
    expect(result).toMatchObject({ kind: 'monorepo', target: path.join(dir, 'presentations'), needsConfirmation: true })
    expect(result.missing).toEqual(['build', 'kit', 'index'])
    bootstrap(result.target, { install: false })
    expect(walk(dir).filter((f) => !f.startsWith('presentations'))).toEqual(before)
    expect(readFileSync(path.join(dir, 'unrelated.txt'), 'utf8')).toBe('keep me')
    expect(detectAnchors(result.target)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not let a monorepo root build setup satisfy the target app', () => {
    const dir = temp()
    cpSync(path.join(BOOTSTRAP, 'package.json'), path.join(dir, 'package.json'))
    write(path.join(dir, 'vite.config.ts'), 'export default {}')
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    write(path.join(dir, 'package.json'), JSON.stringify({ ...pkg, workspaces: ['packages/*'] }))
    const result = detect(dir)
    expect(result.kind).toBe('monorepo')
    expect(result.anchors.build).toBe(false)
  })

  it('adds only missing anchors to a partial scaffold and keeps existing files untouched', () => {
    const dir = temp()
    cpSync(BOOTSTRAP, dir, { recursive: true, filter: (src) => !/presentations|scripts/.test(path.relative(BOOTSTRAP, src)) && !src.includes('presentation-kit') })
    write(path.join(dir, 'vite.config.ts'), '// customised\nexport default {}\n')
    const before = readFileSync(path.join(dir, 'vite.config.ts'), 'utf8')
    const buildOnly = detect(dir)
    expect(buildOnly.anchors).toEqual({ build: true, kit: false, index: false })
    expect(buildOnly.kind).toBe('standalone')
    const added = bootstrap(dir, { anchors: buildOnly.missing, install: false })
    expect(added).toEqual(['kit', 'index'])
    expect(readFileSync(path.join(dir, 'vite.config.ts'), 'utf8')).toBe(before)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('detects anchors by contract, tolerating renamed files and extra dependencies', () => {
    const dir = temp()
    write(path.join(dir, 'package.json'), JSON.stringify({ scripts: { build: 'vite build' }, dependencies: { react: '1', lodash: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
    write(path.join(dir, 'vite.config.mjs'), 'export default {}')
    write(
      path.join(dir, 'src/presentation-kit/Deck.tsx'),
      "import { AnimatePresence } from 'motion/react'\nexport interface Step { id: string }\nwindow.addEventListener('keydown', () => {})\nexport function Presentation() { return <AnimatePresence /> }\n",
    )
    write(path.join(dir, 'src/presentations/index.ts'), 'export const ALL = [] as { slug: string; load: () => Promise<unknown> }[]\n')
    write(path.join(dir, 'src/entry.tsx'), 'const route = window.location.pathname\n')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not accept stand-ins that lack the kit or routing contract', () => {
    const dir = temp()
    write(path.join(dir, 'src/presentation-kit/Presentation.tsx'), 'export function Presentation() { return null }\n')
    write(path.join(dir, 'src/presentations/index.ts'), 'export const PRESENTATIONS = []\n')
    expect(detectAnchors(dir)).toMatchObject({ kit: false, index: false })
    write(path.join(dir, 'src/presentations/index.ts'), 'export const PRESENTATIONS: { slug: string; load: () => void }[] = []\n')
    expect(detectAnchors(dir).index).toBe(false)
    write(path.join(dir, 'src/router.ts'), 'export const r = (pathname: string) => pathname\n')
    expect(detectAnchors(dir).index).toBe(true)
  })

  it('merges missing dependencies into an existing package.json without removing anything', () => {
    const dir = temp()
    write(path.join(dir, 'package.json'), JSON.stringify({ name: 'mine', scripts: { build: 'x', custom: 'y' }, dependencies: { react: '^18.0.0', other: '1' } }))
    bootstrap(dir, { anchors: ['build'], install: false })
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('mine')
    expect(pkg.scripts).toMatchObject({ build: 'x', custom: 'y', verify: expect.any(String) })
    expect(pkg.dependencies).toMatchObject({ react: '^18.0.0', other: '1', motion: expect.any(String), 'lucide-react': expect.any(String) })
    expect(pkg.devDependencies).toMatchObject({ vite: expect.any(String), playwright: expect.any(String) })
  })
})

describe('creating presentations', () => {
  const scaffolded = () => {
    const dir = temp()
    bootstrap(dir, { install: false })
    return dir
  }

  it('writes a self-contained folder and registers it alongside existing presentations', () => {
    const dir = scaffolded()
    const result = newPresentation(dir, 'my-talk', 'My "Talk"')
    expect(result.route).toBe('/my-talk')
    for (const file of ['Talk.tsx', 'entities.ts', 'styles.css', 'steps/index.ts', 'steps/scene.tsx']) {
      expect(existsSync(path.join(dir, 'src/presentations/my-talk', file)), file).toBe(true)
    }
    const registry = readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'starter'")
    expect(registry).toContain("slug: 'my-talk'")
    expect(registry).toContain('title: "My \\"Talk\\""')
    expect(readFileSync(path.join(dir, 'src/presentations/my-talk/Talk.tsx'), 'utf8')).toContain('title={"My \\"Talk\\""}')
    expect(existsSync(path.join(dir, 'src/presentations/starter/Talk.tsx'))).toBe(true)
  })

  it('registers inside the registry array even when later code contains other `]` characters', () => {
    const dir = scaffolded()
    const file = path.join(dir, 'src/presentations/index.ts')
    writeFileSync(
      file,
      `${readFileSync(file, 'utf8')}\ntype RegistryAlias = unknown[];\nconst note = "ends with ]"; // trailing ] in a comment\nexport const OTHER: string[] = []\n`,
    )
    newPresentation(dir, 'added-through-tool', 'Added Through Tool')
    const registry = readFileSync(file, 'utf8')
    expect(registry).toContain('type RegistryAlias = unknown[];')
    expect(registry).toContain('export const OTHER: string[] = []')
    const array = registry.slice(registry.indexOf('PRESENTATIONS'), registry.indexOf('type RegistryAlias'))
    expect(array).toContain("slug: 'starter'")
    expect(array).toContain("slug: 'added-through-tool'")
    expect(array.trimEnd().endsWith(']')).toBe(true)
  })

  it('registers into an empty registry array declared with a bracketed type annotation', () => {
    const dir = scaffolded()
    const file = path.join(dir, 'src/presentations/index.ts')
    writeFileSync(
      file,
      "import type { ComponentType } from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }\nexport const PRESENTATIONS: readonly PresentationEntry[] = []\n",
    )
    newPresentation(dir, 'first-one', 'First')
    const registry = readFileSync(file, 'utf8')
    expect(registry).toMatch(/= \[\s*\{\s*slug: 'first-one'[\s\S]*\},\s*\]/)
  })

  it('refuses duplicate or invalid slugs and a missing index, changing nothing', () => {
    const dir = scaffolded()
    const registry = readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    expect(() => newPresentation(dir, 'starter', 'Again')).toThrow(/already exists/)
    expect(() => newPresentation(dir, 'Bad Slug', 'x')).toThrow(/invalid slug/)
    expect(() => newPresentation(temp(), 'a', 'x')).toThrow(/index/)
    expect(readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')).toBe(registry)
  })
})
