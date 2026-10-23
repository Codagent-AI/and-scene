import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  addPresentation, anchorOf, bootstrap, BOOTSTRAP_DIR, PRESENTATION_DIR, detectAnchors, isMonorepo, mergePackageJson, resolveTarget,
} from '../../skills/presentation/scripts/scaffold.mjs'
import { ROOT } from '../helpers/spec-outline'

const dirs: string[] = []
const tmp = () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-'))
  dirs.push(d)
  return d
}
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

const files = (dir: string, base = dir): string[] =>
  readdirSync(dir).flatMap((n) => {
    const f = path.join(dir, n)
    return statSync(f).isDirectory() ? files(f, base) : [path.relative(base, f)]
  }).sort()
const digest = (dir: string) => Object.fromEntries(files(dir).map((f) => [f, createHash('sha1').update(readFileSync(path.join(dir, f))).digest('hex')]))
const write = (file: string, text: string) => {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, text)
}
const materialize = (dir: string) => cpSync(BOOTSTRAP_DIR, dir, { recursive: true })

describe('detectAnchors', () => {
  it('finds nothing in an empty directory and all three in the bootstrap template', () => {
    expect(detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
    const d = tmp()
    materialize(d)
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it.each([
    ['build', ['package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'index.html', 'eslint.config.js']],
    ['kit', ['src/presentation-kit']],
    ['index', ['src/presentations']],
  ])('reports a missing %s anchor when only that part is removed', (anchor, removals) => {
    const d = tmp()
    materialize(d)
    for (const r of removals) rmSync(path.join(d, r), { recursive: true, force: true })
    const found = detectAnchors(d)
    expect(found[anchor as 'build']).toBe(false)
    expect(Object.values(found).filter(Boolean)).toHaveLength(2)
  })

  it('is contract-level: renamed, reformatted kit files and extra dependencies still count', () => {
    const d = tmp()
    materialize(d)
    renameSync(path.join(d, 'src/presentation-kit/Presentation.tsx'), path.join(d, 'src/presentation-kit/Deck.tsx'))
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    pkg.dependencies['left-pad'] = '1.0.0'
    writeFileSync(path.join(d, 'package.json'), JSON.stringify(pkg))
    const reg = path.join(d, 'src/presentations/index.ts')
    writeFileSync(reg, readFileSync(reg, 'utf8').replace('export const presentations:', 'export   const   presentations :'))
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('rejects incomplete look-alikes', () => {
    const d = tmp()
    materialize(d)
    rmSync(path.join(d, 'src/presentation-kit/Stage.tsx'))
    write(path.join(d, 'src/presentation-kit/index.ts'), 'export const nothing = 1\n')
    expect(detectAnchors(d).kit).toBe(false)
    write(path.join(d, 'src/presentations/index.ts'), 'export const somethingElse = []\n')
    expect(detectAnchors(d).index).toBe(false)
    write(path.join(d, 'package.json'), JSON.stringify({ scripts: {}, dependencies: { react: '1' } }))
    expect(detectAnchors(d).build).toBe(false)
  })

  it('classifies template files by anchor', () => {
    expect(anchorOf('src/presentation-kit/Stage.tsx')).toBe('kit')
    expect(anchorOf('scripts/verify.mjs')).toBe('kit')
    expect(anchorOf('src/presentations/index.ts')).toBe('index')
    expect(anchorOf('package.json')).toBe('build')
  })
})

describe('resolveTarget', () => {
  it('scaffolds an empty directory at its root without needing confirmation', () => {
    const d = tmp()
    const r = resolveTarget(d)
    expect([r.target, r.missing, r.needsConfirmation, r.empty]).toEqual([d, ['build', 'kit', 'index'], false, true])
  })

  it('scaffolds a non-empty standalone project at its root, after confirmation', () => {
    const d = tmp()
    write(path.join(d, 'package.json'), '{"name":"x"}')
    const r = resolveTarget(d)
    expect([r.target, r.monorepo, r.needsConfirmation]).toEqual([d, false, true])
  })

  it.each([
    ['workspaces array', (d: string) => write(path.join(d, 'package.json'), '{"workspaces":["packages/*"]}')],
    ['workspaces object', (d: string) => write(path.join(d, 'package.json'), '{"workspaces":{"packages":["a"]}}')],
    ['pnpm-workspace.yaml', (d: string) => write(path.join(d, 'pnpm-workspace.yaml'), 'packages: []\n')],
    ['packages/ layout', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['apps/ layout', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('puts the app in presentations/ for a monorepo signalled by %s', (_name, setup) => {
    const d = tmp()
    setup(d)
    write(path.join(d, 'unrelated.txt'), 'keep me')
    expect(isMonorepo(d)).toBe(true)
    const r = resolveTarget(d)
    expect([r.target, r.relativeTarget, r.needsConfirmation]).toEqual([path.join(d, 'presentations'), 'presentations', true])
  })

  it('does not treat a workspace root build setup as the presentation app', () => {
    const d = tmp()
    const pkg = JSON.parse(readFileSync(path.join(BOOTSTRAP_DIR, 'package.json'), 'utf8'))
    pkg.workspaces = ['packages/*']
    write(path.join(d, 'package.json'), JSON.stringify(pkg))
    for (const f of ['vite.config.ts', 'tsconfig.json']) cpSync(path.join(BOOTSTRAP_DIR, f), path.join(d, f))
    expect(detectAnchors(d).build).toBe(true)
    const r = resolveTarget(d)
    expect(r.target).toBe(path.join(d, 'presentations'))
    expect(r.missing).toEqual(['build', 'kit', 'index'])
  })

  it('reuses an existing presentation app, at the root or in presentations/', () => {
    const root = tmp()
    materialize(root)
    expect(resolveTarget(root)).toMatchObject({ target: root, missing: [], needsConfirmation: false })
    const mono = tmp()
    mkdirSync(path.join(mono, 'packages'))
    materialize(path.join(mono, 'presentations'))
    rmSync(path.join(mono, 'presentations/src/presentations'), { recursive: true })
    const r = resolveTarget(mono)
    expect([r.target, r.missing]).toEqual([path.join(mono, 'presentations'), ['index']])
  })
})

describe('bootstrap', () => {
  it('scaffolds everything into an empty target and a second run changes nothing', () => {
    const d = tmp()
    const first = bootstrap(d)
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
    expect(first.installCommand).toBe('npm ci')
    expect(first.installNeeded).toBe(true)
    const before = digest(d)
    const second = bootstrap(d)
    expect(second.copied).toEqual([])
    expect(digest(d)).toEqual(before)
  })

  it('scaffolds only missing anchors and leaves existing files byte-identical', () => {
    const d = tmp()
    materialize(d)
    rmSync(path.join(d, 'src/presentation-kit'), { recursive: true })
    rmSync(path.join(d, 'scripts'), { recursive: true })
    write(path.join(d, 'vite.config.ts'), '// customised\nexport default {}\n')
    write(path.join(d, 'src/presentations/index.ts'), 'export const presentations = [] // mine\n')
    const before = digest(d)
    const r = bootstrap(d)
    expect(r.copied.every((f) => anchorOf(f) === 'kit')).toBe(true)
    expect(r.copied.length).toBeGreaterThan(10)
    const after = digest(d)
    for (const [f, h] of Object.entries(before)) expect(after[f], f).toBe(h)
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('merges missing dependencies and scripts into an existing package.json without changing existing entries', () => {
    const d = tmp()
    write(path.join(d, 'package.json'), JSON.stringify({ name: 'mine', scripts: { build: 'echo mine' }, dependencies: { react: '^18.0.0' } }))
    const r = bootstrap(d, { anchors: ['kit'] })
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(r.packageUpdated).toBe(true)
    expect(r.installCommand).toBe('npm install')
    expect(pkg.name).toBe('mine')
    expect(pkg.scripts.build).toBe('echo mine')
    expect(pkg.dependencies.react).toBe('^18.0.0')
    for (const dep of ['motion', 'lucide-react', 'react-dom']) expect(pkg.dependencies[dep]).toBeDefined()
    for (const dep of ['playwright', 'vite', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint']) expect(pkg.devDependencies[dep]).toBeDefined()
    expect(pkg.scripts.verify).toBeDefined()
    expect(mergePackageJson(path.join(d, 'package.json'))).toBe(false)
  })

  it('adds only the missing pieces in a monorepo and leaves unrelated root content untouched', () => {
    const d = tmp()
    write(path.join(d, 'package.json'), '{"workspaces":["packages/*"]}')
    write(path.join(d, 'packages/lib/index.ts'), 'export {}\n')
    write(path.join(d, 'README.md'), 'hello')
    const before = digest(d)
    const target = resolveTarget(d).target
    bootstrap(target)
    const after = digest(d)
    for (const [f, h] of Object.entries(before)) expect(after[f], f).toBe(h)
    expect(detectAnchors(path.join(d, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(existsSync(path.join(d, 'src'))).toBe(false)
  })

  it('resolves templates from the skill directory regardless of the caller\'s cwd', () => {
    const cwd = tmp()
    const target = path.join(tmp(), 'app')
    const cli = path.join(ROOT, 'skills/presentation/scripts/scaffold.mjs')
    const r = spawnSync(process.execPath, [cli, 'bootstrap', target, '--target', target], { cwd, encoding: 'utf8' })
    expect(r.status, r.stderr).toBe(0)
    expect(detectAnchors(target)).toEqual({ build: true, kit: true, index: true })
    expect(files(cwd)).toEqual([])
    const bad = spawnSync(process.execPath, [cli, 'nonsense'], { cwd, encoding: 'utf8' })
    expect(bad.status).toBe(1)
  })
})

describe('addPresentation', () => {
  const app = () => {
    const d = tmp()
    bootstrap(d)
    return d
  }

  it('creates a self-contained folder and registers it, preserving existing presentations', () => {
    const d = app()
    addPresentation(d, { slug: 'first-talk', title: 'First Talk' })
    const firstBefore = digest(path.join(d, 'src/presentations/first-talk'))
    const r = addPresentation(d, { slug: 'second', title: 'Second "Quoted" Talk' })
    expect(r.files.sort()).toEqual(['Talk.tsx', 'entities.ts', 'scene.tsx', 'steps/index.ts', 'talk.css'].map((f) => path.join('src/presentations/second', f)).sort())
    expect(digest(path.join(d, 'src/presentations/first-talk'))).toEqual(firstBefore)
    const registry = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("{ slug: 'first-talk', title: \"First Talk\", load: () => import('./first-talk/Talk') },")
    expect(registry).toContain("slug: 'second'")
    expect(registry).toContain('"Second \\"Quoted\\" Talk"')
    expect(registry.indexOf('first-talk')).toBeLessThan(registry.indexOf("slug: 'second'"))
    const talk = readFileSync(path.join(d, 'src/presentations/second/Talk.tsx'), 'utf8')
    expect(talk).toContain('className="talk-second"')
    expect(talk).not.toContain('__')
    expect(readFileSync(path.join(d, 'src/presentations/second/steps/index.ts'), 'utf8')).toContain("groupKey: 'second'")
  })

  it('refuses invalid or colliding slugs without changing anything', () => {
    const d = app()
    addPresentation(d, { slug: 'taken', title: 'Taken' })
    expect(() => addPresentation(d, { slug: 'taken', title: 'Again' })).toThrow(/already exists/)
    expect(() => addPresentation(d, { slug: 'Bad Slug', title: 'x' })).toThrow(/invalid slug/)
    expect(() => addPresentation(d, { slug: '../escape', title: 'x' })).toThrow(/invalid slug/)
    expect(() => addPresentation(d, { slug: 'ok', title: '' })).toThrow(/title/)
    rmSync(path.join(d, 'src/presentations/taken'), { recursive: true })
    expect(() => addPresentation(d, { slug: 'taken', title: 'Again' })).toThrow(/already registered/)
    expect(Object.keys(digest(d)).filter((f) => f.includes('taken'))).toEqual([])
  })

  it('needs the presentation index, and registers into registries without the marker', () => {
    const empty = tmp()
    expect(() => addPresentation(empty, { slug: 'x', title: 'X' })).toThrow(/index is missing/)
    const d = app()
    write(path.join(d, 'src/presentations/index.ts'), "export const presentations = [\n  { slug: 'old', title: 'Old', load: () => import('./old/Talk') }\n]\n")
    addPresentation(d, { slug: 'new-one', title: 'New One' })
    const registry = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("'old', title: 'Old', load: () => import('./old/Talk') },")
    expect(registry).toContain("slug: 'new-one'")
    expect(registry.trim().endsWith(']')).toBe(true)
  })
})

describe('partial scaffolding of ordinary existing apps', () => {
  /** A plain Vite + React + TS app: build anchor only, entry point renders its own App. */
  const ordinaryApp = (entryName = 'main.tsx') => {
    const d = tmp()
    for (const f of ['package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js']) {
      cpSync(path.join(BOOTSTRAP_DIR, f), path.join(d, f))
    }
    write(path.join(d, 'index.html'), `<!doctype html><div id="root"></div><script type="module" src="/src/${entryName}"></script>`)
    write(path.join(d, 'src/App.tsx'), 'export default function App() { return <p>my app</p> }\n')
    write(path.join(d, `src/${entryName}`), "import { createRoot } from 'react-dom/client'\nimport App from './App'\ncreateRoot(document.getElementById('root')!).render(<App />)\n")
    return d
  }

  it.each(['main.tsx', 'index.tsx'])('wires the router into the existing %s entry point and keeps a backup', (entry) => {
    const d = ordinaryApp(entry)
    const original = readFileSync(path.join(d, `src/${entry}`), 'utf8')
    expect(detectAnchors(d)).toEqual({ build: true, kit: false, index: false })
    const r = bootstrap(d)
    const wired = readFileSync(path.join(d, `src/${entry}`), 'utf8')
    expect(wired).toContain("import Router from './Router.tsx'")
    expect(wired).toContain('<Router />')
    expect(wired).not.toContain('<App />')
    expect(wired).not.toContain("'./index.css'") // the app had no index.css
    expect(readFileSync(path.join(d, `src/${entry}.bak`), 'utf8')).toBe(original)
    expect(r.notes.join(' ')).toContain('now renders the presentation router')
    expect(existsSync(path.join(d, 'src/Router.tsx'))).toBe(true)
    expect(readFileSync(path.join(d, 'src/App.tsx'), 'utf8')).toContain('my app') // untouched
    // the registered presentation is now reachable through the entry point
    addPresentation(d, { slug: 'wired', title: 'Wired' })
    expect(readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'wired'")
  })

  it('leaves an entry point that already renders the router alone', () => {
    const d = ordinaryApp()
    bootstrap(d)
    const before = digest(d)
    const again = bootstrap(d, { anchors: ['index'] })
    expect(digest(d)).toEqual(before)
    expect(again.skipped).toContain('src/main.tsx')
  })

  it('does not modify a complete existing scaffold, not even package.json', () => {
    const d = tmp()
    materialize(d)
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    delete pkg.scripts.verify
    delete pkg.scripts.inspect
    writeFileSync(path.join(d, 'package.json'), JSON.stringify(pkg))
    const before = digest(d)
    const r = bootstrap(d)
    expect(r).toMatchObject({ copied: [], packageUpdated: false, installNeeded: false })
    expect(digest(d)).toEqual(before)
  })

  it('does not add verification scripts when the kit anchor is already present', () => {
    const d = tmp()
    materialize(d)
    rmSync(path.join(d, 'src/presentations'), { recursive: true })
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    delete pkg.scripts.verify
    writeFileSync(path.join(d, 'package.json'), JSON.stringify(pkg))
    bootstrap(d)
    expect(JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8')).scripts.verify).toBeUndefined()
  })
})

describe('contract-level detection and registration under other names', () => {
  it.each(['index.tsx', 'index.js', 'registry.ts'])('detects and registers into a registry named %s', (name) => {
    const d = tmp()
    materialize(d)
    const dir = path.join(d, 'src/presentations')
    renameSync(path.join(dir, 'index.ts'), path.join(dir, name))
    expect(detectAnchors(d).index).toBe(true)
    const r = addPresentation(d, { slug: 'other-name', title: 'Other' })
    expect(r.registry).toBe(path.join('src/presentations', name))
    expect(readFileSync(path.join(dir, name), 'utf8')).toContain("slug: 'other-name'")
    expect(existsSync(path.join(dir, 'index.ts'))).toBe(false)
  })

  it('does not accept a kit whose barrel re-exports a deleted file', () => {
    const d = tmp()
    materialize(d)
    expect(detectAnchors(d).kit).toBe(true)
    rmSync(path.join(d, 'src/presentation-kit/Stage.tsx')) // the barrel still says: export { Stage } from './Stage'
    expect(readFileSync(path.join(d, 'src/presentation-kit/index.ts'), 'utf8')).toContain("export { Stage } from './Stage'")
    expect(detectAnchors(d).kit).toBe(false)
  })
})

describe('generated presentation sources are valid for any title', () => {
  it('writes the title as a JS string literal in Talk.tsx and keeps comments intact', () => {
    const d = tmp()
    bootstrap(d)
    const title = 'Say "hi" */ \\ and <b>more</b>'
    addPresentation(d, { slug: 'quoted', title })
    const talk = readFileSync(path.join(d, 'src/presentations/quoted/Talk.tsx'), 'utf8')
    expect(talk).toContain(`title={${JSON.stringify(title)}}`)
    const css = readFileSync(path.join(d, 'src/presentations/quoted/talk.css'), 'utf8')
    const template = readFileSync(path.join(PRESENTATION_DIR, 'talk.css'), 'utf8')
    expect(css.match(/\*\//g)).toHaveLength(template.match(/\*\//g)!.length) // the title adds no comment terminator
    expect(readFileSync(path.join(d, 'src/presentations/quoted/entities.ts'), 'utf8')).not.toContain('__')
  })
})
