import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain ES modules
import { detect, detectAnchors, monorepoSignals, stripNonCode } from '../../skills/presentation/scripts/detect.mjs'
// @ts-expect-error plain ES modules
import { ANCHOR_PATHS, TEMPLATE_ROOT, mergePackageJson, scaffold } from '../../skills/presentation/scripts/scaffold.mjs'
import { tree, walk } from '../support/files'

const dirs: string[] = []
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'skill-'))
  dirs.push(d)
  return d
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})

const put = (root: string, rel: string, text = '') => {
  mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
  writeFileSync(path.join(root, rel), text)
}
const APP_PKG = JSON.stringify({
  scripts: { build: 'tsc -b && vite' },
  dependencies: { react: '^19' },
  devDependencies: { vite: '^8', typescript: '^6' },
})

describe('anchor detection', () => {
  it('finds nothing in an empty directory', () => {
    const r = detect(tmp())
    expect(r.anchors).toEqual({ build: false, kit: false, index: false })
    expect(r.nonEmpty).toBe(false)
    expect(r.needsConfirmation).toBe(false)
    expect(r.target).toBe(r.projectDir)
    expect(r.monorepo).toBe(false)
  })

  it('detects all anchors in a scaffold, and in a cosmetically different app', () => {
    const d = tmp()
    scaffold(d, ['build', 'kit', 'index'])
    expect(detect(d)).toMatchObject({ anchors: { build: true, kit: true, index: true }, missing: [], needsConfirmation: false })

  })

  const KIT_FILES = {
    'src/engine/deck/Host.tsx': "import type { Step } from './contract'\nexport function Presentation(props: { steps: Step<unknown>[] }) { return null }\n",
    'src/engine/deck/Mount.tsx': "import { AnimatePresence, LayoutGroup } from 'motion/react'\nexport const Mount = () => [AnimatePresence, LayoutGroup]\n",
    'src/engine/deck/contract.ts': 'export interface Scene {}\nexport interface Step<T> { caption: string; Scene: Scene; payload: T }\nexport type SceneProps<T> = { payload: T }\n',
  }
  const REGISTRY_FILE = { 'src/talks/all.ts': "export const registry = [\n  { title: 'T', slug: 't', load: () => import('./t') },\n]\n" }

  it('recognizes a complete app whose files and folders are all named differently', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ scripts: { build: 'node build.js' }, devDependencies: { vite: '1', react: '1', typescript: '1', extra: '9' } }))
    put(d, 'vite.config.mjs', 'export default {}\n')
    for (const [rel, text] of Object.entries({ ...KIT_FILES, ...REGISTRY_FILE })) put(d, rel, text)
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('judges by what the code does: empty look-alike files do not count', () => {
    const d = tmp()
    put(d, 'src/presentation-kit/Presentation.tsx', '')
    put(d, 'src/presentation-kit/Stage.tsx', '')
    put(d, 'src/presentations/index.ts', 'export default []\n')
    expect(detectAnchors(d)).toEqual({ build: false, kit: false, index: false })
  })

  it('does not count commented-out or quoted examples as a kit or an index', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ scripts: { build: 'echo build' }, dependencies: { react: '1', vite: '1', typescript: '1' } }))
    put(
      d,
      'src/notes.ts',
      [
        '// export function Presentation() {}',
        '/* import { AnimatePresence, LayoutGroup } from "motion/react"',
        '   export interface Step { caption: string; Scene: unknown }',
        "   export const registry = [{ slug: 'a', load: () => import('./a') }] */",
        'export const text = "export function Presentation() {} AnimatePresence LayoutGroup"',
        "export const url = 'https://example.com' // slug: 'x', load: () => import('./x')",
      ].join('\n'),
    )
    const r = detect(d)
    expect(r.anchors).toEqual({ build: false, kit: false, index: false })
    expect(r.missing).toEqual(['build', 'kit', 'index'])
    expect(r.needsConfirmation).toBe(true)
  })

  it('still sees real code that follows a comment, a string with //, or an escaped quote', () => {
    const d = tmp()
    for (const [rel, text] of Object.entries({
      'src/a/Host.tsx': "// the host\nexport function Presentation(p: { s: Step<unknown>[] }) { return null }\nconst u = 'http://x' + \"it\\\"s\"\n",
      'src/a/Mount.tsx': "/* mount */ import { AnimatePresence, LayoutGroup } from 'motion/react'\nexport const M = [AnimatePresence, LayoutGroup]\n",
      'src/a/contract.ts': 'export interface Scene {}\nexport interface Step<T> { caption: string; Scene: Scene; payload: T }\n',
      'src/a/all.ts': "export const all = [{ slug: 't', title: 'T', load: () => import('./t') }]\n",
    })) put(d, rel, text)
    expect(detectAnchors(d)).toMatchObject({ kit: true, index: true })
  })

  it('keeps real code after apostrophes in JSX text and quotes inside regex literals', () => {
    const d = tmp()
    for (const [rel, text] of Object.entries({
      'src/a/Host.tsx':
        "export const Note = () => <p>Don't skip</p>\nconst strip = (s: string) => s.replace(/'/g, '')\nconst q = /\"/\nexport function Presentation(p: { s: Step<unknown>[] }) { return null }\n",
      'src/a/Mount.tsx': "const x = <i>it's</i>\nimport { AnimatePresence, LayoutGroup } from 'motion/react'\nexport const M = [AnimatePresence, LayoutGroup]\n",
      'src/a/contract.ts': 'export interface Scene {}\nexport interface Step<T> { caption: string; Scene: Scene; payload: T }\n',
      'src/a/all.ts': "export const t = <b>don't</b>\nexport const all = [{ slug: 't', title: 'T', load: () => import('./t') }]\n",
    })) put(d, rel, text)
    expect(detectAnchors(d)).toMatchObject({ kit: true, index: true })
  })

  it('does not let an unterminated quote swallow the lines after it', () => {
    const out = stripNonCode("a ' b\nexport function Presentation() {}\n")
    expect(out).toMatch(/export function Presentation/)
  })

  it('removes comments and empties string contents but keeps code', () => {
    const out = stripNonCode("a // c1\n/* c2 */ b 'x // y' \"p\\\"q\" `t` end")
    expect(out).not.toMatch(/c1|c2|x \/\/ y|p|q/)
    expect(out).toMatch(/a\s*\n\s+b '' "" `` end/)
  })

  it('needs a build script that actually runs vite, not just dependency names', () => {
    const fake = tmp()
    put(fake, 'package.json', JSON.stringify({ scripts: { build: 'echo build' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
    expect(detectAnchors(fake).build).toBe(false)
    const viaScript = tmp()
    put(viaScript, 'package.json', JSON.stringify({ scripts: { build: 'tsc -b && vite' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
    expect(detectAnchors(viaScript).build).toBe(true)
    const viaIndirection = tmp()
    put(viaIndirection, 'package.json', JSON.stringify({ scripts: { build: 'npm run compile', compile: 'tsc -b && vite' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
    expect(detectAnchors(viaIndirection).build).toBe(true)
    for (const build of [
      'NODE_ENV=production vite --mode x',
      'cross-env FOO=1 vite',
      'pnpm vite',
      'bunx vite',
      'pnpm dlx vite',
      'npx --yes vite',
      './node_modules/.bin/vite',
      'tsc -b && FOO=1 vite',
      'rm -rf dist; vite',
    ]) {
      const d = tmp()
      put(d, 'package.json', JSON.stringify({ scripts: { build }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
      expect(detectAnchors(d).build, build).toBe(true)
    }
    for (const build of ['echo vite', 'npm run lint', 'node vite-helper.js', 'tsc -b']) {
      const d = tmp()
      put(d, 'package.json', JSON.stringify({ scripts: { build }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
      expect(detectAnchors(d).build, build).toBe(false)
    }
    const echoed = tmp()
    put(echoed, 'package.json', JSON.stringify({ scripts: { build: 'echo vite' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
    expect(detectAnchors(echoed).build).toBe(false)
    const namedConfig = tmp()
    put(namedConfig, 'package.json', JSON.stringify({ scripts: { build: 'node build.js' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
    put(namedConfig, 'vite.web.config.ts', 'export default {}\n')
    expect(detectAnchors(namedConfig).build).toBe(true)
    const viaConfig = tmp()
    put(viaConfig, 'package.json', JSON.stringify({ scripts: { build: 'node build.js' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }))
    put(viaConfig, 'vite.config.ts', 'export default {}\n')
    expect(detectAnchors(viaConfig).build).toBe(true)
  })

  it('needs the host, the morph stage, and the step contract together', () => {
    const files = Object.entries(KIT_FILES)
    for (const [skipped] of files) {
      const d = tmp()
      for (const [rel, text] of files) if (rel !== skipped) put(d, rel, text)
      expect(detectAnchors(d).kit, `without ${skipped}`).toBe(false)
    }
  })

  it('reports exactly the genuinely missing anchors', () => {
    const d = tmp()
    put(d, 'package.json', APP_PKG)
    put(d, 'README.md', 'x')
    expect(detect(d)).toMatchObject({ missing: ['kit', 'index'], needsConfirmation: true })
    const noBuildScript = tmp()
    put(noBuildScript, 'package.json', JSON.stringify({ dependencies: { react: '1', vite: '1', typescript: '1' } }))
    expect(detectAnchors(noBuildScript).build).toBe(false)
    const noVite = tmp()
    put(noVite, 'package.json', JSON.stringify({ scripts: { build: 'x' }, dependencies: { react: '1' } }))
    expect(detectAnchors(noVite).build).toBe(false)
  })
})

describe('target resolution', () => {
  it.each([
    ['package.json workspaces', (d: string) => put(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => put(d, 'pnpm-workspace.yaml', 'packages:\n  - x\n')],
    ['packages/ directory', (d: string) => put(d, 'packages/a/package.json', '{}')],
    ['apps/ directory', (d: string) => put(d, 'apps/web/package.json', '{}')],
  ])('a %s alone makes the target a self-contained presentations/ app', (_n, arrange) => {
    const d = tmp()
    arrange(d)
    const r = detect(d)
    expect(r.monorepo).toBe(true)
    expect(r.target).toBe(path.join(r.projectDir, 'presentations'))
    expect(r.missing).toEqual(['build', 'kit', 'index'])
    expect(r.needsConfirmation).toBe(true)
  })

  it('does not treat an apps/ or packages/ folder without packages as a monorepo', () => {
    const d = tmp()
    put(d, 'package.json', APP_PKG)
    put(d, 'apps/readme.md', 'not a package')
    mkdirSync(path.join(d, 'packages'))
    const r = detect(d)
    expect(r.monorepo).toBe(false)
    expect(r.target).toBe(r.projectDir)
  })

  it('does not count a monorepo root build setup as the app build anchor', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'], scripts: { build: 'tsc -b' }, devDependencies: { vite: '1', react: '1', typescript: '1' } }))
    put(d, 'README.md', 'keep me')
    const r = detect(d)
    expect(r.target).toBe(path.join(r.projectDir, 'presentations'))
    expect(r.anchors.build).toBe(false)
    expect(monorepoSignals(d)).toEqual(['package.json workspaces'])
  })

  it('uses an existing presentation app as is, even inside a monorepo', () => {
    const d = tmp()
    scaffold(d, ['build', 'kit', 'index'])
    mkdirSync(path.join(d, 'packages'))
    const r = detect(d)
    expect(r.target).toBe(r.projectDir)
    expect(r.missing).toEqual([])
  })

  it('checks anchors at presentations/ inside a monorepo and keeps an existing build there', () => {
    const d = tmp()
    put(d, 'pnpm-workspace.yaml', '')
    put(d, 'presentations/package.json', APP_PKG)
    const r = detect(d)
    expect(r.anchors).toEqual({ build: true, kit: false, index: false })
  })

  it('a standalone non-empty project is scaffolded at its root', () => {
    const d = tmp()
    put(d, 'README.md', 'x')
    const r = detect(d)
    expect(r.target).toBe(r.projectDir)
    expect(r.needsConfirmation).toBe(true)
  })

  it('never writes to the project while detecting', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ workspaces: [] }))
    const before = tree(d)
    detect(d)
    expect(tree(d)).toEqual(before)
  })
})

describe('scaffolding', () => {
  it('resolves its templates from the skill directory, not the caller cwd', () => {
    const cwd = process.cwd()
    const elsewhere = tmp()
    process.chdir(elsewhere)
    try {
      const target = tmp()
      scaffold(target, ['build', 'kit', 'index'])
      expect(detect(target).missing).toEqual([])
    } finally {
      process.chdir(cwd)
    }
    expect(path.isAbsolute(TEMPLATE_ROOT)).toBe(true)
    expect(TEMPLATE_ROOT).toBe(path.resolve('skills/presentation/templates/bootstrap'))
  })

  it('a full scaffold writes the manifest with lock data and every anchor path', () => {
    const d = tmp()
    const { copied } = scaffold(d, ['build', 'kit', 'index'])
    expect(copied).toEqual(expect.arrayContaining(['package.json', 'package-lock.json', 'src/presentations/index.ts', 'src/presentation-kit/Presentation.tsx', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']))
    const files = Object.keys(tree(d))
    for (const paths of Object.values(ANCHOR_PATHS) as string[][]) {
      for (const p of paths) expect(files.some((f) => f === p || f.startsWith(p + '/')), p).toBe(true)
    }
    expect(JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8')).devDependencies).toHaveProperty('playwright')
  })

  it('a partial scaffold adds only the missing anchors and never overwrites existing content', () => {
    const d = tmp()
    put(d, 'package.json', APP_PKG)
    put(d, 'src/presentations/index.ts', 'SENTINEL registry')
    put(d, 'README.md', 'SENTINEL readme')
    put(d, 'tsconfig.json', 'SENTINEL tsconfig')
    const { copied, skipped } = scaffold(d, ['build', 'kit'])
    expect(tree(d)['src/presentations/index.ts']).toBe('SENTINEL registry')
    expect(tree(d)['README.md']).toBe('SENTINEL readme')
    expect(tree(d)['tsconfig.json']).toBe('SENTINEL tsconfig')
    expect(skipped).toContain('tsconfig.json')
    expect(copied).toContain('src/presentation-kit/Presentation.tsx')
    expect(copied).not.toContain('package-lock.json')
    expect(walk(path.join(d, 'src/presentation-kit')).length).toBeGreaterThan(10)
  })

  it('scaffolding only the kit leaves build setup and index files untouched', () => {
    const d = tmp()
    put(d, 'package.json', APP_PKG)
    scaffold(d, ['kit'])
    const files = Object.keys(tree(d))
    expect(files.filter((f) => !f.startsWith('src/presentation-kit/') && !f.startsWith('scripts/') && f !== '.gitignore')).toEqual(['package.json'])
  })

  it('always ensures the verify and inspect scripts that the package scripts point at', () => {
    const d = tmp()
    put(d, 'package.json', APP_PKG)
    scaffold(d, ['kit', 'index'])
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    const files = Object.keys(tree(d))
    for (const name of ['verify', 'inspect']) {
      expect(pkg.scripts[name], name).toBeDefined()
      const target = String(pkg.scripts[name]).match(/scripts\/[\w./-]+\.mjs/)![0]
      expect(files, `${name} -> ${target}`).toContain(target)
    }
    expect(files).toContain('scripts/lib/preview.mjs')
    expect(files).toContain('src/index.css')
  })

  it('reports wiring for an existing entry file instead of silently leaving the router disconnected', () => {
    const d = tmp()
    put(d, 'package.json', APP_PKG)
    put(d, 'src/main.tsx', 'SENTINEL entry')
    const { wiring, skipped } = scaffold(d, ['kit', 'index'])
    expect(tree(d)['src/main.tsx']).toBe('SENTINEL entry')
    expect(skipped).toContain('src/main.tsx')
    expect(wiring).toHaveLength(1)
    expect(wiring[0]).toMatchObject({ file: 'src/main.tsx' })
    expect(readFileSync(wiring[0].reference, 'utf8')).toContain('<Router')
    expect(wiring[0].action).toMatch(/Router/)
    expect(scaffold(tmp(), ['kit', 'index']).wiring).toEqual([])
  })

  it('merges only missing dependencies and scripts into an existing package.json', () => {
    const template = { type: 'module', scripts: { build: 'B', verify: 'V' }, dependencies: { react: '^19', motion: '^12' }, devDependencies: { vite: '^8', playwright: '^1' } }
    const existing = { scripts: { build: 'mine' }, dependencies: { react: '^18' }, devDependencies: { vite: '^7' } }
    const { merged, added } = mergePackageJson(template, existing)
    expect(merged.scripts).toEqual({ build: 'mine', verify: 'V' })
    expect(merged.dependencies).toEqual({ react: '^18', motion: '^12' })
    expect(merged.devDependencies).toEqual({ vite: '^7', playwright: '^1' })
    expect(added.sort()).toEqual(['dependencies.motion', 'devDependencies.playwright', 'scripts.verify'])
    expect(existing.dependencies).toEqual({ react: '^18' })
  })

  it('names the file when an existing package.json cannot be parsed', () => {
    const d = tmp()
    put(d, 'package.json', '{ not json')
    expect(() => scaffold(d, ['kit'])).toThrow(/cannot read .*package\.json/)
  })

  it('appends missing gitignore lines without duplicating existing ones', () => {
    const d = tmp()
    put(d, '.gitignore', 'node_modules\ncustom\n')
    scaffold(d, [])
    const lines = readFileSync(path.join(d, '.gitignore'), 'utf8').split('\n').filter(Boolean)
    expect(lines).toEqual(['node_modules', 'custom', 'dist', 'dist-ssr', '.inspection', '*.local'])
  })

  it('scaffolding into a monorepo target leaves the monorepo root untouched', () => {
    const root = tmp()
    put(root, 'package.json', JSON.stringify({ workspaces: ['packages/*'], name: 'root' }))
    put(root, 'packages/a/index.ts', 'a')
    const before = tree(root)
    const { target } = detect(root)
    scaffold(target, ['build', 'kit', 'index'])
    const after = tree(root)
    for (const [file, text] of Object.entries(before)) expect(after[file], file).toBe(text)
    expect(Object.keys(after).filter((f) => !(f in before)).every((f) => f.startsWith('presentations/'))).toBe(true)
    expect(detect(root).missing).toEqual([])
  })
})
