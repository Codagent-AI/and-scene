import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script without type declarations
import * as scaffoldModule from '../../skills/presentation/scripts/presentation-scaffold.mjs'
// @ts-expect-error plain ESM script without type declarations
import { drift } from '../../scripts/sync-template.mjs'
// @ts-expect-error plain ESM script without type declarations
import { readRegistry } from '../../scripts/lib/preview.mjs'

interface Info {
  target: string
  monorepo: boolean
  projectEmpty: boolean
  anchors: { build: boolean; kit: boolean; index: boolean }
  missing: string[]
  needsConfirmation: boolean
  written: string[]
  addedDeps: string[]
}
const lib = scaffoldModule as unknown as {
  BOOTSTRAP_DIR: string
  SKILL_DIR: string
  detect: (dir: string) => Info
  detectAnchors: (dir: string) => Info['anchors']
  scaffold: (dir: string, o: { install: boolean }) => Info
  mergePackageJson: (a: object, b: object) => { merged: Record<string, Record<string, string>>; added: string[] }
  addPresentation: (target: string, o: { slug: string; title: string }) => { folder: string }
  installCommand: (target: string, addedDeps?: string[]) => 'ci' | 'install'
  isWorkspaceMember: (target: string) => boolean
}

const root = path.resolve(__dirname, '../..')
const cli = path.join(root, 'skills/presentation/scripts/presentation-scaffold.mjs')
const dirs: string[] = []
const tmp = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'scaffold-'))
  dirs.push(dir)
  return dir
}
const write = (dir: string, file: string, content: string) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
  writeFileSync(path.join(dir, file), content)
}
const read = (dir: string, file: string) => readFileSync(path.join(dir, file), 'utf8')
const buildPackage = (extra: object = {}) =>
  JSON.stringify({
    name: 'host',
    scripts: { build: 'tsc -b && vite build' },
    devDependencies: { vite: '^7.0.0', react: '^18.0.0', typescript: '^5.0.0' },
    ...extra,
  })

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})

describe('anchor detection', () => {
  it('finds nothing in an empty directory', () => {
    expect(lib.detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
  })

  it('is keyed on the contract, not on a byte-identical scaffold', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage({ dependencies: { 'something-else': '1' } }))
    write(dir, 'src/presentation-kit/Presentation.jsx', 'export const Presentation = () => null')
    write(dir, 'src/presentation-kit/types.js', 'export const Step = {}')
    write(dir, 'src/presentations/index.tsx', 'export const presentations = []')
    expect(lib.detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not accept empty or comment-only files, or an index the tooling cannot read, as anchors', () => {
    const dir = tmp()
    write(dir, 'src/presentation-kit/Presentation.tsx', '// placeholder')
    write(dir, 'src/presentation-kit/types.ts', '')
    write(dir, 'src/presentations/index.js', 'export const presentations = []')
    expect(lib.detectAnchors(dir)).toEqual({ build: false, kit: false, index: false })
  })

  it('does not treat a manifest without a build script or Vite/React/TypeScript as a build setup', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ scripts: { build: 'x' }, dependencies: { react: '1' } }))
    expect(lib.detectAnchors(dir).build).toBe(false)
    write(dir, 'package.json', '{ not json')
    expect(lib.detectAnchors(dir).build).toBe(false)
  })
})

describe('target resolution', () => {
  it('scaffolds an empty directory at its root without asking for confirmation', () => {
    const dir = tmp()
    const info = lib.detect(dir)
    expect(info.target).toBe(dir)
    expect(info.missing).toEqual(['build', 'kit', 'index'])
    expect(info.needsConfirmation).toBe(false)
  })

  it('uses the root for a standalone project and asks to confirm when it is non-empty', () => {
    const dir = tmp()
    write(dir, 'README.md', 'hello')
    const info = lib.detect(dir)
    expect(info.monorepo).toBe(false)
    expect(info.target).toBe(dir)
    expect(info.needsConfirmation).toBe(true)
  })

  it.each([
    ['workspaces in package.json', (d: string) => write(d, 'package.json', buildPackage({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => write(d, 'pnpm-workspace.yaml', 'packages: []')],
    ['a packages/ layout', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['an apps/ layout', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('puts a monorepo (%s) into a presentations/ app', (_name, arrange) => {
    const dir = tmp()
    arrange(dir)
    const info = lib.detect(dir)
    expect(info.monorepo).toBe(true)
    expect(info.target).toBe(path.join(dir, 'presentations'))
    expect(info.needsConfirmation).toBe(true)
  })

  it('reuses an existing presentation app at the root, even inside a workspace', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage({ workspaces: ['x'] }))
    write(dir, 'src/presentations/index.ts', 'export const presentations = []')
    const info = lib.detect(dir)
    expect(info.target).toBe(dir)
    expect(info.missing).toEqual(['kit'])
  })

  it('reuses an existing nested presentations/ app', () => {
    const dir = tmp()
    mkdirSync(path.join(dir, 'packages'))
    write(dir, 'presentations/src/presentations/index.ts', 'export const presentations = []')
    expect(lib.detect(dir).target).toBe(path.join(dir, 'presentations'))
  })
})

describe('scaffolding', () => {
  it('scaffolds all three anchors in an empty directory', () => {
    const dir = tmp()
    const result = lib.scaffold(dir, { install: false })
    expect(result.written).toContain('package.json')
    expect(result.written).toContain('src/presentation-kit/Presentation.tsx')
    expect(result.written).toContain('src/presentations/index.ts')
    expect(lib.detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(lib.detect(dir).missing).toEqual([])
  })

  it('skips scaffolding when everything is present', () => {
    const dir = tmp()
    lib.scaffold(dir, { install: false })
    const before = read(dir, 'package.json')
    const again = lib.scaffold(dir, { install: false })
    expect(again.written).toEqual([])
    expect(read(dir, 'package.json')).toBe(before)
  })

  it('adds only the missing anchors and leaves present files alone', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage())
    const registry = 'export const presentations = [] // mine\n'
    write(dir, 'src/presentations/index.ts', registry)
    write(dir, 'src/main.tsx', '// mine')
    const result = lib.scaffold(dir, { install: false })
    const outside = result.written.filter((f) => !f.startsWith('src/presentation-kit/') && !f.startsWith('scripts/'))
    expect(outside).toEqual([])
    expect(read(dir, 'src/presentations/index.ts')).toBe(registry)
    expect(read(dir, 'src/main.tsx')).toBe('// mine')
    expect(lib.detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('installs missing dependencies into an existing manifest without changing versions it has', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage())
    lib.scaffold(dir, { install: false })
    const pkg = JSON.parse(read(dir, 'package.json'))
    expect(pkg.devDependencies.vite).toBe('^7.0.0')
    for (const dep of ['motion', 'lucide-react', 'react-dom', 'playwright']) {
      expect(dep in { ...pkg.dependencies, ...pkg.devDependencies }, dep).toBe(true)
    }
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
  })

  it('copies the verification scripts that the added npm commands run, even when the build already exists', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage())
    lib.scaffold(dir, { install: false })
    const scripts = JSON.parse(read(dir, 'package.json')).scripts as Record<string, string>
    for (const command of [scripts.verify, scripts.inspect]) {
      const file = command.replace(/^node /, '')
      expect(existsSync(path.join(dir, file)), file).toBe(true)
    }
    expect(existsSync(path.join(dir, 'scripts/lib/preview.mjs'))).toBe(true)
  })

  it('routes presentations from an existing app entry and keeps the host app for other paths', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage())
    write(dir, 'src/main.tsx', "import './App'\nconsole.log('host app')\n")
    const result = lib.scaffold(dir, { install: false }) as Info & { entryWired: boolean }
    expect(result.entryWired).toBe(true)
    expect(read(dir, 'src/app-main.tsx')).toBe("import './App'\nconsole.log('host app')\n")
    const entry = read(dir, 'src/main.tsx')
    expect(entry).toContain("import { presentations } from './presentations'")
    expect(entry).toContain("resolveRoute(window.location.pathname, presentations)")
    expect(entry).toContain("import('./router')")
    expect(entry).not.toMatch(/(^|[^.\w])await\s/m)
    expect(entry).toContain("import('./app-main')")
    expect(existsSync(path.join(dir, 'src/router.tsx'))).toBe(true)
    expect(existsSync(path.join(dir, 'src/routes.ts'))).toBe(true)
  })

  it('does not rewire an entry that already knows about presentations', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage())
    write(dir, 'src/main.tsx', "import { presentations } from './presentations'\n")
    const result = lib.scaffold(dir, { install: false }) as Info & { entryWired: boolean }
    expect(result.entryWired).toBe(false)
    expect(existsSync(path.join(dir, 'src/app-main.tsx'))).toBe(false)
  })

  it('scaffolds a monorepo into presentations/ and leaves the root untouched', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage({ workspaces: ['packages/*'] }))
    write(dir, 'README.md', 'keep me')
    const rootManifest = read(dir, 'package.json')
    const result = lib.scaffold(dir, { install: false })
    expect(result.target).toBe(path.join(dir, 'presentations'))
    expect(read(dir, 'package.json')).toBe(rootManifest)
    expect(read(dir, 'README.md')).toBe('keep me')
    expect(existsSync(path.join(dir, 'src'))).toBe(false)
    expect(lib.detectAnchors(path.join(dir, 'presentations'))).toEqual({ build: true, kit: true, index: true })
  })

  it('merges dependencies without overwriting existing entries', () => {
    const { merged, added } = lib.mergePackageJson(
      { dependencies: { react: '^18.0.0' }, scripts: { verify: 'mine' } },
      { dependencies: { react: '^19.0.0', motion: '^12' }, scripts: { verify: 'theirs', inspect: 'x' } },
    )
    expect(merged.dependencies).toEqual({ react: '^18.0.0', motion: '^12' })
    expect(merged.scripts).toEqual({ verify: 'mine', inspect: 'x' })
    expect(added).toEqual(['motion'])
  })
})

describe('install command', () => {
  const app = (dir: string, rel: string) => {
    write(dir, `${rel}/package.json`, buildPackage())
    write(dir, `${rel}/package-lock.json`, '{"lockfileVersion":3}')
    return path.join(dir, rel)
  }

  it('uses npm ci for a standalone app with its own lockfile and nothing to add', () => {
    const dir = tmp()
    expect(lib.installCommand(app(dir, '.'), [])).toBe('ci')
  })

  it('uses npm install when dependencies were added', () => {
    const dir = tmp()
    expect(lib.installCommand(app(dir, '.'), ['motion'])).toBe('install')
  })

  it.each([
    ['an exact path', ['presentations']],
    ['a one-level glob', ['presentations', 'packages/*']],
    ['a ./ prefixed path', ['./presentations']],
    ['the packages object form', { packages: ['presentations'] }],
  ])('uses npm install for a workspace member listed as %s, whose own lockfile npm ignores', (_name, workspaces) => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage({ workspaces }))
    const target = app(dir, 'presentations')
    expect(lib.isWorkspaceMember(target)).toBe(true)
    expect(lib.installCommand(target, [])).toBe('install')
  })

  it('matches glob workspaces by directory', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage({ workspaces: ['apps/*'] }))
    expect(lib.installCommand(app(dir, 'apps/deck'), [])).toBe('install')
    expect(lib.installCommand(app(dir, 'other/deck'), [])).toBe('ci')
  })

  it('keeps npm ci for an app that a workspace root does not list', () => {
    const dir = tmp()
    write(dir, 'package.json', buildPackage({ workspaces: ['packages/*'] }))
    const target = app(dir, 'presentations')
    expect(lib.isWorkspaceMember(target)).toBe(false)
    expect(lib.installCommand(target, [])).toBe('ci')
  })
})

describe('command line', () => {
  it('refuses to write into a non-empty project until the user confirmed', () => {
    const dir = tmp()
    write(dir, 'README.md', 'x')
    const refused = spawnSync(process.execPath, [cli, 'scaffold', dir, '--no-install'], { encoding: 'utf8' })
    expect(refused.status).toBe(2)
    expect(refused.stderr).toContain(dir)
    expect(existsSync(path.join(dir, 'src'))).toBe(false)
    const confirmed = spawnSync(process.execPath, [cli, 'scaffold', dir, '--no-install', '--yes'], { encoding: 'utf8' })
    expect(confirmed.status).toBe(0)
    expect(existsSync(path.join(dir, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
  })

  it('resolves its templates from the skill directory whatever the working directory', () => {
    expect(lib.BOOTSTRAP_DIR).toBe(path.join(root, 'skills/presentation/templates/bootstrap'))
    expect(existsSync(path.join(lib.SKILL_DIR, 'SKILL.md'))).toBe(true)
    const dir = tmp()
    const elsewhere = tmp()
    const run = spawnSync(process.execPath, [cli, 'scaffold', dir, '--no-install'], { cwd: elsewhere, encoding: 'utf8' })
    expect(run.status).toBe(0)
    expect(existsSync(path.join(dir, 'package.json'))).toBe(true)
  })

  it('reports an empty missing list for a fully scaffolded project', () => {
    const dir = tmp()
    lib.scaffold(dir, { install: false })
    const run = spawnSync(process.execPath, [cli, 'detect', dir], { encoding: 'utf8' })
    expect(JSON.parse(run.stdout).missing).toEqual([])
  })
})

describe('adding presentations', () => {
  const scaffolded = () => {
    const dir = tmp()
    lib.scaffold(dir, { install: false })
    return dir
  }

  it('creates a self-contained folder and registers it', () => {
    const dir = scaffolded()
    lib.addPresentation(dir, { slug: 'my-talk', title: 'My "Talk" */ end \\ \'' })
    expect(existsSync(path.join(dir, 'src/presentations/my-talk/Talk.tsx'))).toBe(true)
    const talk = read(dir, 'src/presentations/my-talk/Talk.tsx')
    expect(talk).toContain('className="my-talk"')
    expect(talk).toContain('title={"My \\"Talk\\" */ end \\\\ \'"}')
    expect(read(dir, 'src/presentations/my-talk/style.css').split('*/').length).toBe(2)
    expect(read(dir, 'src/presentations/my-talk/style.css')).toContain('.my-talk')
    expect(read(dir, 'src/presentations/index.ts')).toContain('slug: "my-talk"')
    expect(read(dir, 'src/presentations/index.ts')).toContain("import('./my-talk/Talk')")
  })

  it('keeps existing presentations intact and registered', () => {
    const dir = scaffolded()
    lib.addPresentation(dir, { slug: 'first', title: 'First' })
    const firstFile = read(dir, 'src/presentations/first/Scene.tsx')
    lib.addPresentation(dir, { slug: 'second', title: 'Second' })
    const registry = read(dir, 'src/presentations/index.ts')
    expect(registry).toContain('slug: "first"')
    expect(registry).toContain('slug: "second"')
    expect(read(dir, 'src/presentations/first/Scene.tsx')).toBe(firstFile)
  })

  it('writes titles literally: dollar patterns and placeholders in a title are not interpreted', () => {
    const dir = scaffolded()
    const title = "Save $$$ $& $' __NAME__ \"q\" \\ */"
    lib.addPresentation(dir, { slug: 'money', title })
    const talk = read(dir, 'src/presentations/money/Talk.tsx')
    expect(talk).toContain(`title={${JSON.stringify(title)}}`)
    expect(talk).toContain('className="money"')
    expect(read(dir, 'src/presentations/money/style.css')).toContain('Save $$$ $& $\' __NAME__')
    expect(readRegistry(dir)).toEqual([{ slug: 'money', title }])
  })

  it('reads quoted titles back exactly and fails loudly on an entry it cannot parse', () => {
    const dir = scaffolded()
    lib.addPresentation(dir, { slug: 'one', title: 'He said "hi"' })
    expect(readRegistry(dir)).toEqual([{ slug: 'one', title: 'He said "hi"' }])
    const file = path.join(dir, 'src/presentations/index.ts')
    writeFileSync(file, read(dir, 'src/presentations/index.ts').replace(/\n\]\s*$/, "\n  { title: 'Odd', slug: 'odd', load: () => import('./odd/Talk') },\n]\n"))
    expect(() => readRegistry(dir)).toThrow(/slug entries/)
  })

  it('rejects duplicates, invalid slugs, and a missing index', () => {
    const dir = scaffolded()
    lib.addPresentation(dir, { slug: 'dup', title: 'Dup' })
    expect(() => lib.addPresentation(dir, { slug: 'dup', title: 'Dup' })).toThrow(/already/)
    expect(() => lib.addPresentation(dir, { slug: 'Bad Slug', title: 'x' })).toThrow(/invalid slug/)
    expect(() => lib.addPresentation(tmp(), { slug: 'ok', title: 'x' })).toThrow(/scaffold first/)
  })
})

describe('bootstrap template', () => {
  it('keeps the shared kit, app shell, and scripts byte-aligned with the repository copies', () => {
    expect(drift()).toEqual([])
  })

  it('declares the complete dependency set and no styling framework', () => {
    const pkg = JSON.parse(read(lib.BOOTSTRAP_DIR, 'package.json'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of [
      'react', 'react-dom', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom',
      '@types/node', 'motion', 'lucide-react', 'eslint', 'typescript-eslint', 'playwright',
    ]) {
      expect(deps, dep).toContain(dep)
    }
    expect(deps.filter((d) => /tailwind/.test(d))).toEqual([])
    expect(existsSync(path.join(lib.BOOTSTRAP_DIR, 'package-lock.json'))).toBe(true)
  })

  it('ships no default presentation styling', () => {
    const css = read(lib.BOOTSTRAP_DIR, 'src/index.css')
    expect(css).not.toMatch(/(color|font|background|border|shadow)/i)
    expect(read(lib.BOOTSTRAP_DIR, 'vite.config.ts')).not.toMatch(/tailwind/i)
  })
})
