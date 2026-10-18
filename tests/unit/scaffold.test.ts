import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BOOTSTRAP_DIR,
  PRESENTATION_TEMPLATE_DIR,
  anchorOf,
  detectAnchors,
  detectMonorepo,
  resolveTarget,
  scaffold,
} from '../../skills/presentation/scripts/scaffold.mjs'
import { createPresentation, listPresentations, registerPresentation } from '../../skills/presentation/scripts/new-presentation.mjs'
import { BOOTSTRAP, listFiles, read, ROOT, tmpDir, write } from './helpers'

const real = (p: string) => fs.realpathSync(p)

/** Copies the canonical app's kit/index/build files into a fixture, selectively. */
function seedBuild(dir: string, extra: Record<string, unknown> = {}) {
  write(dir, 'package.json', JSON.stringify({ name: 'host', scripts: { build: 'vite build' }, dependencies: { react: '^19.0.0' }, devDependencies: { vite: '^8.0.0', typescript: '^6.0.0' }, ...extra }, null, 2))
  write(dir, 'vite.config.ts', '// mine\nexport default {}\n')
  write(dir, 'index.html', '<div id="root"></div>')
}

function seedKit(dir: string, rename = false) {
  const kit = rename ? 'src/engine' : 'src/presentation-kit'
  // Renamed and reformatted, but each capability of the contract is really there.
  write(dir, `${kit}/contract.ts`, 'export interface Step {\n  id: string\n  Scene: () => null\n}\n')
  write(dir, `${kit}/host.tsx`, "import { AnimatePresence } from 'motion/react'\nexport const Host = () => <AnimatePresence>{null}</AnimatePresence>\n")
  write(dir, `${kit}/keys.ts`, "window.addEventListener('keydown', (e) => ['ArrowRight', 'ArrowLeft'].includes(e.key))\n")
  write(dir, `${kit}/fit.ts`, "window.addEventListener('resize', () => {})\nexport const fit = (s: number) => `scale(${s})`\n")
  write(dir, `${kit}/chrome.tsx`, 'const Toc = () => <nav>toc</nav>\nexport const Chrome = () => <><Toc /><p>caption</p></>\n')
}

function seedIndex(dir: string, file = 'src/routes/registry.ts') {
  write(dir, file, "export const all = [{ slug: 'a', title: 'A', load: () => import('./a') }]\n")
}

describe('detectAnchors', () => {
  it('finds nothing in an empty directory', () => {
    expect(detectAnchors(tmpDir())).toEqual({ build: false, kit: false, index: false })
  })

  it('recognizes each anchor by its contract, not by template names', () => {
    const d = tmpDir()
    seedBuild(d)
    seedKit(d, true)
    seedIndex(d)
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('tolerates extra dependencies and reformatted config', () => {
    const d = tmpDir()
    seedBuild(d, { dependencies: { react: '^19.0.0', lodash: '1', tailwindcss: '4' } })
    expect(detectAnchors(d).build).toBe(true)
  })

  it('does not mistake scattered tokens for a scene kit', () => {
    const d = tmpDir()
    write(d, 'src/contract.ts', 'export type Step = { id: string }\n')
    write(d, 'src/host.tsx', "import { AnimatePresence } from 'motion/react'\nexport const x = AnimatePresence\n")
    write(d, 'src/keys.ts', "export const k = ['ArrowRight']\n")
    write(d, 'src/chrome.tsx', 'export const Toc = () => null\nexport const s = (n: number) => `scale(${n})`\n')
    expect(detectAnchors(d).kit).toBe(false)
  })

  it.each([
    ['the Step/Scene contract', 'contract.ts'],
    ['the AnimatePresence stage', 'host.tsx'],
    ['keyboard navigation', 'keys.ts'],
    ['fit scaling', 'fit.ts'],
    ['the chrome', 'chrome.tsx'],
  ])('requires %s', (_what, file) => {
    const d = tmpDir()
    seedKit(d)
    expect(detectAnchors(d).kit).toBe(true)
    fs.rmSync(path.join(d, 'src/presentation-kit', file))
    expect(detectAnchors(d).kit).toBe(false)
  })

  it('needs a working build setup, not just a package.json', () => {
    const d = tmpDir()
    write(d, 'package.json', JSON.stringify({ scripts: {}, dependencies: { react: '1' } }))
    expect(detectAnchors(d).build).toBe(false)
  })

  it('recognizes the canonical app and the bootstrap template as fully scaffolded', () => {
    expect(detectAnchors(ROOT)).toEqual({ build: true, kit: true, index: true })
    expect(detectAnchors(BOOTSTRAP)).toEqual({ build: true, kit: true, index: true })
  })
})

describe('detectMonorepo', () => {
  it.each([
    ['package.json workspaces', (d: string) => write(d, 'package.json', '{"workspaces":["a"]}')],
    ['pnpm-workspace.yaml', (d: string) => write(d, 'pnpm-workspace.yaml', 'packages: []\n')],
    ['packages/', (d: string) => fs.mkdirSync(path.join(d, 'packages'))],
    ['apps/', (d: string) => fs.mkdirSync(path.join(d, 'apps'))],
  ])('detects %s', (_n, make) => {
    const d = tmpDir()
    make(d)
    expect(detectMonorepo(d)).toBe(true)
  })

  it('does not flag a standalone project', () => {
    const d = tmpDir()
    seedBuild(d)
    expect(detectMonorepo(d)).toBe(false)
  })
})

describe('resolveTarget', () => {
  it('empty directory: root, everything missing, no confirmation', () => {
    const d = tmpDir()
    const t = resolveTarget(d)
    expect(t).toMatchObject({ kind: 'empty', targetDir: d, missing: ['build', 'kit', 'index'], nonEmpty: false, needsConfirmation: false })
  })

  it('a directory holding only VCS metadata still counts as empty', () => {
    const d = tmpDir()
    fs.mkdirSync(path.join(d, '.git'))
    expect(resolveTarget(d).needsConfirmation).toBe(false)
  })

  it('non-empty standalone project with no anchors: root, needs confirmation', () => {
    const d = tmpDir()
    write(d, 'notes.txt', 'hi')
    expect(resolveTarget(d)).toMatchObject({ kind: 'standalone', targetDir: d, missing: ['build', 'kit', 'index'], needsConfirmation: true })
  })

  it('standalone project with only the build anchor: scaffolds the rest, confirmation first', () => {
    const d = tmpDir()
    seedBuild(d)
    expect(resolveTarget(d)).toMatchObject({ kind: 'standalone', missing: ['kit', 'index'], needsConfirmation: true })
  })

  it.each([
    ['package.json workspaces', (d: string) => seedBuild(d, { workspaces: ['packages/*'] })],
    ['pnpm-workspace.yaml', (d: string) => (seedBuild(d), write(d, 'pnpm-workspace.yaml', 'packages: []\n'))],
    ['packages/ layout', (d: string) => (seedBuild(d), write(d, 'packages/x/index.ts', ''))],
    ['apps/ layout', (d: string) => (seedBuild(d), write(d, 'apps/x/index.ts', ''))],
  ])('monorepo via %s: self-contained app in presentations/, build anchor of the root does not count', (_n, make) => {
    const d = tmpDir()
    make(d)
    const t = resolveTarget(d)
    expect(t).toMatchObject({ kind: 'monorepo', targetDir: path.join(d, 'presentations'), missing: ['build', 'kit', 'index'], needsConfirmation: true })
  })

  it('an already scaffolded app inside a monorepo is used as is, with no confirmation gate', () => {
    const d = tmpDir()
    seedBuild(d, { workspaces: ['x'] })
    seedKit(d)
    seedIndex(d)
    expect(resolveTarget(d)).toMatchObject({ kind: 'existing-app', targetDir: d, missing: [], needsConfirmation: false })
  })

  it('a scaffolded presentations/ app inside a monorepo root needs nothing', () => {
    const d = tmpDir()
    seedBuild(d, { workspaces: ['presentations'] })
    const app = path.join(d, 'presentations')
    seedBuild(app)
    seedKit(app)
    seedIndex(app)
    expect(resolveTarget(d)).toMatchObject({ kind: 'monorepo', targetDir: app, missing: [], needsConfirmation: false })
    expect(resolveTarget(app)).toMatchObject({ kind: 'existing-app', targetDir: app, missing: [] })
  })

  it('partial app: reports only the missing anchors', () => {
    const d = tmpDir()
    seedBuild(d)
    seedKit(d)
    expect(resolveTarget(d)).toMatchObject({ kind: 'existing-app', missing: ['index'], needsConfirmation: true })
    const e = tmpDir()
    seedBuild(e)
    seedIndex(e)
    expect(resolveTarget(e).missing).toEqual(['kit'])
  })
})

describe('anchorOf', () => {
  it('assigns every bootstrap file to exactly one anchor', () => {
    const owners = new Map<string, string[]>()
    for (const f of listFiles(BOOTSTRAP)) owners.set(anchorOf(f), [...(owners.get(anchorOf(f)) ?? []), f])
    expect([...owners.keys()].sort()).toEqual(['build', 'index', 'kit'])
    expect(owners.get('kit')!.every((f) => f.startsWith('src/presentation-kit/'))).toBe(true)
  })
})

describe('scaffold', () => {
  it('populates an empty directory completely, with lock data and the full dependency set', () => {
    const d = tmpDir()
    const r = scaffold(d)
    expect(r.written).toEqual(expect.arrayContaining(['package.json', 'package-lock.json', 'src/main.tsx', 'src/presentations/index.ts']))
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
    const pkg = JSON.parse(read(d, 'package.json'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks', 'playwright'])
      expect(deps, dep).toContain(dep)
    expect(fs.existsSync(path.join(d, 'package-lock.json'))).toBe(true)
    expect(pkg.name).toBe(path.basename(d))
  })

  it('refuses to write into a non-empty project without confirmation', () => {
    const d = tmpDir()
    write(d, 'keep.txt', 'mine')
    expect(() => scaffold(d)).toThrow(/needs user confirmation/)
    expect(fs.readdirSync(d)).toEqual(['keep.txt'])
  })

  it('build-only project: adds only kit and index, preserving existing bytes and declarations', () => {
    const d = tmpDir()
    seedBuild(d)
    write(d, 'src/main.tsx', '// my own entry\n')
    write(d, 'unrelated/readme.md', 'untouched')
    const before = { vite: read(d, 'vite.config.ts'), main: read(d, 'src/main.tsx'), html: read(d, 'index.html'), pkg: JSON.parse(read(d, 'package.json')) }
    const r = scaffold(d, { confirmed: true })
    expect(r.missing).toEqual(['kit', 'index'])
    expect(read(d, 'vite.config.ts')).toBe(before.vite)
    expect(read(d, 'src/main.tsx')).toBe(before.main)
    expect(r.skipped).toContain('src/main.tsx')
    expect(read(d, 'index.html')).toBe(before.html)
    expect(read(d, 'unrelated/readme.md')).toBe('untouched')
    expect(r.written).not.toContain('index.html')
    expect(r.written).not.toContain('package.json')
    const pkg = JSON.parse(read(d, 'package.json'))
    expect(pkg.scripts.build).toBe(before.pkg.scripts.build)
    expect(pkg.dependencies.react).toBe('^19.0.0')
    expect(pkg.devDependencies.vite).toBe('^8.0.0')
    expect(pkg.dependencies['lucide-react']).toBeDefined()
    expect(pkg.devDependencies.playwright).toBeDefined()
    expect(pkg.scripts.verify).toBeDefined()
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('monorepo: writes a self-contained app under presentations/ and leaves the root alone', () => {
    const d = tmpDir()
    seedBuild(d, { workspaces: ['presentations'] })
    write(d, 'packages/a/index.ts', 'x')
    const rootBefore = { pkg: read(d, 'package.json'), vite: read(d, 'vite.config.ts') }
    scaffold(d, { confirmed: true })
    expect(read(d, 'package.json')).toBe(rootBefore.pkg)
    expect(read(d, 'vite.config.ts')).toBe(rootBefore.vite)
    expect(fs.existsSync(path.join(d, 'src'))).toBe(false)
    expect(detectAnchors(path.join(d, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(fs.existsSync(path.join(d, 'presentations/package-lock.json'))).toBe(true)
  })

  it('does nothing for an already scaffolded app, without confirmation', () => {
    const d = tmpDir()
    scaffold(d)
    const before = listFiles(d)
    const r = scaffold(d)
    expect(r.written).toEqual([])
    expect(listFiles(d)).toEqual(before)
  })

  it('refuses to replace a package.json it cannot parse', () => {
    const d = tmpDir()
    write(d, 'package.json', '{ "name": "mine", ')
    expect(() => scaffold(d, { confirmed: true })).toThrow(/not valid JSON/)
    expect(read(d, 'package.json')).toBe('{ "name": "mine", ')
    expect(fs.readdirSync(d)).toEqual(['package.json'])
  })

  it('never overwrites existing files', () => {
    const d = tmpDir()
    seedBuild(d)
    seedKit(d)
    write(d, 'src/main.tsx', 'mine')
    scaffold(d, { confirmed: true })
    expect(read(d, 'src/main.tsx')).toBe('mine')
    expect(fs.existsSync(path.join(d, 'src/presentation-kit/Presentation.tsx'))).toBe(false)
  })
})

describe('template resolution', () => {
  it('resolves templates from the skill directory regardless of the caller cwd', () => {
    expect(BOOTSTRAP_DIR).toBe(real(path.join(ROOT, 'skills/presentation/templates/bootstrap')))
    expect(PRESENTATION_TEMPLATE_DIR).toBe(real(path.join(ROOT, 'skills/presentation/templates/presentation')))
  })

  it('works from a foreign cwd through the public CLI', () => {
    const target = tmpDir()
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'cwd-'))
    const out = execFileSync(process.execPath, [path.join(ROOT, 'skills/presentation/scripts/scaffold.mjs'), 'apply', '--cwd', target], { cwd: elsewhere, encoding: 'utf8' })
    expect(JSON.parse(out).written).toContain('src/presentation-kit/Presentation.tsx')
    expect(detectAnchors(target)).toEqual({ build: true, kit: true, index: true })
  })

  it('the CLI plan command reports the resolution', () => {
    const d = tmpDir()
    write(d, 'a.txt', 'x')
    const out = JSON.parse(execFileSync(process.execPath, [path.join(ROOT, 'skills/presentation/scripts/scaffold.mjs'), 'plan', '--cwd', d], { cwd: os.tmpdir(), encoding: 'utf8' }))
    expect(out).toMatchObject({ needsConfirmation: true, kind: 'standalone' })
  })
})

describe('bootstrap dependencies', () => {
  const pkg = JSON.parse(read(BOOTSTRAP, 'package.json'))
  const lock = JSON.parse(read(BOOTSTRAP, 'package-lock.json'))
  it.each(['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright'])(
    'declares and locks %s',
    (dep) => {
      expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })).toContain(dep)
      expect(lock.packages[`node_modules/${dep}`], `${dep} in lock`).toBeDefined()
    },
  )

  it('provides the build, lint, verify and inspect entry points', () => {
    for (const s of ['build', 'lint', 'verify', 'inspect', 'preview']) expect(pkg.scripts[s], s).toBeDefined()
  })

  it('pins the same Playwright as the repository', () => {
    expect(pkg.devDependencies.playwright).toBe(JSON.parse(read(ROOT, 'package.json')).devDependencies.playwright)
  })
})

describe('presentations registry writer', () => {
  function app() {
    const d = tmpDir()
    scaffold(d)
    return d
  }

  it('creates a self-contained folder and registers it, preserving existing entries', () => {
    const d = app()
    createPresentation(d, { slug: 'second-one', title: 'Second "one"' })
    createPresentation(d, { slug: 'third', title: 'Third' })
    expect(listPresentations(d)).toEqual([
      { slug: 'example', title: 'Example presentation' },
      { slug: 'second-one', title: 'Second "one"' },
      { slug: 'third', title: 'Third' },
    ])
    expect(listFiles(path.join(d, 'src/presentations/second-one'))).toEqual(listFiles(PRESENTATION_TEMPLATE_DIR))
    expect(read(d, 'src/presentations/second-one/Talk.tsx')).toContain('className="p-second-one"')
    expect(read(d, 'src/presentations/second-one/Talk.tsx')).toContain('title={"Second \\"one\\""}')
    expect(read(d, 'src/presentations/second-one/talk.css')).toContain('.p-second-one')
    expect(read(d, 'src/presentations/index.ts')).toContain("import('./second-one/Talk')")
  })

  it('leaves existing presentation bytes untouched', () => {
    const d = app()
    const exampleBefore = Object.fromEntries(listFiles(path.join(d, 'src/presentations/example')).map((f) => [f, read(d, 'src/presentations/example', f)]))
    createPresentation(d, { slug: 'another', title: 'Another' })
    for (const [f, text] of Object.entries(exampleBefore)) expect(read(d, 'src/presentations/example', f)).toBe(text)
  })

  it('rejects duplicate and malformed slugs', () => {
    const d = app()
    expect(() => createPresentation(d, { slug: 'example', title: 'x' })).toThrow(/already/)
    expect(() => createPresentation(d, { slug: 'Bad Slug', title: 'x' })).toThrow(/invalid slug/)
    expect(() => createPresentation(d, { slug: '../x', title: 'x' })).toThrow(/invalid slug/)
  })

  it('registerPresentation only appends and fails loudly on an unexpected registry', () => {
    const src = "export const presentations: PresentationEntry[] = [\n  { slug: 'a', title: 'A', load: () => import('./a/Talk') },\n]\n"
    const out = registerPresentation(src, { slug: 'b', title: 'B' })
    expect(out.startsWith(src.slice(0, src.indexOf('\n]')))).toBe(true)
    expect(out).toContain("slug: 'b'")
    expect(() => registerPresentation('export const x = 1', { slug: 'b', title: 'B' })).toThrow(/not found/)
  })

  it('refuses before writing when the registry is not where the helper expects it, and offers a folder-only path', () => {
    const d = tmpDir()
    seedBuild(d)
    seedKit(d)
    seedIndex(d)
    const before = listFiles(d)
    expect(() => createPresentation(d, { slug: 'fresh', title: 'Fresh' })).toThrow(/registry not found.*no-register/)
    expect(() => listPresentations(d)).toThrow(/indexFiles/)
    expect(listFiles(d)).toEqual(before)
    expect(resolveTarget(d).indexFiles).toEqual(['src/routes/registry.ts'])
    const r = createPresentation(d, { slug: 'fresh', title: 'Fresh', register: false })
    expect(r.registered).toBe(false)
    expect(listFiles(path.join(d, 'src/presentations/fresh'))).toEqual(listFiles(PRESENTATION_TEMPLATE_DIR))
  })

  it('does not write the folder when the registry shape is unexpected', () => {
    const d = app()
    write(d, 'src/presentations/index.ts', 'export const presentations = []\n')
    expect(() => createPresentation(d, { slug: 'fresh', title: 'Fresh' })).toThrow(/not found/)
    expect(fs.existsSync(path.join(d, 'src/presentations/fresh'))).toBe(false)
  })

  it('reads each registry entry on its own, whatever the field order or missing fields', () => {
    const d = app()
    write(d, 'src/presentations/index.ts', `export const presentations: PresentationEntry[] = [
  { title: 'Title first', slug: 'one', load: () => import('./one/Talk') },
  { slug: 'no-title', load: () => import('./no-title/Talk') },
  { slug: 'three', title: "Th{ree} \\"q\\"", load: () => import('./three/Talk') },
]
`)
    expect(listPresentations(d)).toEqual([
      { slug: 'one', title: 'Title first' },
      { slug: 'no-title', title: '' },
      { slug: 'three', title: 'Th{ree} "q"' },
    ])
  })

  it('lists candidates for an ambiguous modify request', () => {
    expect(listPresentations(ROOT)).toEqual([{ slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation' }])
  })
})
