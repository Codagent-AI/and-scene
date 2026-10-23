// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'
import { afterAll, describe, expect, it } from 'vitest'
import {
  BOOTSTRAP_DIR,
  PRESENTATION_DIR,
  REGISTRY_MARKER,
  SKILL_DIR,
  anchorOf,
  bootstrap,
  createPresentation,
  detect,
  detectAnchors,
  isMonorepo,
  listPresentations,
  resolveTarget,
} from '../../skills/presentation/scripts/scaffold.mjs'

const tmps: string[] = []
const tmp = () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'scaffold-'))
  tmps.push(d)
  return d
}
afterAll(() => tmps.forEach((d) => rmSync(d, { recursive: true, force: true })))

const walk = (dir: string, base = dir): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))],
  )
const snapshot = (dir: string, skip: (rel: string) => boolean = () => false) =>
  Object.fromEntries(
    walk(dir)
      .filter((f) => !skip(f))
      .sort()
      .map((f) => [f, readFileSync(path.join(dir, f), 'utf8')]),
  )

function full(): string {
  const d = tmp()
  bootstrap(d)
  return d
}

describe('anchor detection', () => {
  it('finds nothing in an empty directory', () => {
    const d = tmp()
    expect(detectAnchors(d)).toEqual({ build: false, kit: false, index: false })
    expect(detect(d)).toMatchObject({ target: d, missing: ['build', 'kit', 'index'], targetIsEmpty: true })
  })

  it('finds all three anchors in a bootstrapped app', () => {
    expect(detect(full()).missing).toEqual([])
  })

  it('is contract-level: cosmetic naming, formatting and extra dependencies still count', () => {
    const d = full()
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    pkg.dependencies.zod = '^3.0.0'
    writeFileSync(path.join(d, 'package.json'), JSON.stringify(pkg))
    cpSync(path.join(d, 'vite.config.ts'), path.join(d, 'vite.config.mts'))
    rmSync(path.join(d, 'vite.config.ts'))
    // the host and step contract live under other file names
    const kit = path.join(d, 'src/presentation-kit')
    cpSync(path.join(kit, 'Presentation.tsx'), path.join(kit, 'engine.tsx'))
    rmSync(path.join(kit, 'Presentation.tsx'))
    cpSync(path.join(kit, 'types.ts'), path.join(kit, 'contract.ts'))
    rmSync(path.join(kit, 'types.ts'))
    // a registry in index.tsx with different formatting
    rmSync(path.join(d, 'src/presentations/index.ts'))
    writeFileSync(
      path.join(d, 'src/presentations/index.tsx'),
      "export const presentations = [{ slug: 'x', title: 'X', load: () => import('./x/Talk.tsx') }]\n",
    )
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('rejects look-alikes: an empty kit entry or a registry with no entries contract', () => {
    const d = full()
    for (const f of walk(path.join(d, 'src/presentation-kit'))) writeFileSync(path.join(d, 'src/presentation-kit', f), '// empty\n')
    writeFileSync(path.join(d, 'src/presentations/index.ts'), 'export const presentations = []\n')
    expect(detectAnchors(d)).toEqual({ build: true, kit: false, index: false })
  })

  it('does not count a package without a working build script, vite, or tsconfig', () => {
    const d = tmp()
    writeFileSync(path.join(d, 'package.json'), JSON.stringify({ scripts: {}, dependencies: { react: '1' } }))
    expect(detectAnchors(d).build).toBe(false)
  })
})

describe('target resolution', () => {
  it('uses the root for an empty or standalone project', () => {
    const empty = tmp()
    expect(resolveTarget(empty).target).toBe(empty)
    const standalone = tmp()
    writeFileSync(path.join(standalone, 'package.json'), JSON.stringify({ name: 'x', dependencies: {} }))
    mkdirSync(path.join(standalone, 'src'))
    expect(resolveTarget(standalone).target).toBe(standalone)
    expect(isMonorepo(standalone)).toBe(false)
  })

  it.each([
    ['package.json workspaces', (d: string) => writeFileSync(path.join(d, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => writeFileSync(path.join(d, 'pnpm-workspace.yaml'), 'packages:\n  - "pkgs/*"\n')],
    ['a packages/ directory', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['an apps/ directory', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('scaffolds a monorepo detected by %s into presentations/', (_n, make) => {
    const d = tmp()
    make(d)
    expect(isMonorepo(d)).toBe(true)
    expect(resolveTarget(d).target).toBe(path.join(d, 'presentations'))
  })

  it('reuses an existing app, at the root or in presentations/', () => {
    const root = full()
    mkdirSync(path.join(root, 'apps'))
    expect(resolveTarget(root).target).toBe(root)
    const mono = tmp()
    mkdirSync(path.join(mono, 'packages'))
    bootstrap(mono, { confirmed: true })
    expect(resolveTarget(mono).target).toBe(path.join(mono, 'presentations'))
    expect(detect(mono).missing).toEqual([])
  })
})

describe('bootstrap', () => {
  it('fully scaffolds an empty directory at the root with the complete dependency set', () => {
    const d = tmp()
    const r = bootstrap(d)
    expect(r.status).toBe('scaffolded')
    expect(detect(d).missing).toEqual([])
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    const all = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const dep of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh', '@eslint/js', 'globals', 'playwright',
    ]) {
      expect(all[dep], dep).toBeTruthy()
    }
    expect(existsSync(path.join(d, 'package-lock.json'))).toBe(true)
    expect(existsSync(path.join(d, 'scripts/verify.mjs'))).toBe(true)
    expect(existsSync(path.join(d, 'scripts/inspect-presentation.mjs'))).toBe(true)
  })

  it('skips an already scaffolded app without touching it', () => {
    const d = full()
    const before = snapshot(d)
    const r = bootstrap(d, { confirmed: true })
    expect(r.status).toBe('complete')
    expect(snapshot(d)).toEqual(before)
  })

  const ANCHOR_REMOVERS: Record<string, (d: string) => void> = {
    build: (d) => rmSync(path.join(d, 'vite.config.ts')),
    kit: (d) => rmSync(path.join(d, 'src/presentation-kit'), { recursive: true }),
    index: (d) => rmSync(path.join(d, 'src/presentations'), { recursive: true }),
  }
  const SENTINEL: Record<string, string> = {
    build: 'tsconfig.app.json',
    kit: 'src/presentation-kit/types.ts',
    index: 'src/presentations/index.ts',
  }
  const subsets = [['build'], ['kit'], ['index'], ['build', 'kit'], ['build', 'index'], ['kit', 'index'], ['build', 'kit', 'index']]
  it.each(subsets)('with %s missing (%#), scaffolds only the missing anchors and leaves present ones byte-identical', (...missing) => {
    const d = full()
    const present = ['build', 'kit', 'index'].filter((a) => !missing.includes(a))
    for (const a of present) writeFileSync(path.join(d, SENTINEL[a]), `// local edit for ${a}\n` + readFileSync(path.join(d, SENTINEL[a]), 'utf8'))
    const pkgBefore = readFileSync(path.join(d, 'package.json'), 'utf8')
    for (const a of missing) ANCHOR_REMOVERS[a](d)
    const edited = Object.fromEntries(present.map((a) => [a, readFileSync(path.join(d, SENTINEL[a]), 'utf8')]))
    const presentFiles = snapshot(d, (f) => missing.includes(anchorOf(f)) || f === 'package.json')
    const r = bootstrap(d, { confirmed: true })
    expect(r.status).toBe('scaffolded')
    expect(detect(d).missing).toEqual([])
    for (const a of present) expect(readFileSync(path.join(d, SENTINEL[a]), 'utf8')).toBe(edited[a])
    for (const [f, text] of Object.entries(presentFiles)) expect(readFileSync(path.join(d, f), 'utf8'), f).toBe(text)
    expect(readFileSync(path.join(d, 'package.json'), 'utf8')).toBe(pkgBefore) // nothing missing to merge
  })

  it('requires confirmation before writing into a non-empty target and writes nothing without it', () => {
    const d = tmp()
    writeFileSync(path.join(d, 'notes.txt'), 'keep me')
    const before = snapshot(d)
    const r = bootstrap(d)
    expect(r.status).toBe('needs-confirmation')
    expect(r.target).toBe(d)
    expect(snapshot(d)).toEqual(before)
    expect(bootstrap(d, { confirmed: true }).status).toBe('scaffolded')
    expect(readFileSync(path.join(d, 'notes.txt'), 'utf8')).toBe('keep me')
  })

  it('also requires confirmation when only the build anchor is missing', () => {
    const d = full()
    rmSync(path.join(d, 'vite.config.ts'))
    expect(bootstrap(d).status).toBe('needs-confirmation')
    expect(existsSync(path.join(d, 'vite.config.ts'))).toBe(false)
    expect(bootstrap(d, { confirmed: true }).status).toBe('scaffolded')
    expect(existsSync(path.join(d, 'vite.config.ts'))).toBe(true)
  })

  it('in a monorepo writes only inside presentations/ and preserves root content', () => {
    const d = tmp()
    writeFileSync(path.join(d, 'package.json'), JSON.stringify({ name: 'mono', workspaces: ['packages/*'] }, null, 2))
    writeFileSync(path.join(d, 'tsconfig.json'), '{"root":true}')
    mkdirSync(path.join(d, 'packages/lib/src'), { recursive: true })
    writeFileSync(path.join(d, 'packages/lib/src/a.ts'), 'export {}')
    const before = snapshot(d)
    const r = bootstrap(d, { confirmed: true })
    expect(r.target).toBe(path.join(d, 'presentations'))
    const after = snapshot(d)
    for (const [f, text] of Object.entries(before)) expect(after[f], f).toBe(text)
    const added = Object.keys(after).filter((f) => !(f in before))
    expect(added.length).toBeGreaterThan(10)
    expect(added.every((f) => f.startsWith('presentations/'))).toBe(true)
    expect(detect(d).missing).toEqual([])
    expect(existsSync(path.join(d, 'presentations/package.json'))).toBe(true)
  })

  it('merges only missing dependencies and scripts into an existing package.json, keeping existing files', () => {
    const d = tmp()
    writeFileSync(
      path.join(d, 'package.json'),
      JSON.stringify({ name: 'mine', scripts: { build: 'echo mine', test: 'x' }, dependencies: { react: '^18.0.0' } }),
    )
    mkdirSync(path.join(d, 'src'))
    writeFileSync(path.join(d, 'src/main.tsx'), '// mine')
    const r = bootstrap(d, { confirmed: true })
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('mine')
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.scripts.build).toBe('echo mine')
    expect(pkg.scripts.test).toBe('x')
    expect(pkg.scripts.verify).toBeTruthy()
    expect(pkg.dependencies.motion).toBeTruthy()
    expect(pkg.devDependencies.playwright).toBeTruthy()
    expect(readFileSync(path.join(d, 'src/main.tsx'), 'utf8')).toBe('// mine')
    expect(r.kept).toContain('src/main.tsx')
    expect(existsSync(path.join(d, 'package-lock.json'))).toBe(false)
  })

  it('classifies template files into anchors', () => {
    expect(anchorOf('src/presentation-kit/Stage.tsx')).toBe('kit')
    expect(anchorOf('src/presentations/index.ts')).toBe('index')
    expect(anchorOf('src/Router.tsx')).toBe('index')
    expect(anchorOf('src/route.ts')).toBe('index')
    expect(anchorOf('vite.config.ts')).toBe('build')
  })
})

describe('template lookup', () => {
  it('resolves bootstrap and presentation templates from the skill directory, whatever the cwd', () => {
    expect(SKILL_DIR).toBe(path.resolve(__dirname, '../../skills/presentation'))
    expect(BOOTSTRAP_DIR).toBe(path.join(SKILL_DIR, 'templates/bootstrap'))
    expect(PRESENTATION_DIR).toBe(path.join(SKILL_DIR, 'templates/presentation'))
    expect(existsSync(path.join(BOOTSTRAP_DIR, 'package.json'))).toBe(true)
    expect(existsSync(path.join(PRESENTATION_DIR, 'Talk.tsx'))).toBe(true)
  })

  it('works when invoked from an unrelated working directory', () => {
    const elsewhere = tmp()
    const target = tmp()
    const script = path.join(SKILL_DIR, 'scripts/scaffold.mjs')
    const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { cwd: elsewhere, encoding: 'utf8' })
    const boot = run('bootstrap', target)
    expect(boot.status).toBe(0)
    expect(detect(target).missing).toEqual([])
    const created = run('create', target, '--slug', 'cli-talk', '--title', 'CLI Talk')
    expect(created.status).toBe(0)
    expect(JSON.parse(created.stdout).route).toBe('/cli-talk')
    expect(JSON.parse(run('list', target).stdout)).toEqual(['cli-talk'])
    const nonEmpty = tmp()
    writeFileSync(path.join(nonEmpty, 'x'), '')
    const gated = run('bootstrap', nonEmpty)
    expect(gated.status).toBe(3)
    expect(JSON.parse(gated.stdout).status).toBe('needs-confirmation')
  })
})

describe('creating presentations', () => {
  it('writes a self-contained folder and registers it above the marker', () => {
    const d = full()
    const r = createPresentation(d, { slug: 'my-talk', title: 'My "Talk"' })
    expect(r.route).toBe('/my-talk')
    const dir = path.join(d, 'src/presentations/my-talk')
    for (const f of ['entities.ts', 'scene.tsx', 'steps/steps.ts', 'Talk.tsx', 'talk.css']) expect(existsSync(path.join(dir, f)), f).toBe(true)
    const talk = readFileSync(path.join(dir, 'Talk.tsx'), 'utf8')
    expect(talk).toContain('title={"My \\"Talk\\""}')
    expect(readFileSync(path.join(dir, 'entities.ts'), 'utf8')).toContain('my-talk-')
    expect(readdirSync(dir).join()).not.toMatch(/__/)
    const reg = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    const lines = reg.split('\n')
    expect(lines.findIndex((l) => l.includes("slug: 'my-talk'"))).toBeLessThan(lines.findIndex((l) => l.includes(REGISTRY_MARKER)))
    expect(listPresentations(d)).toEqual(['my-talk'])
  })

  it('keeps existing registry entries and presentation folders intact when adding another', () => {
    const d = full()
    createPresentation(d, { slug: 'first', title: 'First' })
    createPresentation(d, { slug: 'second', title: 'Second' })
    const firstFiles = snapshot(path.join(d, 'src/presentations/first'))
    const regBefore = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    createPresentation(d, { slug: 'third', title: 'Third' })
    const regAfter = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    for (const line of regBefore.split('\n')) expect(regAfter.split('\n')).toContain(line)
    expect(regAfter.split('\n').length).toBe(regBefore.split('\n').length + 1)
    expect(listPresentations(d)).toEqual(['first', 'second', 'third'])
    expect(snapshot(path.join(d, 'src/presentations/first'))).toEqual(firstFiles)
  })

  it('creates inside presentations/ for a monorepo', () => {
    const d = tmp()
    mkdirSync(path.join(d, 'apps'))
    bootstrap(d, { confirmed: true })
    const r = createPresentation(d, { slug: 'm', title: 'M' })
    expect(r.target).toBe(path.join(d, 'presentations'))
    expect(existsSync(path.join(d, 'presentations/src/presentations/m/Talk.tsx'))).toBe(true)
    expect(existsSync(path.join(d, 'src'))).toBe(false)
  })

  it('refuses duplicate slugs, invalid slugs, a missing scaffold, and a registry without the marker', () => {
    const d = full()
    createPresentation(d, { slug: 'dup', title: 'D' })
    const reg = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(() => createPresentation(d, { slug: 'dup', title: 'D' })).toThrow(/already exists/)
    for (const bad of ['Bad Slug', '../x', '', 'a--b', '-a', 'A']) {
      expect(() => createPresentation(d, { slug: bad, title: 'x' }), bad).toThrow(/invalid slug/)
    }
    expect(readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')).toBe(reg)
    expect(() => createPresentation(tmp(), { slug: 'ok', title: 'x' })).toThrow(/incomplete/)
    writeFileSync(path.join(d, 'src/presentations/index.ts'), "export const presentations = [{ slug: 'x', title: 'x', load: () => import('./x/Talk.tsx') }]\n")
    expect(() => createPresentation(d, { slug: 'fresh', title: 'x' })).toThrow(/registry has no/)
    expect(existsSync(path.join(d, 'src/presentations/fresh'))).toBe(false)
  })
})

describe('audit regressions', () => {
  it('puts a monorepo with only a Vite build into presentations/, leaving the root alone', () => {
    const d = full()
    rmSync(path.join(d, 'src/presentation-kit'), { recursive: true })
    rmSync(path.join(d, 'src/presentations'), { recursive: true })
    mkdirSync(path.join(d, 'packages'))
    expect(detectAnchors(d).build).toBe(true)
    expect(resolveTarget(d).target).toBe(path.join(d, 'presentations'))
    const before = snapshot(d)
    expect(bootstrap(d).status).toBe('needs-confirmation')
    expect(bootstrap(d, { confirmed: true }).target).toBe(path.join(d, 'presentations'))
    const after = snapshot(d)
    for (const [f, text] of Object.entries(before)) expect(after[f], f).toBe(text)
    expect(Object.keys(after).filter((f) => !(f in before)).every((f) => f.startsWith('presentations/'))).toBe(true)
  })

  it('confirms before writing into a non-empty monorepo even when presentations/ does not exist yet', () => {
    const d = tmp()
    mkdirSync(path.join(d, 'apps'))
    writeFileSync(path.join(d, 'README.md'), 'root')
    const r = bootstrap(d)
    expect(r.status).toBe('needs-confirmation')
    expect(r.target).toBe(path.join(d, 'presentations'))
    expect(existsSync(path.join(d, 'presentations'))).toBe(false)
  })

  function ordinaryViteApp(withMain: boolean) {
    const d = tmp()
    writeFileSync(
      path.join(d, 'package.json'),
      JSON.stringify({ name: 'plain', scripts: { build: 'tsc -b && vite build' }, dependencies: { react: '^19.0.0' }, devDependencies: { vite: '^8.0.0', typescript: '~6.0.0' } }),
    )
    writeFileSync(path.join(d, 'vite.config.ts'), 'export default {}')
    writeFileSync(path.join(d, 'tsconfig.json'), '{}')
    mkdirSync(path.join(d, 'src'))
    if (withMain) writeFileSync(path.join(d, 'src/main.tsx'), "import App from './App.tsx'\nconsole.log(App)\n")
    return d
  }

  it('connects an ordinary Vite app: copies the verification scripts, never references absent ones, and flags the entry wiring', () => {
    const d = ordinaryViteApp(true)
    expect(detectAnchors(d)).toEqual({ build: true, kit: false, index: false })
    const r = bootstrap(d, { confirmed: true })
    expect(r.status).toBe('scaffolded')
    expect(detect(d).missing).toEqual([])
    expect(r.kept).toContain('src/main.tsx')
    expect(readFileSync(path.join(d, 'src/main.tsx'), 'utf8')).toContain('./App.tsx') // untouched
    expect(r.notes.join(' ')).toMatch(/src\/main\.tsx was kept.*Router/)
    for (const f of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'src/Router.tsx', 'src/route.ts', 'src/Landing.tsx']) {
      expect(existsSync(path.join(d, f)), f).toBe(true)
    }
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    for (const cmd of Object.values<string>(pkg.scripts)) {
      const file = /(scripts\/[\w.-]+\.mjs)/.exec(cmd)?.[1]
      if (file) expect(existsSync(path.join(d, file)), cmd).toBe(true)
    }
    expect(pkg.scripts.verify).toBeTruthy()
  })

  it('installs the router entry point when the app has none, and reports no wiring note', () => {
    const d = ordinaryViteApp(false)
    const r = bootstrap(d, { confirmed: true })
    expect(readFileSync(path.join(d, 'src/main.tsx'), 'utf8')).toContain('<Router')
    expect(r.notes).toEqual([])
  })

  it('does not add npm scripts for scripts it did not copy', () => {
    const d = full()
    rmSync(path.join(d, 'src/presentations'), { recursive: true }) // only the index anchor is missing
    rmSync(path.join(d, 'scripts'), { recursive: true })
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    delete pkg.scripts.verify
    delete pkg.scripts.inspect
    writeFileSync(path.join(d, 'package.json'), JSON.stringify(pkg))
    bootstrap(d, { confirmed: true })
    const after = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(existsSync(path.join(d, 'scripts/verify.mjs'))).toBe(true)
    expect(after.scripts.verify).toBeTruthy()
  })

  it('writes titles with quotes, backslashes and braces as valid JSX', () => {
    const d = full()
    const title = 'The "Big" \\ {Idea} </b>'
    createPresentation(d, { slug: 'quoted', title })
    const talkFile = path.join(d, 'src/presentations/quoted/Talk.tsx')
    const out = ts.transpileModule(readFileSync(talkFile, 'utf8'), {
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
      fileName: talkFile,
    })
    expect(out.diagnostics).toEqual([])
    expect(out.outputText).toContain(JSON.stringify(title))
    const registry = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain(`title: ${JSON.stringify(title)}`)
  })

  it('registers, lists and creates against an index.tsx registry', () => {
    const d = full()
    const reg = path.join(d, 'src/presentations')
    writeFileSync(path.join(reg, 'index.tsx'), readFileSync(path.join(reg, 'index.ts'), 'utf8'))
    rmSync(path.join(reg, 'index.ts'))
    createPresentation(d, { slug: 'tsx-reg', title: 'T' })
    expect(readFileSync(path.join(reg, 'index.tsx'), 'utf8')).toContain("slug: 'tsx-reg'")
    expect(listPresentations(d)).toEqual(['tsx-reg'])
  })
})
