import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  createPresentation, detect, detectAnchors, scaffold,
} from '../../skills/presentation/scripts/setup.mjs'

let tmp: string
beforeEach(() => {
  tmp = mkdtempSync(path.join(os.tmpdir(), 'setup-'))
})
afterEach(() => rmSync(tmp, { recursive: true, force: true }))

const write = (rel: string, text: string) => {
  const file = path.join(tmp, rel)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, text)
}
const read = (rel: string) => readFileSync(path.join(tmp, rel), 'utf8')
const BUILD_PKG = {
  name: 'host',
  scripts: { build: 'tsc -b && vite build' },
  dependencies: { react: '^18.0.0' },
  devDependencies: { vite: '^5.0.0', typescript: '^5.0.0' },
}

describe('detect', () => {
  it('scaffolds an empty directory at the root without needing confirmation (I-33, I-40)', () => {
    const d = detect(tmp)
    expect(d.target).toBe(tmp)
    expect(d.missing).toEqual(['build', 'kit', 'index'])
    expect(d.needsConfirmation).toBe(false)
  })

  it('treats a fully scaffolded app as ready: nothing missing, nothing written (I-32, I-34)', () => {
    scaffold(tmp, { install: false })
    expect(detect(tmp)).toMatchObject({ missing: [], target: tmp, needsConfirmation: false })
    const again = scaffold(tmp, { install: false })
    expect(again.written).toEqual([])
    expect(again.merged).toEqual([])
  })

  it('accepts renamed or reformatted implementations of the contract (I-32)', () => {
    scaffold(tmp, { install: false })
    const kit = path.join(tmp, 'src/presentation-kit')
    renameSync(path.join(kit, 'Presentation.tsx'), path.join(kit, 'Deck.tsx'))
    renameSync(path.join(kit, 'Stage.tsx'), path.join(kit, 'Host.tsx'))
    rmSync(path.join(tmp, 'src/presentations/index.ts'))
    write('src/presentations/index.tsx', 'export const presentations = []\n')
    const pkg = JSON.parse(read('package.json'))
    pkg.dependencies.extra = '1.0.0'
    write('package.json', JSON.stringify(pkg))
    expect(detectAnchors(tmp)).toEqual({ build: true, kit: true, index: true })
  })

  it('rejects stubs that do not implement the contract (I-32)', () => {
    write('package.json', JSON.stringify(BUILD_PKG))
    write('src/presentation-kit/Presentation.tsx', 'export {}\n')
    write('src/presentation-kit/types.ts', 'export {}\n')
    write('src/presentations/index.ts', 'export {}\n')
    expect(detectAnchors(tmp)).toEqual({ build: true, kit: false, index: false })
    scaffold(tmp, { install: false })
    expect(detectAnchors(tmp).kit).toBe(false)
    expect(read('src/presentation-kit/Presentation.tsx')).toBe('export {}\n')
  })

  it('scaffolds a non-empty standalone project at its root after confirmation (I-40, I-41)', () => {
    write('package.json', JSON.stringify({ name: 'x', scripts: {} }))
    write('notes.md', 'keep me')
    const d = detect(tmp)
    expect(d.target).toBe(tmp)
    expect(d.needsConfirmation).toBe(true)
  })

  it.each([
    ['workspaces', () => write('package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', () => write('pnpm-workspace.yaml', 'packages:\n  - "packages/*"\n')],
    ['packages/ layout', () => { write('package.json', '{}'); write('packages/a/index.ts', '') }],
    ['apps/ layout', () => { write('package.json', '{}'); write('apps/a/index.ts', '') }],
  ])('scaffolds a self-contained presentations/ app inside a monorepo (%s) (I-39, I-41)', (_name, setup) => {
    setup()
    write('README.md', 'root content')
    const before = read('README.md')
    const d = detect(tmp)
    expect(d.target).toBe(path.join(tmp, 'presentations'))
    expect(d.needsConfirmation).toBe(true)
    scaffold(d.target, { install: false })
    expect(existsSync(path.join(tmp, 'presentations', 'src', 'presentation-kit', 'Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(tmp, 'src'))).toBe(false)
    expect(read('README.md')).toBe(before)
    expect(detect(tmp).missing).toEqual([])
  })

  it('reuses an existing presentations/ app in a monorepo (I-39)', () => {
    write('package.json', JSON.stringify({ workspaces: ['presentations'] }))
    scaffold(path.join(tmp, 'presentations'), { install: false })
    const d = detect(tmp)
    expect(d.target).toBe(path.join(tmp, 'presentations'))
    expect(d.missing).toEqual([])
  })
})

describe('scaffold', () => {
  it('writes a complete style-neutral app with all anchors (I-33, I-36, I-37)', () => {
    const r = scaffold(tmp, { install: false })
    expect(r.installed).toBe(false)
    expect(detectAnchors(tmp)).toEqual({ build: true, kit: true, index: true })
    const pkg = JSON.parse(read('package.json'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names).toEqual(expect.arrayContaining(['react', 'motion', 'lucide-react', 'vite', 'playwright', 'eslint']))
    expect(names.some((n) => /tailwind/.test(n))).toBe(false)
    expect(existsSync(path.join(tmp, 'package-lock.json'))).toBe(true)
  })

  it('adds only the missing anchors, with their dependencies and tooling (I-35)', () => {
    write('package.json', JSON.stringify(BUILD_PKG, null, 2))
    write('vite.config.ts', '// mine')
    write('src/index.css', '/* mine */')
    const r = scaffold(tmp, { install: false })
    expect(read('vite.config.ts')).toBe('// mine')
    expect(read('src/index.css')).toBe('/* mine */')
    expect(r.written.some((f: string) => f.startsWith('src/presentation-kit/'))).toBe(true)
    expect(r.written).toContain('src/presentations/index.ts')
    expect(r.written).toContain('scripts/verify.mjs')
    expect(r.written).not.toContain('vite.config.ts')
    expect(r.written).not.toContain('package-lock.json')
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.dependencies.react).toBe('^18.0.0')
    for (const dep of ['motion', 'lucide-react']) expect(pkg.dependencies[dep], dep).toBeTruthy()
    for (const dep of ['playwright', 'eslint']) expect(pkg.devDependencies[dep], dep).toBeTruthy()
    expect(pkg.scripts.verify).toContain('verify.mjs')
    expect(detectAnchors(tmp)).toEqual({ build: true, kit: true, index: true })
  })

  it('also completes dependencies when only the index is missing (I-35)', () => {
    scaffold(tmp, { install: false })
    const pkg = JSON.parse(read('package.json'))
    delete pkg.dependencies.motion
    write('package.json', JSON.stringify(pkg))
    rmSync(path.join(tmp, 'src/presentations'), { recursive: true })
    const r = scaffold(tmp, { install: false })
    expect(r.merged).toContain('dependencies.motion')
    expect(detectAnchors(tmp).index).toBe(true)
  })

  it('keeps an existing entry module as the host and routes presentations to the kit (I-35, I-42)', () => {
    write('package.json', JSON.stringify(BUILD_PKG))
    write('index.html', '<div id="root"></div><script type="module" src="/src/main.tsx"></script>')
    const host = "import './index.css'\nconsole.log('host app')\n"
    write('src/main.tsx', host)
    const r = scaffold(tmp, { install: false })
    expect(read('src/main.host.tsx')).toBe(host)
    expect(read('src/main.tsx')).toMatch(/resolveRoute\(window\.location\.pathname, presentations\)/)
    expect(read('src/main.tsx')).toContain("import('./main.host')")
    expect(read('src/main.presentation.tsx')).toContain("from './Root'")
    expect(r.wired).toMatchObject({ entry: 'src/main.tsx', host: 'src/main.host.tsx' })
    expect(r.written).toContain('src/Root.tsx')
    expect(read('index.html')).toContain('/src/main.tsx')
    const again = scaffold(tmp, { install: false })
    expect(again.wired).toBeNull()
    expect(read('src/main.host.tsx')).toBe(host)
  })

  it('wraps whichever module index.html names as the entry (I-42)', () => {
    write('package.json', JSON.stringify(BUILD_PKG))
    write('index.html', '<script type="module" src="/src/boot/index.tsx"></script>')
    write('src/boot/index.tsx', 'export {}\n')
    scaffold(tmp, { install: false })
    expect(existsSync(path.join(tmp, 'src/boot/index.host.tsx'))).toBe(true)
    expect(read('src/boot/index.tsx')).toContain("from '../presentations'")
    expect(read('src/boot/main.presentation.tsx')).toContain("from '../Root'")
  })

  it('merges missing dependencies without changing existing versions (I-33)', () => {
    write('package.json', JSON.stringify({ name: 'host', scripts: { build: 'x' }, dependencies: { react: '^17.0.0' } }))
    const r = scaffold(tmp, { install: false })
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies.react).toBe('^17.0.0')
    expect(pkg.scripts.build).toBe('x')
    expect(pkg.dependencies.motion).toBeTruthy()
    expect(pkg.devDependencies.playwright).toBeTruthy()
    expect(r.merged).toContain('dependencies.motion')
    expect(r.merged).not.toContain('dependencies.react')
  })

  it('reports an invalid package.json clearly and writes nothing (I-33)', () => {
    write('package.json', '{ not json')
    expect(() => scaffold(tmp, { install: false })).toThrow(/not valid JSON/)
    expect(existsSync(path.join(tmp, 'src'))).toBe(false)
  })

  it('does not change the module type of an existing package.json (I-33)', () => {
    write('package.json', JSON.stringify({ name: 'cjs', scripts: { build: 'x' } }))
    scaffold(tmp, { install: false })
    expect(JSON.parse(read('package.json')).type).toBeUndefined()
  })

  it('resolves templates from the skill directory, independent of the cwd (I-38)', () => {
    const script = path.resolve('skills/presentation/scripts/setup.mjs')
    const target = path.join(tmp, 'app')
    const r = spawnSync(process.execPath, [script, 'scaffold', target, '--no-install'], {
      cwd: os.tmpdir(),
      encoding: 'utf8',
    })
    expect(r.status, r.stderr).toBe(0)
    expect(detectAnchors(target)).toEqual({ build: true, kit: true, index: true })
  })
})

describe('create', () => {
  const entry = (slug: string) => `"slug": "${slug}"`.replace('"slug"', 'slug')

  it('writes a self-contained folder, registers it and keeps existing presentations (I-42, I-43, I-44)', () => {
    scaffold(tmp, { install: false })
    const kitBefore = read('src/presentation-kit/Presentation.tsx')
    createPresentation(tmp, 'my-topic', "Bob's Topic")
    for (const f of ['entities.ts', 'steps/index.ts', 'steps/Scene.tsx', 'Talk.tsx', 'talk.css']) {
      expect(existsSync(path.join(tmp, 'src/presentations/my-topic', f)), f).toBe(true)
    }
    const index = read('src/presentations/index.ts')
    expect(index).toContain(entry('starter').replace(/'/g, '"'))
    expect(index).toContain('slug: "my-topic"')
    expect(index).toContain("import('./my-topic/Talk')")
    expect(index).toContain('title: "Bob\'s Topic"')
    expect(read('src/presentations/my-topic/steps/index.ts')).toContain("groupKey: '__SLUG__'".replace('__SLUG__', 'my-topic'))
    expect(read('src/presentation-kit/Presentation.tsx')).toBe(kitBefore)
    expect(existsSync(path.join(tmp, 'src/presentations/starter/Talk.tsx'))).toBe(true)
    expect(read('src/presentations/my-topic/Talk.tsx')).not.toContain('__')
  })

  it('writes titles with quotes, backslashes and comment terminators as valid code (I-42, I-49)', () => {
    scaffold(tmp, { install: false })
    const title = 'He said "hi" \\ it\'s */ done'
    createPresentation(tmp, 'quoted', title)
    const talk = read('src/presentations/quoted/Talk.tsx')
    expect(talk).toContain(`title={${JSON.stringify(title)}}`)
    const index = read('src/presentations/index.ts')
    expect(index).toContain(`title: ${JSON.stringify(title)}`)
    expect(read('src/presentations/quoted/entities.ts')).not.toContain('*/ done')
    expect(read('src/presentations/quoted/talk.css')).not.toContain('done')
  })

  it('ships the presentation stylesheet as comments only, and can omit it', () => {
    scaffold(tmp, { install: false })
    createPresentation(tmp, 'plain', 'Plain', { styled: false })
    expect(existsSync(path.join(tmp, 'src/presentations/plain/talk.css'))).toBe(false)
    expect(read('src/presentations/plain/Talk.tsx')).not.toContain('talk.css')
    createPresentation(tmp, 'styled', 'Styled')
    expect(read('src/presentations/styled/Talk.tsx')).toContain("import './talk.css'")
    expect(read('src/presentations/styled/talk.css').replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe('')
  })

  it('rejects bad or duplicate slugs and a missing index without writing', () => {
    expect(() => createPresentation(tmp, 'x', 'X')).toThrow(/index is missing/)
    scaffold(tmp, { install: false })
    expect(() => createPresentation(tmp, 'Bad Slug', 'X')).toThrow(/kebab-case/)
    expect(() => createPresentation(tmp, 'starter', 'X')).toThrow(/already exists/)
    expect(existsSync(path.join(tmp, 'src/presentations/Bad Slug'))).toBe(false)
  })

  it('detects an already-registered slug whatever its quoting or folder (I-42, I-44)', () => {
    scaffold(tmp, { install: false })
    const index = read('src/presentations/index.ts')
    write(
      'src/presentations/index.ts',
      index.replace(
        /\]\s*$/,
        '  { "slug": "taken", slug: "taken", title: "T", load: () => import("./elsewhere/Talk") },\n]\n',
      ),
    )
    const before = read('src/presentations/index.ts')
    expect(() => createPresentation(tmp, 'taken', 'Taken')).toThrow(/already registered/)
    expect(read('src/presentations/index.ts')).toBe(before)
    expect(existsSync(path.join(tmp, 'src/presentations/taken'))).toBe(false)
  })
})
