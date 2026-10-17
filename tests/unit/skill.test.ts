import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  anchorOf,
  bootstrap,
  bootstrapDir,
  createPresentation,
  detect,
  detectAnchors,
  presentationTemplateDir,
  renderTemplate,
  skillDir,
  templateFiles,
} from '../../skills/presentation/scripts/scaffold.mjs'

const root = join(__dirname, '..', '..')
const made: string[] = []

function project(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'scaffold-unit-'))
  made.push(dir)
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return dir
}

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function tree(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  const visit = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) visit(path)
      else out[relative(dir, path)] = createHash('sha1').update(readFileSync(path)).digest('hex')
    }
  }
  visit(dir)
  return out
}

/** A complete app produced by the real bootstrap. */
function fullApp(): string {
  const dir = project()
  bootstrap(dir, { apply: true })
  return dir
}

const read = (path: string) => readFileSync(path, 'utf8')

describe('anchor detection', () => {
  it('finds nothing in an empty directory', () => {
    expect(detectAnchors(project())).toEqual({ build: false, kit: false, index: false })
  })

  it('finds all three anchors in a bootstrapped app', () => {
    expect(detectAnchors(fullApp())).toEqual({ build: true, kit: true, index: true })
  })

  it('is keyed on capability: renamed files and extra dependencies still count', () => {
    const dir = fullApp()
    cpSync(join(dir, 'src/presentation-kit'), join(dir, 'src/engine'), { recursive: true })
    rmSync(join(dir, 'src/presentation-kit'), { recursive: true })
    cpSync(join(dir, 'src/presentations/index.ts'), join(dir, 'src/presentations/catalog.ts'))
    rmSync(join(dir, 'src/presentations/index.ts'))
    const pkg = JSON.parse(read(join(dir, 'package.json')))
    pkg.dependencies.zod = '^4.0.0'
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('treats superficially named but nonfunctional anchors as missing', () => {
    const dir = fullApp()
    rmSync(join(dir, 'src/presentation-kit'), { recursive: true })
    mkdirSync(join(dir, 'src/presentation-kit'))
    writeFileSync(join(dir, 'src/presentation-kit/Presentation.tsx'), 'export const Presentation = () => null\n')
    writeFileSync(join(dir, 'src/presentations/index.ts'), 'export const PRESENTATIONS = []\n')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: false, index: false })
    const pkg = JSON.parse(read(join(dir, 'package.json')))
    delete pkg.scripts.build
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
    expect(detectAnchors(dir).build).toBe(false)
  })

  it('ignores test files when looking for the kit', () => {
    const dir = project({
      'package.json': JSON.stringify({ scripts: { build: 'vite build' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }),
      'vite.config.ts': 'export default {}',
      'src/x.test.ts': 'interface Step {} AnimatePresence LayoutGroup ArrowRight keydown data-step-count scale ResizeObserver',
    })
    expect(detectAnchors(dir)).toEqual({ build: true, kit: false, index: false })
  })
})

describe('target resolution', () => {
  it('scaffolds an empty directory at its root without confirmation', () => {
    const dir = project()
    const plan = detect(dir)
    expect(plan.target).toBe(dir)
    expect(plan.missing).toEqual(['build', 'kit', 'index'])
    expect(plan.nonEmpty).toBe(false)
    expect(plan.requiresConfirmation).toBe(false)
  })

  it('scaffolds a standalone non-empty project at its root, with confirmation', () => {
    const dir = project({ 'README.md': 'hello', 'package.json': JSON.stringify({ name: 'x' }) })
    const plan = detect(dir)
    expect(plan.target).toBe(dir)
    expect(plan.monorepo).toEqual([])
    expect(plan.requiresConfirmation).toBe(true)
  })

  it.each([
    ['workspaces', { 'package.json': JSON.stringify({ workspaces: ['packages/*'] }) }],
    ['pnpm-workspace.yaml', { 'pnpm-workspace.yaml': 'packages:\n  - x\n' }],
    ['packages/', { 'packages/a/index.js': '' }],
    ['apps/', { 'apps/web/index.js': '' }],
  ])('treats a %s signal as a monorepo and targets presentations/', (signal, files) => {
    const dir = project(files)
    const plan = detect(dir)
    expect(plan.monorepo).toContain(signal)
    expect(plan.target).toBe(join(dir, 'presentations'))
    expect(plan.projectRoot).toBe(dir)
    expect(plan.requiresConfirmation).toBe(true)
  })

  it('resolves from a nested working location to the monorepo root', () => {
    const dir = project({ 'pnpm-workspace.yaml': 'packages: []\n', 'packages/web/src/a.ts': '' })
    expect(detect(join(dir, 'packages/web/src')).target).toBe(join(dir, 'presentations'))
  })

  it('does not climb past a git root that is not a monorepo', () => {
    const outer = project({ 'pnpm-workspace.yaml': 'packages: []\n', 'inner/.git/HEAD': '' })
    expect(detect(join(outer, 'inner')).target).toBe(join(outer, 'inner'))
  })

  it('uses a complete presentations/ app in a monorepo, and an app it is already inside', () => {
    const dir = project({ 'pnpm-workspace.yaml': 'packages: []\n' })
    bootstrap(join(dir, 'presentations'), { apply: true, confirmed: true })
    const fromRoot = detect(dir)
    expect(fromRoot.target).toBe(join(dir, 'presentations'))
    expect(fromRoot.missing).toEqual([])
    expect(fromRoot.requiresConfirmation).toBe(false)
    const inside = detect(join(dir, 'presentations'))
    expect(inside.target).toBe(join(dir, 'presentations'))
    expect(inside.reason).toMatch(/already inside/)
  })
})

describe('bootstrap', () => {
  it('copies nothing when a dry run is requested', () => {
    const dir = project()
    const result = bootstrap(dir)
    expect(result.copied.length).toBeGreaterThan(30)
    expect(result.applied).toBe(false)
    expect(readdirSync(dir)).toEqual([])
  })

  it('does nothing when every anchor is present', () => {
    const dir = fullApp()
    const before = tree(dir)
    const result = bootstrap(dir, { apply: true, confirmed: true })
    expect(result.copied).toEqual([])
    expect(result.applied).toBe(false)
    expect(tree(dir)).toEqual(before)
  })

  it('refuses to write into a non-empty project until the target is confirmed', () => {
    const dir = project({ 'README.md': 'keep me' })
    const blocked = bootstrap(dir, { apply: true })
    expect(blocked.blocked).toContain(dir)
    expect(tree(dir)).toEqual({ 'README.md': tree(dir)['README.md'] })
    const done = bootstrap(dir, { apply: true, confirmed: true })
    expect(done.applied).toBe(true)
    expect(existsSync(join(dir, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
  })

  it('writes a monorepo app under presentations/ and leaves the root untouched', () => {
    const dir = project({ 'package.json': JSON.stringify({ name: 'root', workspaces: ['packages/*'] }), 'packages/a/index.js': 'a' })
    const before = tree(dir)
    bootstrap(dir, { apply: true, confirmed: true })
    const after = tree(dir)
    for (const [path, hash] of Object.entries(before)) expect(after[path]).toBe(hash)
    expect(existsSync(join(dir, 'presentations/package.json'))).toBe(true)
    expect(existsSync(join(dir, 'src'))).toBe(false)
    expect(detectAnchors(join(dir, 'presentations'))).toEqual({ build: true, kit: true, index: true })
  })

  it.each([
    [['kit'], ['build', 'index']],
    [['index'], ['build', 'kit']],
    [['kit', 'index'], ['build']],
    [['build'], ['kit', 'index']],
    [['build', 'kit'], ['index']],
    [['build', 'index'], ['kit']],
  ])('adds only the missing anchors when %j are removed, preserving the rest', (removed, kept) => {
    const dir = fullApp()
    const groups: Record<string, string[]> = {
      kit: ['src/presentation-kit'],
      index: ['src/presentations', 'src/Router.tsx', 'src/Landing.tsx', 'src/route.ts'],
      build: ['vite.config.ts'],
    }
    for (const anchor of removed) for (const path of groups[anchor]) rmSync(join(dir, path), { recursive: true, force: true })
    if (removed.includes('build')) {
      const pkg = JSON.parse(read(join(dir, 'package.json')))
      delete pkg.scripts.build
      writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
    }
    writeFileSync(join(dir, 'notes.txt'), 'unrelated')
    const before = tree(dir)
    const result = bootstrap(dir, { apply: true, confirmed: true })
    expect(result.missing.sort()).toEqual([...removed].sort())
    for (const rel of result.copied) expect(anchorOf(rel)).toMatch(new RegExp(`^(${removed.join('|')}|tooling)$`))
    const after = tree(dir)
    for (const [path, hash] of Object.entries(before)) {
      if (path === 'package.json' && removed.includes('build')) continue
      expect(after[path], path).toBe(hash)
    }
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    for (const anchor of kept) expect(result.copied.filter((rel) => anchorOf(rel) === anchor)).toEqual([])
  })

  it('merges only the missing dependencies and scripts into an existing package.json', () => {
    const dir = project({
      'package.json': JSON.stringify({ name: 'mine', scripts: { build: 'tsc', custom: 'x' }, dependencies: { react: '^18.0.0', left: '1' }, devDependencies: { vite: '^5.0.0' } }),
      'vite.config.ts': 'export default {}',
    })
    const result = bootstrap(dir, { apply: true, confirmed: true })
    const pkg = JSON.parse(read(join(dir, 'package.json')))
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.dependencies.left).toBe('1')
    expect(pkg.devDependencies.vite).toBe('^5.0.0')
    expect(pkg.scripts.build).toBe('tsc')
    expect(pkg.scripts.custom).toBe('x')
    expect(pkg.dependencies['motion']).toBeTruthy()
    expect(pkg.devDependencies['playwright']).toBeTruthy()
    expect(result.addedDependencies?.dependencies).toContain('motion')
    expect(result.addedDependencies?.dependencies).not.toContain('react')
  })

  it('never overwrites an existing file and reports it instead', () => {
    const dir = project({ 'src/main.tsx': 'mine', 'package.json': JSON.stringify({ name: 'x' }) })
    const result = bootstrap(dir, { apply: true, confirmed: true })
    expect(read(join(dir, 'src/main.tsx'))).toBe('mine')
    expect(result.skippedExisting).toContain('src/main.tsx')
  })
})

describe('presentation creation', () => {
  it('creates a self-contained folder and registers it', () => {
    const dir = fullApp()
    const created = createPresentation(dir, 'my-talk', 'My "Great" Talk')
    expect(created.folder).toBe('src/presentations/my-talk')
    for (const file of ['Talk.tsx', 'entities.ts', 'outline.ts', 'style.css', 'steps/index.ts', 'steps/scene.tsx']) {
      expect(existsSync(join(dir, 'src/presentations/my-talk', file)), file).toBe(true)
    }
    const registry = read(join(dir, 'src/presentations/index.ts'))
    expect(registry).toContain("slug: 'my-talk'")
    expect(registry).toContain("import('./my-talk/Talk')")
    expect(read(join(dir, 'src/presentations/my-talk/Talk.tsx'))).toContain('title="My \\"Great\\" Talk"')
    expect(read(join(dir, 'src/presentations/my-talk/Talk.tsx'))).not.toContain('__SLUG__')
  })

  it('keeps existing presentations and entries intact and refuses duplicates', () => {
    const dir = fullApp()
    const starterBefore = tree(join(dir, 'src/presentations/starter'))
    createPresentation(dir, 'second', 'Second')
    createPresentation(dir, 'third', 'Third')
    expect(tree(join(dir, 'src/presentations/starter'))).toEqual(starterBefore)
    const registry = read(join(dir, 'src/presentations/index.ts'))
    for (const slug of ['starter', 'second', 'third']) expect(registry).toContain(`slug: '${slug}'`)
    const snapshot = tree(dir)
    expect(() => createPresentation(dir, 'second', 'Again')).toThrow(/already exists/)
    expect(() => createPresentation(dir, 'Bad Slug', 'x')).toThrow(/invalid slug/)
    expect(tree(dir)).toEqual(snapshot)
  })
})

describe('template resolution', () => {
  it('resolves templates from the skill directory regardless of the working directory', () => {
    expect(skillDir).toBe(join(root, 'skills', 'presentation'))
    expect(bootstrapDir).toBe(join(skillDir, 'templates', 'bootstrap'))
    expect(presentationTemplateDir).toBe(join(skillDir, 'templates', 'presentation'))
    const elsewhere = project({ 'src/presentations/index.ts': '// decoy', 'templates/bootstrap/package.json': '{"decoy":true}' })
    const dir = project()
    const output = execFileSync('node', [join(skillDir, 'scripts/scaffold.mjs'), 'bootstrap', '--dir', dir, '--apply'], {
      cwd: elsewhere,
      encoding: 'utf8',
    })
    expect(JSON.parse(output).applied).toBe(true)
    expect(JSON.parse(read(join(dir, 'package.json'))).decoy).toBeUndefined()
    const created = execFileSync(
      'node',
      [join(skillDir, 'scripts/scaffold.mjs'), 'presentation', '--dir', dir, '--slug', 'cwd-free', '--title', 'Cwd free'],
      { cwd: elsewhere, encoding: 'utf8' },
    )
    expect(JSON.parse(created).slug).toBe('cwd-free')
    expect(read(join(dir, 'src/presentations/cwd-free/Talk.tsx'))).toContain('cwd-free')
  })
})

describe('bootstrap template contract', () => {
  const template = (path: string) => join(bootstrapDir, path)
  const pkg = JSON.parse(read(template('package.json')))
  const lock = JSON.parse(read(template('package-lock.json')))

  it('declares the complete dependency set and ships lock data for it', () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint',
      'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]) {
      expect(deps, name).toHaveProperty(name)
      expect(lock.packages[''].dependencies?.[name] ?? lock.packages[''].devDependencies?.[name], name).toBe(deps[name])
      expect(lock.packages[`node_modules/${name}`], name).toBeTruthy()
    }
  })

  it('does not require Tailwind or any styling framework', () => {
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((name) => /tailwind|styled|emotion|bootstrap|@mui|postcss|sass/.test(name))).toEqual([])
    expect(read(template('vite.config.ts'))).not.toMatch(/tailwind/i)
    expect(JSON.stringify(lock)).not.toMatch(/tailwindcss/)
  })

  it('declares build, verify and inspect scripts', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.verify).toContain('scripts/verify.mjs')
    expect(pkg.scripts.inspect).toContain('scripts/inspect-presentation.mjs')
  })

  it('holds all three anchors and the verification scripts', () => {
    expect(detectAnchors(bootstrapDir)).toEqual({ build: true, kit: true, index: true })
    const files = templateFiles()
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/verify.config.json', 'src/presentations/index.ts', '.gitignore']) {
      expect(files, file).toContain(file)
    }
    expect(read(template('.gitignore'))).toContain('.inspection')
  })

  it.each([
    ['hex colors', /#[0-9a-fA-F]{3,8}\b/],
    ['functional colors', /\b(?:rgba?|hsla?|oklch)\(/],
    ['fonts', /font-?family|font-size|font-weight/],
    ['shadows', /box-?shadow/],
    ['borders and radii', /border|radius/],
    ['backgrounds', /background/],
    ['spacing', /padding|margin|gap\s*:/],
    ['theme tokens', /--[a-z][\w-]*\s*:/],
  ])('ships no %s in its styles', (_label, pattern) => {
    const styles = [...templateFiles().map((f: string) => join(bootstrapDir, f)), ...readdirSync(presentationTemplateDir, { recursive: true }).map((f: string | Buffer) => join(presentationTemplateDir, String(f)))]
      .filter((file) => file.endsWith('.css'))
    expect(styles.length).toBeGreaterThan(1)
    for (const file of styles) {
      const code = read(file).replace(/\/\*[\s\S]*?\*\//g, '')
      expect(code, file).not.toMatch(pattern)
    }
  })

  it('registers a starter presentation that is exactly the rendered presentation template', () => {
    const starter = join(bootstrapDir, 'src/presentations/starter')
    for (const rel of readdirSync(presentationTemplateDir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => relative(presentationTemplateDir, join(e.parentPath, e.name)))) {
      const rendered = renderTemplate(read(join(presentationTemplateDir, rel)), { __SLUG__: 'starter', __TITLE__: 'Starter' })
      expect(read(join(starter, rel)), rel).toBe(rendered)
    }
    const config = JSON.parse(read(template('scripts/verify.config.json'))).reference
    expect(config.slug).toBe('starter')
    expect(read(template('src/presentations/index.ts'))).toContain("slug: 'starter'")
  })
})

function files(dir: string, skip: (rel: string) => boolean): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)))
    .filter((rel) => !skip(rel))
    .sort()
}

describe('canonical sources stay aligned with the bootstrap template', () => {
  const same = (a: string, b: string) => Buffer.compare(readFileSync(a), readFileSync(b)) === 0

  it('keeps every non-test kit file byte-identical, with no missing or extra files', () => {
    const canonical = join(root, 'src/presentation-kit')
    const copy = join(bootstrapDir, 'src/presentation-kit')
    const isTest = (rel: string) => rel.split('/').includes('__tests__') || /\.test\.[tj]sx?$/.test(rel)
    const left = files(canonical, isTest)
    expect(files(copy, () => false)).toEqual(left)
    for (const rel of left) expect(same(join(canonical, rel), join(copy, rel)), rel).toBe(true)
  })

  it('keeps the verification and inspection scripts byte-identical', () => {
    const scripts = ['verify.mjs', 'inspect-presentation.mjs', ...files(join(root, 'scripts/lib'), () => false).map((f) => `lib/${f}`)]
    for (const rel of scripts) {
      expect(same(join(root, 'scripts', rel), join(bootstrapDir, 'scripts', rel)), rel).toBe(true)
    }
    expect(files(join(bootstrapDir, 'scripts/lib'), () => false)).toEqual(files(join(root, 'scripts/lib'), () => false))
  })

  it('keeps the app shell identical (only host CSS, config and the registry contents differ)', () => {
    for (const rel of ['src/Router.tsx', 'src/Landing.tsx', 'src/route.ts', 'src/main.tsx', 'index.html', 'vite.config.ts', 'tsconfig.app.json', 'tsconfig.json', 'public/favicon.svg']) {
      expect(same(join(root, rel), join(bootstrapDir, rel)), rel).toBe(true)
    }
  })
})
