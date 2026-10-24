import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  BOOTSTRAP_DIR,
  PRESENTATION_TEMPLATE_DIR,
  SKILL_DIR,
  addRegistryEntry,
  createPresentation,
  detectAnchors,
  resolveTarget,
  scaffold,
} from '../../skills/presentation/scripts/presentation-tool.mjs'
import { ROOT, read, readJson, walk } from '../support/files.ts'

const dirs: string[] = []
const tmp = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'tool-'))
  dirs.push(dir)
  return dir
}
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

const put = (root: string, file: string, content = '') => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  writeFileSync(path.join(root, file), content)
}
const full = () => {
  const dir = tmp()
  cpSync(BOOTSTRAP_DIR, dir, { recursive: true })
  return dir
}

describe('the skill is distributable (M-79)', () => {
  const skill = read('skills/presentation/SKILL.md')

  it('has valid frontmatter naming the presentation skill', () => {
    const front = /^---\n([\s\S]*?)\n---\n/.exec(skill)![1]
    expect(front).toMatch(/^name: presentation$/m)
    expect(front.match(/^description: (.+)$/m)![1].length).toBeGreaterThan(40)
  })

  it('ships the bootstrap and presentation templates and the helper that SKILL.md names', () => {
    expect(SKILL_DIR).toBe(path.join(ROOT, 'skills', 'presentation'))
    for (const rel of ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'eslint.config.js', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'src/main.tsx', 'src/presentations/index.ts', 'src/presentations/starter/Talk.tsx', 'src/presentation-kit/index.ts']) {
      expect(existsSync(path.join(BOOTSTRAP_DIR, rel)), rel).toBe(true)
    }
    expect(readdirSync(PRESENTATION_TEMPLATE_DIR).sort()).toEqual(['Scene.tsx', 'Talk.tsx', 'entities.ts', 'steps.ts', 'style.css'])
    expect(existsSync(path.join(SKILL_DIR, 'scripts', 'presentation-tool.mjs'))).toBe(true)
  })
})

describe('bootstrap snapshot stays aligned with the canonical sources (M-41)', () => {
  const kitFiles = (dir: string) => walk(dir).map((f) => path.relative(dir, f)).sort()

  it('has the same kit file inventory and bytes in both directions', () => {
    const canonical = path.join(ROOT, 'src', 'presentation-kit')
    const snapshot = path.join(BOOTSTRAP_DIR, 'src', 'presentation-kit')
    expect(kitFiles(snapshot)).toEqual(kitFiles(canonical))
    for (const rel of kitFiles(canonical)) {
      expect(readFileSync(path.join(snapshot, rel), 'utf8'), rel).toBe(readFileSync(path.join(canonical, rel), 'utf8'))
    }
  })

  it('has byte-identical verify, inspect and helper scripts', () => {
    const lib = kitFiles(path.join(ROOT, 'scripts', 'lib'))
    expect(kitFiles(path.join(BOOTSTRAP_DIR, 'scripts', 'lib'))).toEqual(lib)
    const rels = ['verify.mjs', 'inspect-presentation.mjs', ...lib.map((f) => `lib/${f}`)]
    for (const rel of rels) {
      expect(readFileSync(path.join(BOOTSTRAP_DIR, 'scripts', rel), 'utf8'), rel).toBe(readFileSync(path.join(ROOT, 'scripts', rel), 'utf8'))
    }
  })

  it('is what the sync script would produce', () => {
    expect(() => execFileSync('node', ['scripts/sync-templates.mjs', '--check'], { cwd: ROOT, stdio: 'pipe' })).not.toThrow()
  })
})

describe('bootstrap manifest and lockfile (M-36)', () => {
  const pkg = JSON.parse(readFileSync(path.join(BOOTSTRAP_DIR, 'package.json'), 'utf8'))
  const lock = JSON.parse(readFileSync(path.join(BOOTSTRAP_DIR, 'package-lock.json'), 'utf8'))

  it('declares the complete runtime, build, lint and browser dependency set', () => {
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies, name).toHaveProperty(name)
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) {
      expect(pkg.devDependencies, name).toHaveProperty(name)
    }
    for (const script of ['build', 'lint', 'verify', 'inspect']) expect(pkg.scripts, script).toHaveProperty(script)
  })

  it('has lock data that agrees with the manifest', () => {
    const root = lock.packages['']
    expect({ ...root.dependencies, ...root.devDependencies }).toEqual({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) expect(lock.packages[`node_modules/${name}`], name).toBeTruthy()
  })

  it('matches the Playwright version of the root project', () => {
    expect(pkg.devDependencies.playwright).toBe(readJson('package.json').devDependencies.playwright)
  })
})

describe('anchor detection is contract-level (M-32)', () => {
  it('finds all three anchors in the bootstrap template', () => {
    expect(detectAnchors(BOOTSTRAP_DIR)).toEqual({ build: true, kit: true, index: true })
  })

  it('finds none in an empty or unrelated directory', () => {
    const dir = tmp()
    expect(detectAnchors(dir)).toEqual({ build: false, kit: false, index: false })
    put(dir, 'package.json', JSON.stringify({ name: 'x', scripts: { build: 'echo' } }))
    put(dir, 'src/index.ts', 'export const x = 1')
    expect(detectAnchors(dir)).toEqual({ build: false, kit: false, index: false })
  })

  it('tolerates renamed files, reformatting and extra dependencies', () => {
    const dir = full()
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    pkg.dependencies['left-pad'] = '1.0.0'
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg))
    cpSync(path.join(dir, 'src/presentation-kit'), path.join(dir, 'src/lib/engine'), { recursive: true })
    rmSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    cpSync(path.join(dir, 'src/Router.tsx'), path.join(dir, 'src/AppShell.tsx'))
    rmSync(path.join(dir, 'src/Router.tsx'))
    mkdirSync(path.join(dir, 'src/decks'), { recursive: true })
    cpSync(path.join(dir, 'src/presentations/index.ts'), path.join(dir, 'src/decks/registry.ts'))
    rmSync(path.join(dir, 'src/presentations/index.ts'))
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('reports each missing contract separately', () => {
    const noKit = full()
    rmSync(path.join(noKit, 'src/presentation-kit'), { recursive: true })
    expect(detectAnchors(noKit)).toMatchObject({ build: true, kit: false })
    const noStage = full()
    rmSync(path.join(noStage, 'src/presentation-kit/Stage.tsx'))
    expect(detectAnchors(noStage).kit).toBe(false)
    const noIndex = full()
    rmSync(path.join(noIndex, 'src/presentations/index.ts'))
    expect(detectAnchors(noIndex).index).toBe(false)
    const noRouter = full()
    rmSync(path.join(noRouter, 'src/Router.tsx'))
    expect(detectAnchors(noRouter).index).toBe(false)
    const noBuild = full()
    rmSync(path.join(noBuild, 'vite.config.ts'))
    expect(detectAnchors(noBuild).build).toBe(false)
  })
})

describe('target resolution (M-34, M-38, M-39, M-40, C-06)', () => {
  it('scaffolds an empty directory at its root with no confirmation', () => {
    const dir = tmp()
    expect(resolveTarget(dir)).toMatchObject({ target: dir, empty: true, missing: ['build', 'kit', 'index'], needsConfirmation: false })
  })

  it('ignores a lone .git directory when deciding a project is empty', () => {
    const dir = tmp()
    mkdirSync(path.join(dir, '.git'))
    expect(resolveTarget(dir).empty).toBe(true)
  })

  it('reuses a fully scaffolded app without scaffolding or confirmation', () => {
    expect(resolveTarget(full())).toMatchObject({ empty: false, missing: [], needsConfirmation: false })
  })

  it.each([
    ['workspaces', (d: string) => put(d, 'package.json', JSON.stringify({ name: 'm', workspaces: ['packages/*'] })), /workspaces/],
    ['pnpm-workspace.yaml', (d: string) => put(d, 'pnpm-workspace.yaml', 'packages:\n  - x'), /pnpm-workspace/],
    ['packages/', (d: string) => mkdirSync(path.join(d, 'packages')), /packages\//],
    ['apps/', (d: string) => mkdirSync(path.join(d, 'apps')), /apps\//],
  ])('puts a monorepo (%s signal) in a self-contained presentations/ app and asks for confirmation', (_name, setup, signal) => {
    const dir = tmp()
    put(dir, 'README.md', 'existing content')
    setup(dir)
    const result = resolveTarget(dir)
    expect(result.target).toBe(path.join(dir, 'presentations'))
    expect(result.monorepoSignal).toMatch(signal)
    expect(result.reason).toMatch(/monorepo/)
    expect(result.needsConfirmation).toBe(true)
    expect(result.missing).toEqual(['build', 'kit', 'index'])
  })

  it('treats a monorepo that only has the build anchor at its root as missing kit and index in presentations/', () => {
    const dir = tmp()
    put(dir, 'package.json', readFileSync(path.join(BOOTSTRAP_DIR, 'package.json'), 'utf8').replace('"scripts"', '"workspaces": ["packages/*"], "scripts"'))
    for (const f of ['vite.config.ts', 'tsconfig.json', 'tsconfig.app.json']) cpSync(path.join(BOOTSTRAP_DIR, f), path.join(dir, f))
    expect(detectAnchors(dir).build).toBe(true)
    const result = resolveTarget(dir)
    expect(result.target).toBe(path.join(dir, 'presentations'))
    expect(result.needsConfirmation).toBe(true)
  })

  it('prefers an existing presentations/ app over the monorepo root', () => {
    const dir = tmp()
    put(dir, 'pnpm-workspace.yaml', 'packages: []')
    cpSync(BOOTSTRAP_DIR, path.join(dir, 'presentations'), { recursive: true })
    const result = resolveTarget(dir)
    expect(result).toMatchObject({ target: path.join(dir, 'presentations'), missing: [], needsConfirmation: false })
  })

  it('completes a partial standalone scaffold at the root with confirmation', () => {
    const dir = full()
    rmSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    expect(resolveTarget(dir)).toMatchObject({ target: dir, missing: ['kit'], needsConfirmation: true })
  })
})

describe('scaffold writes only what is missing (M-33, M-35, M-39)', () => {
  it('materializes all three anchors into an empty directory', () => {
    const dir = tmp()
    const result = scaffold(dir)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(result.created).toEqual(expect.arrayContaining(['package.json', 'package-lock.json', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts', 'verify.config.json']))
    expect(result.skipped).toEqual([])
  })

  it('adds only the missing anchor and never overwrites existing files', () => {
    const dir = full()
    rmSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    put(dir, 'vite.config.ts', '// customised\n')
    put(dir, 'src/presentations/index.ts', readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8') + '\n// mine\n')
    put(dir, 'notes.md', 'unrelated')
    const before = (f: string) => readFileSync(path.join(dir, f), 'utf8')
    const snapshot = Object.fromEntries(['vite.config.ts', 'src/presentations/index.ts', 'package.json', 'package-lock.json', 'notes.md'].map((f) => [f, before(f)]))
    const result = scaffold(dir, ['kit'])
    expect(result.created.every((f: string) => f.startsWith('src/presentation-kit/'))).toBe(true)
    expect(result.merged).toEqual([])
    for (const [file, content] of Object.entries(snapshot)) expect(before(file), file).toBe(content)
    expect(detectAnchors(dir).kit).toBe(true)
  })

  it('merges only missing dependencies and scripts into an existing manifest, keeping the rest', () => {
    const dir = tmp()
    put(dir, 'package.json', JSON.stringify({ name: 'host', version: '9.9.9', scripts: { build: 'custom-build', test: 'jest' }, dependencies: { react: '^18.0.0' } }))
    put(dir, 'package-lock.json', '{"lockfileVersion":3}')
    const result = scaffold(dir, ['build'])
    const merged = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(result.merged).toEqual(['package.json'])
    expect(merged.name).toBe('host')
    expect(merged.version).toBe('9.9.9')
    expect(merged.scripts).toMatchObject({ build: 'custom-build', test: 'jest', verify: expect.any(String), inspect: expect.any(String) })
    expect(merged.dependencies.react).toBe('^18.0.0') // existing range wins
    for (const dep of ['react-dom', 'motion', 'lucide-react']) expect(merged.dependencies).toHaveProperty(dep)
    expect(merged.devDependencies).toHaveProperty('playwright')
    expect(readFileSync(path.join(dir, 'package-lock.json'), 'utf8')).toBe('{"lockfileVersion":3}') // not replaced by a mismatched lock
  })

  it('adds the missing dependencies even when only the kit and index anchors are scaffolded', () => {
    const dir = tmp()
    put(dir, 'package.json', JSON.stringify({ name: 'host', scripts: { build: 'vite build' }, dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' }, devDependencies: { vite: '^8.0.0', typescript: '~6.0.0' } }))
    put(dir, 'vite.config.ts', 'export default {}')
    put(dir, 'tsconfig.json', '{}')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: false, index: false })
    const result = scaffold(dir, ['kit', 'index'])
    const merged = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(result.merged).toContain('package.json')
    for (const dep of ['motion', 'lucide-react']) expect(merged.dependencies, dep).toHaveProperty(dep)
    expect(merged.devDependencies).toHaveProperty('playwright')
    expect(merged.dependencies.react).toBe('^19.0.0')
    expect(merged.scripts.build).toBe('vite build')
  })

  it('connects a pre-existing app entry to the router so new presentations are reachable', () => {
    const dir = tmp()
    put(dir, 'package.json', JSON.stringify({ name: 'host', scripts: { build: 'vite build' }, dependencies: { react: '^19', 'react-dom': '^19' }, devDependencies: { vite: '^8', typescript: '~6' } }))
    put(dir, 'vite.config.ts', 'export default {}')
    put(dir, 'tsconfig.json', '{}')
    put(dir, 'src/main.tsx', "import { createRoot } from 'react-dom/client'\nimport App from './App.tsx'\n\ncreateRoot(document.body).render(<App />)\n")
    const result = scaffold(dir, ['kit', 'index'])
    const main = readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')
    expect(result.merged).toContain('src/main.tsx')
    expect(main).toContain("import Router from './Router.tsx'")
    expect(main).toContain('<Router fallback={<App />} />')
    expect(main).not.toMatch(/render\(<App \/>\)/)
    expect(detectAnchors(dir).index).toBe(true)
  })

  it('reports a manual step when the existing entry cannot be wired automatically', () => {
    const dir = tmp()
    put(dir, 'package.json', JSON.stringify({ name: 'host' }))
    put(dir, 'src/main.tsx', "import './legacy.js'\n")
    const result = scaffold(dir, ['index'])
    expect(result.manual[0]).toMatch(/mount <Router \/>/)
    expect(readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toBe("import './legacy.js'\n")
  })

  it('is a no-op when everything is present', () => {
    const dir = full()
    const result = scaffold(dir)
    expect(result.created).toEqual([])
    expect(result.merged).toEqual([])
    expect(result.skipped.length).toBeGreaterThan(10)
  })

  it('does not leak any styling framework into the scaffold', () => {
    const dir = tmp()
    scaffold(dir)
    const all = walk(dir).map((f) => readFileSync(f, 'utf8')).join('\n')
    expect(all).not.toMatch(/tailwind/i)
    for (const css of walk(dir).filter((f) => f.endsWith('.css'))) {
      const rules = readFileSync(css, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      // only a neutral layout reset in the host CSS; presentation CSS starts empty
      if (!css.endsWith(path.join('src', 'index.css'))) expect(rules.trim(), css).toBe('')
      expect(rules, css).not.toMatch(/color|font|background|border|shadow/)
    }
  })
})

describe('addRegistryEntry handles equivalent registry layouts (M-42, M-43)', () => {
  const entry = (s: string) => /import\('\.\/new-one\/Talk\.tsx'\)/.test(s)

  it.each([
    ['inferred type, multi-line', "export const presentations = [\n  {\n    slug: 'a',\n    title: 'A',\n    load: () => import('./a/Talk.tsx'),\n  },\n]\n"],
    ['single line', "export const presentations: Entry[] = [{ slug: 'a', title: 'A', load: () => import('./a/Talk.tsx') }]\n"],
    ['no trailing comma', "export const presentations = [\n  { slug: 'a', title: 'A', load: () => import('./a/Talk.tsx') }\n]\n"],
    ['empty array', 'export const presentations: PresentationEntry[] = []\n'],
    ['empty multi-line array', 'export const presentations: PresentationEntry[] = [\n]\n'],
  ])('%s', (_name, source) => {
    const out = addRegistryEntry(source, 'new-one', 'New One')
    expect(entry(out)).toBe(true)
    if (source.includes("slug: 'a'")) expect(out).toContain("import('./a/Talk.tsx')")
    expect(() => new Function(out.replace(/export const (\w+)(: [\w[\]]+)?/, 'const $1').replace(/: Entry\[\]|: PresentationEntry\[\]/, ''))).not.toThrow()
    expect(() => addRegistryEntry(out, 'new-one', 'again')).toThrow(/already registered/)
  })
})

describe('creating a presentation (M-37, M-42, M-43)', () => {
  it('writes a self-contained folder from the skill templates and registers it', () => {
    const dir = full()
    const result = createPresentation(dir, 'my-talk', 'My Talk')
    expect(result.route).toBe('/my-talk')
    expect(result.created.sort()).toEqual(['entities.ts', 'Scene.tsx', 'steps.ts', 'Talk.tsx', 'style.css'].map((f) => `src/presentations/my-talk/${f}`).sort())
    expect(readFileSync(path.join(dir, 'src/presentations/my-talk/Talk.tsx'), 'utf8')).toContain('title={"My Talk"}')
    expect(readFileSync(path.join(dir, 'src/presentations/my-talk/Talk.tsx'), 'utf8')).toContain('<Presentation')
    expect(readFileSync(path.join(dir, 'src/presentations/my-talk/entities.ts'), 'utf8')).toContain('export const ENTITIES')
    const registry = readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'my-talk'")
    expect(registry).toContain("import('./my-talk/Talk.tsx')")
  })

  it('preserves existing registry entries and folders and keeps adding', () => {
    const dir = full()
    const before = readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    const starter = readFileSync(path.join(dir, 'src/presentations/starter/steps.ts'), 'utf8')
    createPresentation(dir, 'one', 'One')
    createPresentation(dir, 'two', 'Two')
    const after = readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    const entry = (text: string) => text.split(/\n(?=\s*\{\n\s*slug)/).filter((b) => b.includes("slug: '"))
    for (const b of entry(before)) expect(after).toContain(b.replace(/\n\]\n?$/, ''))
    expect(entry(after)).toHaveLength(3)
    expect(readFileSync(path.join(dir, 'src/presentations/starter/steps.ts'), 'utf8')).toBe(starter)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('refuses duplicate slugs, bad slugs and a missing registry without writing anything', () => {
    const dir = full()
    createPresentation(dir, 'dup', 'Dup')
    expect(() => createPresentation(dir, 'dup', 'Again')).toThrow(/already exists/)
    expect(() => createPresentation(dir, 'starter', 'Clash')).toThrow(/already exists/)
    expect(() => createPresentation(dir, 'Bad Slug', 'x')).toThrow(/slug/)
    const bare = tmp()
    expect(() => createPresentation(bare, 'x', 'x')).toThrow(/registry/)
    expect(existsSync(path.join(bare, 'src/presentations/x'))).toBe(false)
  })

  it('registers into a registry with a different name, location and shape, and imports the kit from where it is', () => {
    const dir = tmp()
    cpSync(BOOTSTRAP_DIR, dir, { recursive: true })
    mkdirSync(path.join(dir, 'src/decks'), { recursive: true })
    cpSync(path.join(dir, 'src/presentations/starter'), path.join(dir, 'src/decks/starter'), { recursive: true })
    rmSync(path.join(dir, 'src/presentations'), { recursive: true })
    cpSync(path.join(dir, 'src/presentation-kit'), path.join(dir, 'src/engine'), { recursive: true })
    rmSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    put(dir, 'src/decks/registry.ts', "export const decks = [{ slug: 'starter', title: 'S', load: () => import('./starter/Talk.tsx') }]\n")
    const result = createPresentation(dir, 'moved', 'Moved')
    expect(result.registry).toBe('src/decks/registry.ts')
    expect(readFileSync(path.join(dir, 'src/decks/registry.ts'), 'utf8')).toBe(
      "export const decks = [{ slug: 'starter', title: 'S', load: () => import('./starter/Talk.tsx') }, { slug: 'moved', title: \"Moved\", load: () => import('./moved/Talk.tsx') }]\n",
    )
    expect(readFileSync(path.join(dir, 'src/decks/moved/Talk.tsx'), 'utf8')).toContain("from '../../engine/index.ts'")
  })

  it('escapes titles so quotes and comment terminators cannot break the generated files', () => {
    const dir = full()
    const title = 'A "quoted" title */ with `ticks` and \\ slashes'
    createPresentation(dir, 'tricky', title)
    const talk = readFileSync(path.join(dir, 'src/presentations/tricky/Talk.tsx'), 'utf8')
    expect(talk).toContain(`title={${JSON.stringify(title)}}`)
    expect(readFileSync(path.join(dir, 'src/presentations/tricky/style.css'), 'utf8')).not.toContain('*/ with')
    expect(readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')).toContain(`title: ${JSON.stringify(title)}`)
  })

  it('writes nothing when the registry shape cannot be understood', () => {
    const dir = full()
    put(dir, 'src/presentations/index.ts', "export const byName = { a: { slug: 'a', title: 'A', load: () => import('./a/Talk.tsx') } }\n")
    expect(() => createPresentation(dir, 'nope', 'Nope')).toThrow(/array/)
    expect(existsSync(path.join(dir, 'src/presentations/nope'))).toBe(false)
  })

  it('resolves the template from the skill directory regardless of the caller cwd', () => {
    const dir = full()
    const elsewhere = tmp()
    const out = execFileSync('node', [path.join(SKILL_DIR, 'scripts/presentation-tool.mjs'), 'new', dir, 'from-elsewhere', '--title', 'From Elsewhere'], { cwd: elsewhere, encoding: 'utf8' })
    expect(JSON.parse(out).route).toBe('/from-elsewhere')
    expect(existsSync(path.join(dir, 'src/presentations/from-elsewhere/Scene.tsx'))).toBe(true)
  })
})
