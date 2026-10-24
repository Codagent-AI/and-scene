import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ANCHORS, BOOTSTRAP_DIR, PRESENTATION_TEMPLATE_DIR, SKILL_DIR, anchorOf, createPresentation, detectAnchors, detectMonorepo,
  ensureDependencies, resolveTarget, scaffold,
} from '../../skills/presentation/scripts/scaffold.mjs'

const ROOT = path.resolve(__dirname, '../..')
const tmp = () => mkdtempSync(path.join(tmpdir(), 'scaffold-'))
const put = (dir: string, rel: string, text = '') => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), text)
}
const walk = (dir: string, base = dir): string[] =>
  readdirSync(dir).flatMap((n) => {
    const f = path.join(dir, n)
    return statSync(f).isDirectory() ? walk(f, base) : [path.relative(base, f)]
  })

const pkg = (extra: object = {}) =>
  JSON.stringify({
    name: 'x',
    scripts: { build: 'vite build' },
    dependencies: { react: '^19' },
    devDependencies: { vite: '^8', typescript: '^6' },
    ...extra,
  })
const withBuild = (dir: string, extra: object = {}) => {
  put(dir, 'package.json', pkg(extra))
  put(dir, 'vite.config.ts', 'export default {}')
}
// Cosmetically different names/formatting from the shipped scaffold, same contract.
const withKit = (dir: string, folder = 'src/deck-engine') => {
  put(dir, `${folder}/Presentation.tsx`, 'export const Presentation = () => null\n')
  put(dir, `${folder}/Host.tsx`, "import { AnimatePresence } from 'motion/react'\nexport const Host = AnimatePresence\n")
}
const withIndex = (dir: string, file = 'src/talks/registry.ts') =>
  put(dir, file, "export const all = [{ slug: 'a', title: 'A', load: () => import('./a') }]\n")

describe('anchor detection (contract-level)', () => {
  it('classifies all eight combinations of build, kit, and index', async () => {
    expect(ANCHORS).toHaveLength(3)
    for (let mask = 0; mask < 8; mask++) {
      const dir = tmp()
      const want = { build: !!(mask & 1), kit: !!(mask & 2), index: !!(mask & 4) }
      if (want.build) withBuild(dir)
      if (want.kit) withKit(dir)
      if (want.index) withIndex(dir)
      expect(await detectAnchors(dir), String(mask)).toEqual(want)
    }
  })

  it.each([['standalone', false], ['monorepo', true]])('resolves every combination to the right target and missing set (%s)', async (_name, monorepo) => {
    for (let mask = 0; mask < 8; mask++) {
      const dir = tmp()
      const want = { build: !!(mask & 1), kit: !!(mask & 2), index: !!(mask & 4) }
      if (want.build) withBuild(dir, monorepo ? { workspaces: ['packages/*'] } : {})
      else if (monorepo) put(dir, 'pnpm-workspace.yaml', 'packages:\n  - packages/*\n')
      if (want.kit) withKit(dir)
      if (want.index) withIndex(dir)
      const report = await resolveTarget(dir)
      const presentationApp = want.kit || want.index
      // a kit or index makes the directory a presentation app: add only what is missing, in place.
      // Otherwise a monorepo gets presentations/ and a standalone project scaffolds at its root.
      const target = presentationApp || !monorepo ? dir : path.join(dir, 'presentations')
      expect(report.target, `${mask}`).toBe(target)
      expect(report.missing, `${mask}`).toEqual(target === dir ? ANCHORS.filter((a) => !want[a as keyof typeof want]) : ANCHORS)
      expect(report.needsConfirmation, `${mask}`).toBe(!(want.kit && want.index) && report.projectNonEmpty)
    }
  })

  it('ignores cosmetic differences: names, formatting, extra dependencies', async () => {
    const dir = tmp()
    withBuild(dir, { dependencies: { react: '^19', 'left-pad': '1', tailwindcss: '4' } })
    put(dir, 'src/zzz/Presentation.tsx', 'export default function Presentation() { return null }')
    put(dir, 'src/zzz/stage.tsx', "import {AnimatePresence} from 'motion/react'; export const S = AnimatePresence")
    put(dir, 'src/whatever/talks.ts', "export const x=[{slug:'a',load:()=>import('./a')}]")
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect((await resolveTarget(dir)).missing).toEqual([])
  })

  it('does not take a presentation component without a stage host for a scene kit', async () => {
    const dir = tmp()
    put(dir, 'src/a/Presentation.tsx', 'export const Presentation = () => null')
    expect((await detectAnchors(dir)).kit).toBe(false)
  })

  it('requires a working build script, vite, react, typescript, and a vite config', async () => {
    for (const mutate of [
      (d: string) => put(d, 'package.json', pkg({ scripts: {} })),
      (d: string) => put(d, 'package.json', pkg({ devDependencies: { typescript: '6' } })),
      (d: string) => put(d, 'package.json', pkg({ dependencies: {} })),
      (d: string) => put(d, 'package.json', '{ not json'),
    ]) {
      const dir = tmp()
      withBuild(dir)
      mutate(dir)
      expect((await detectAnchors(dir)).build).toBe(false)
    }
    const dir = tmp()
    put(dir, 'package.json', pkg())
    expect((await detectAnchors(dir)).build).toBe(false)
  })

  it('detects the shipped bootstrap template as fully scaffolded', async () => {
    expect(await detectAnchors(BOOTSTRAP_DIR)).toEqual({ build: true, kit: true, index: true })
  })
})

describe('target resolution', () => {
  it('scaffolds an empty directory at its root without asking', async () => {
    const dir = tmp()
    const r = await resolveTarget(dir)
    expect([r.target, r.missing, r.needsConfirmation, r.monorepo, r.projectNonEmpty]).toEqual([dir, ANCHORS, false, false, false])
  })

  it('treats each monorepo signal independently: package.json workspaces (array and object), pnpm-workspace.yaml, packages/, apps/', async () => {
    const setups: Record<string, (d: string) => void> = {
      'workspaces array': (d) => put(d, 'package.json', JSON.stringify({ workspaces: ['a/*'] })),
      'workspaces object': (d) => put(d, 'package.json', JSON.stringify({ workspaces: { packages: ['a/*'] } })),
      'pnpm-workspace.yaml': (d) => put(d, 'pnpm-workspace.yaml', 'packages:\n  - a\n'),
      'packages dir': (d) => put(d, 'packages/lib/index.ts', ''),
      'apps dir': (d) => put(d, 'apps/web/index.ts', ''),
    }
    for (const [name, setup] of Object.entries(setups)) {
      const dir = tmp()
      setup(dir)
      const r = await resolveTarget(dir)
      expect(r.monorepo, name).toBe(true)
      expect(r.target, name).toBe(path.join(dir, 'presentations'))
      expect((await detectMonorepo(dir)).length, name).toBe(1)
      expect(r.needsConfirmation, name).toBe(true)
    }
  })

  it('puts a self-contained app under presentations/ for a monorepo that only has a build setup', async () => {
    const dir = tmp()
    withBuild(dir, { workspaces: ['packages/*'] })
    put(dir, 'README.md', 'unrelated')
    const r = await resolveTarget(dir)
    expect(r.target).toBe(path.join(dir, 'presentations'))
    expect(r.anchors).toEqual({ build: false, kit: false, index: false })
    expect(r.missing).toEqual(ANCHORS)
    expect(r.needsConfirmation).toBe(true)
  })

  it('scaffolds standalone non-empty projects at the root, asking first when the kit/index are missing', async () => {
    const dir = tmp()
    withBuild(dir)
    put(dir, 'src/main.tsx', 'x')
    const r = await resolveTarget(dir)
    expect([r.target, r.monorepo, r.needsConfirmation, r.missing]).toEqual([dir, false, true, ['kit', 'index']])
  })

  it('asks for a non-empty project with no anchors at all, but not for an existing complete app', async () => {
    const dir = tmp()
    put(dir, 'notes.txt', 'hi')
    expect((await resolveTarget(dir)).needsConfirmation).toBe(true)
    const app = tmp()
    withBuild(app)
    withKit(app)
    withIndex(app)
    const r = await resolveTarget(app)
    expect([r.needsConfirmation, r.missing]).toEqual([false, []])
  })

  it('refuses to scaffold a non-empty project without --confirm, and writes nothing', () => {
    const dir = tmp()
    put(dir, 'notes.txt', 'keep me')
    const script = path.join(SKILL_DIR, 'scripts/scaffold.mjs')
    const refused = spawnSync(process.execPath, [script, 'apply', dir], { encoding: 'utf8' })
    expect(refused.status).toBe(2)
    expect(refused.stderr).toContain(`Target: ${dir}`)
    expect(refused.stderr).toContain('--confirm')
    expect(walk(dir)).toEqual(['notes.txt'])
    const accepted = spawnSync(process.execPath, [script, 'apply', dir, '--confirm'], { encoding: 'utf8' })
    expect(accepted.status).toBe(0)
    expect(existsSync(path.join(dir, 'src/presentation-kit/Stage.tsx'))).toBe(true)
    expect(readFileSync(path.join(dir, 'notes.txt'), 'utf8')).toBe('keep me')
    const empty = tmp()
    expect(spawnSync(process.execPath, [script, 'apply', empty], { encoding: 'utf8' }).status).toBe(0)
  })

  it('reuses an existing presentation app, at the root or in presentations/, even in a monorepo', async () => {
    const mono = tmp()
    put(mono, 'package.json', JSON.stringify({ workspaces: ['presentations'] }))
    withBuild(path.join(mono, 'presentations'))
    withKit(path.join(mono, 'presentations'))
    const nested = await resolveTarget(mono)
    expect(nested.target).toBe(path.join(mono, 'presentations'))
    expect(nested.missing).toEqual(['index'])
    const rootApp = tmp()
    put(rootApp, 'package.json', JSON.stringify({ workspaces: ['x'] }))
    withIndex(rootApp)
    expect((await resolveTarget(rootApp)).target).toBe(rootApp)
  })

  it('does not count a lone .git directory as project content', async () => {
    const dir = tmp()
    mkdirSync(path.join(dir, '.git'))
    expect((await resolveTarget(dir)).projectNonEmpty).toBe(false)
  })
})

describe('non-destructive scaffolding', () => {
  it('maps template files to anchors', () => {
    expect(anchorOf('src/presentation-kit/Stage.tsx')).toBe('kit')
    expect(anchorOf('src/presentations/index.ts')).toBe('index')
    expect(anchorOf('src/router.ts')).toBe('index')
    expect(anchorOf('package.json')).toBe('build')
    expect(anchorOf('scripts/verify.mjs')).toBe('build')
    expect(new Set(walk(BOOTSTRAP_DIR).map(anchorOf))).toEqual(new Set(ANCHORS))
  })

  it('full scaffold writes all three anchors into an empty directory', async () => {
    const dir = tmp()
    const result = await scaffold(dir)
    expect(result.skipped).toEqual([])
    expect(result.written.sort()).toEqual(walk(BOOTSTRAP_DIR).sort())
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('partial scaffold adds only the missing anchors and leaves existing files byte-identical', async () => {
    const dir = tmp()
    withBuild(dir)
    put(dir, 'src/main.tsx', 'SENTINEL main')
    put(dir, 'README.md', 'SENTINEL readme')
    put(dir, 'src/presentations/index.ts', 'SENTINEL index')
    const before = Object.fromEntries(walk(dir).map((f) => [f, readFileSync(path.join(dir, f), 'utf8')]))
    const { written, skipped } = await scaffold(dir, ['kit'])
    expect(written.every((f) => f.startsWith('src/presentation-kit/'))).toBe(true)
    expect(written.length).toBeGreaterThan(5)
    expect(skipped).toEqual([])
    for (const [f, text] of Object.entries(before)) {
      if (f === 'package.json') continue
      expect(readFileSync(path.join(dir, f), 'utf8'), f).toBe(text)
    }
    expect((await detectAnchors(dir)).kit).toBe(true)
  })

  it('never overwrites a file that already exists, even for a requested anchor', async () => {
    const dir = tmp()
    put(dir, 'src/presentation-kit/types.ts', 'MINE')
    const { written, skipped } = await scaffold(dir, ['kit'])
    expect(skipped).toEqual(['src/presentation-kit/types.ts'])
    expect(written).not.toContain('src/presentation-kit/types.ts')
    expect(readFileSync(path.join(dir, 'src/presentation-kit/types.ts'), 'utf8')).toBe('MINE')
  })

  it('adds missing dependencies to an existing package.json without touching present ones', async () => {
    const dir = tmp()
    put(dir, 'package.json', JSON.stringify({ name: 'host', scripts: { build: 'x', verify: 'mine' }, dependencies: { react: '18.0.0', zod: '1' }, devDependencies: { vite: '7' } }))
    const added = await ensureDependencies(dir)
    const out = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(out.dependencies.react).toBe('18.0.0')
    expect(out.dependencies.zod).toBe('1')
    expect(out.devDependencies.vite).toBe('7')
    expect(out.scripts.verify).toBe('mine')
    expect(out.scripts.inspect).toContain('inspect-presentation')
    for (const dep of ['motion', 'lucide-react', 'react-dom', 'typescript', 'playwright', 'eslint', '@types/react', '@types/react-dom', '@types/node', '@vitejs/plugin-react']) {
      expect(added, dep).toContain(dep)
      expect({ ...out.dependencies, ...out.devDependencies }[dep], dep).toBeTruthy()
    }
    expect(added).not.toContain('react')
    expect(added).not.toContain('vite')
    expect(await ensureDependencies(dir)).toEqual([])
  })

  it('keeps an existing lockfile untouched when the project already has a package.json', async () => {
    const dir = tmp()
    withBuild(dir)
    put(dir, 'package-lock.json', 'MY LOCK')
    await scaffold(dir, ['build'])
    expect(readFileSync(path.join(dir, 'package-lock.json'), 'utf8')).toBe('MY LOCK')
  })

  it('resolves templates from the skill directory regardless of the working directory', () => {
    expect(BOOTSTRAP_DIR).toBe(path.join(SKILL_DIR, 'templates/bootstrap'))
    expect(PRESENTATION_TEMPLATE_DIR).toBe(path.join(SKILL_DIR, 'templates/presentation'))
    expect(SKILL_DIR).toBe(path.join(ROOT, 'skills/presentation'))
    const elsewhere = tmp()
    const out = execFileSync(process.execPath, [path.join(SKILL_DIR, 'scripts/scaffold.mjs'), 'apply', elsewhere], {
      cwd: tmp(),
      encoding: 'utf8',
    })
    expect(JSON.parse(out).written.length).toBeGreaterThan(20)
    expect(existsSync(path.join(elsewhere, 'src/presentation-kit/Stage.tsx'))).toBe(true)
  })
})

describe('create a presentation', () => {
  it('writes a self-contained folder with its own CSS and appends one registry entry', async () => {
    const dir = tmp()
    await scaffold(dir)
    const registryFile = path.join(dir, 'src/presentations/index.ts')
    const before = readFileSync(registryFile, 'utf8')
    const starterBefore = walk(path.join(dir, 'src/presentations/starter')).map((f) => readFileSync(path.join(dir, 'src/presentations/starter', f), 'utf8'))
    await createPresentation(dir, 'my-talk', 'My "Talk"')
    const after = readFileSync(registryFile, 'utf8')
    expect(after).toContain("slug: 'starter'")
    expect(after.match(/slug: 'my-talk'/g)).toHaveLength(1)
    expect(after).toContain("import('./my-talk/Talk.tsx')")
    expect(after.startsWith(before.slice(0, before.indexOf('\n]')))).toBe(true)
    const folder = path.join(dir, 'src/presentations/my-talk')
    expect(walk(folder).sort()).toEqual(walk(PRESENTATION_TEMPLATE_DIR).sort())
    expect(readFileSync(path.join(folder, 'Talk.tsx'), 'utf8')).toContain("import './talk.css'")
    expect(readFileSync(path.join(folder, 'Talk.tsx'), 'utf8')).toContain('title="My Talk"')
    expect(readFileSync(path.join(folder, 'talk.css'), 'utf8')).toContain('.p-my-talk ')
    for (const f of walk(folder)) expect(readFileSync(path.join(folder, f), 'utf8'), f).not.toMatch(/\{\{(SLUG|TITLE)\}\}/)
    expect(walk(path.join(dir, 'src/presentations/starter')).map((f) => readFileSync(path.join(dir, 'src/presentations/starter', f), 'utf8'))).toEqual(starterBefore)
    expect(walk(path.join(dir, 'src/presentation-kit')).some((f) => f.endsWith('.css'))).toBe(false)
  })

  it('keeps every earlier entry and loader when several are added', async () => {
    const dir = tmp()
    await scaffold(dir)
    await createPresentation(dir, 'one', 'One')
    await createPresentation(dir, 'two', 'Two')
    const text = readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')
    const entries = [...text.matchAll(/slug: '([^']+)',\s+title: '([^']+)',\s+load: \(\) => import\('([^']+)'\)/g)].map((m) => m.slice(1))
    expect(entries).toEqual([
      ['starter', 'Starter presentation', './starter/Talk.tsx'],
      ['one', 'One', './one/Talk.tsx'],
      ['two', 'Two', './two/Talk.tsx'],
    ])
  })

  it('refuses invalid or duplicate slugs without changing anything', async () => {
    const dir = tmp()
    await scaffold(dir)
    const registry = path.join(dir, 'src/presentations/index.ts')
    const before = readFileSync(registry, 'utf8')
    await expect(createPresentation(dir, 'Bad Slug', 'x')).rejects.toThrow(/slug must be/)
    await expect(createPresentation(dir, '../escape', 'x')).rejects.toThrow(/slug must be/)
    await expect(createPresentation(dir, 'starter', 'x')).rejects.toThrow(/already/)
    expect(readFileSync(registry, 'utf8')).toBe(before)
    expect(existsSync(path.join(dir, 'src/presentations/Bad Slug'))).toBe(false)
  })
})

describe('bootstrap template contract', () => {
  const manifest = JSON.parse(readFileSync(path.join(BOOTSTRAP_DIR, 'package.json'), 'utf8'))
  const lock = JSON.parse(readFileSync(path.join(BOOTSTRAP_DIR, 'package-lock.json'), 'utf8'))
  const deps = { ...manifest.dependencies, ...manifest.devDependencies }

  it('declares the complete dependency set and locks every entry', () => {
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
      '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]) {
      expect(deps[name], name).toBeTruthy()
      expect(lock.packages[`node_modules/${name}`], `lock: ${name}`).toBeTruthy()
    }
    expect(manifest.scripts).toMatchObject({ build: 'tsc -b && vite build', verify: expect.any(String), inspect: expect.any(String), lint: expect.any(String) })
  })

  it('keeps the kit, scripts, and host router byte-aligned with the canonical copies, in both directions', () => {
    const pairs: [string, string][] = [
      ['src/presentation-kit', 'src/presentation-kit'],
      ['scripts/lib', 'scripts/lib'],
    ]
    for (const [canonical, template] of pairs) {
      const a = walk(path.join(ROOT, canonical))
      const b = walk(path.join(BOOTSTRAP_DIR, template))
      expect(b.sort(), canonical).toEqual(a.sort())
      for (const f of a) expect(readFileSync(path.join(BOOTSTRAP_DIR, template, f)).equals(readFileSync(path.join(ROOT, canonical, f))), f).toBe(true)
    }
    for (const f of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'src/router.ts', 'src/AppRouter.tsx', 'src/lazyPresentation.ts', 'src/Landing.tsx', 'src/main.tsx']) {
      expect(readFileSync(path.join(BOOTSTRAP_DIR, f)).equals(readFileSync(path.join(ROOT, f))), f).toBe(true)
    }
  })

  it('ships the starter presentation rendered from the presentation template', () => {
    for (const f of walk(PRESENTATION_TEMPLATE_DIR)) {
      const rendered = readFileSync(path.join(PRESENTATION_TEMPLATE_DIR, f), 'utf8').replace(/\{\{SLUG\}\}/g, 'starter').replace(/\{\{TITLE\}\}/g, 'Starter presentation')
      expect(readFileSync(path.join(BOOTSTRAP_DIR, 'src/presentations/starter', f), 'utf8'), f).toBe(rendered)
    }
  })
})
