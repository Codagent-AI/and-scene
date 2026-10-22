// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BOOTSTRAP_DIR,
  PRESENTATION_TEMPLATE_DIR,
  SKILL_DIR,
  createPresentation,
  detectAnchors,
  mergePackageJson,
  resolveTarget,
  scaffold,
  slugify,
} from '../../skills/presentation/scripts/lib.mjs'

let dir
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-lib-'))
})
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

const write = (rel, text = '') => {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  fs.writeFileSync(path.join(dir, rel), text)
}
const read = (rel) => fs.readFileSync(path.join(dir, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(dir, rel))
const viteApp = { scripts: { build: 'vite build' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } }

describe('template lookup', () => {
  it('resolves bootstrap and presentation templates from the skill directory, whatever the cwd', () => {
    const before = process.cwd()
    try {
      process.chdir(dir)
      expect(SKILL_DIR).toBe(path.resolve(import.meta.dirname, '../../skills/presentation'))
      expect(fs.existsSync(path.join(BOOTSTRAP_DIR, 'package.json'))).toBe(true)
      expect(fs.existsSync(path.join(PRESENTATION_TEMPLATE_DIR, 'Talk.tsx'))).toBe(true)
      expect(path.isAbsolute(BOOTSTRAP_DIR)).toBe(true)
    } finally {
      process.chdir(before)
    }
  })
})

describe('detectAnchors', () => {
  it('finds nothing in an empty directory', () => {
    expect(detectAnchors(dir)).toEqual({ build: false, kit: false, index: false })
  })

  it('recognises a full scaffold, then a cosmetically different equivalent', () => {
    scaffold(dir)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    // Rename kit files and add an extra dependency: still the same contract.
    fs.renameSync(path.join(dir, 'src/presentation-kit/Stage.tsx'), path.join(dir, 'src/presentation-kit/Host.tsx'))
    const pkg = JSON.parse(read('package.json'))
    pkg.dependencies.extra = '1'
    write('package.json', JSON.stringify(pkg))
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not count a kit with a missing piece of the contract', () => {
    scaffold(dir)
    fs.rmSync(path.join(dir, 'src/presentation-kit/Stage.tsx'))
    expect(detectAnchors(dir).kit).toBe(false)
  })

  it('needs vite, react and typescript plus a build script for the build anchor', () => {
    write('package.json', JSON.stringify({ ...viteApp, scripts: {} }))
    expect(detectAnchors(dir).build).toBe(false)
    write('package.json', JSON.stringify(viteApp))
    expect(detectAnchors(dir).build).toBe(true)
  })
})

describe('resolveTarget', () => {
  it('scaffolds at the root of an empty directory without asking', () => {
    const r = resolveTarget(dir)
    expect(r).toMatchObject({ target: dir, kind: 'root', confirm: false })
    expect(r.missing).toEqual(['build', 'kit', 'index'])
  })

  it('scaffolds at the root of a standalone non-empty project and asks first', () => {
    write('package.json', JSON.stringify(viteApp))
    write('src/main.tsx', 'x')
    const r = resolveTarget(dir)
    expect(r).toMatchObject({ target: dir, kind: 'root', confirm: true, missing: ['kit', 'index'] })
  })

  it.each([
    ['workspaces', () => write('package.json', JSON.stringify({ ...viteApp, workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', () => write('pnpm-workspace.yaml', 'packages:\n  - "x"\n')],
    ['packages/', () => write('packages/a/index.ts', '')],
    ['apps/', () => write('apps/a/index.ts', '')],
  ])('picks a self-contained presentations/ app for a monorepo signalled by %s', (_name, make) => {
    write('README.md', 'unrelated')
    make()
    const r = resolveTarget(dir)
    expect(r).toMatchObject({ target: path.join(dir, 'presentations'), kind: 'monorepo-subapp', confirm: true })
  })

  it('does not treat a monorepo root that only has the build anchor as an existing app', () => {
    write('package.json', JSON.stringify({ ...viteApp, workspaces: ['packages/*'] }))
    expect(resolveTarget(dir).kind).toBe('monorepo-subapp')
  })

  it('reuses an existing presentation app, and one under presentations/', () => {
    scaffold(dir)
    expect(resolveTarget(dir)).toMatchObject({ target: dir, kind: 'existing-app', confirm: false, missing: [] })
    const nested = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-nested-'))
    try {
      fs.writeFileSync(path.join(nested, 'README.md'), 'x')
      fs.mkdirSync(path.join(nested, 'packages'))
      scaffold(path.join(nested, 'presentations'))
      expect(resolveTarget(nested)).toMatchObject({ target: path.join(nested, 'presentations'), kind: 'existing-app' })
    } finally {
      fs.rmSync(nested, { recursive: true, force: true })
    }
  })

  it('finds the app from a directory inside it', () => {
    scaffold(dir)
    expect(resolveTarget(path.join(dir, 'src', 'presentations')).target).toBe(dir)
  })
})

describe('scaffold', () => {
  it('writes the full bootstrap into an empty directory, lock file included', () => {
    const { written } = scaffold(dir)
    for (const rel of ['package.json', 'package-lock.json', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(written).toContain(rel)
      expect(exists(rel)).toBe(true)
    }
  })

  it('adds only the missing anchors and leaves present content byte-for-byte alone', () => {
    write('package.json', JSON.stringify({ ...viteApp, dependencies: { react: '^18.0.0' } }, null, 2))
    write('vite.config.ts', 'SENTINEL-vite')
    write('src/unrelated.ts', 'SENTINEL-unrelated')
    const result = scaffold(dir, ['kit', 'index'])
    expect(read('vite.config.ts')).toBe('SENTINEL-vite')
    expect(read('src/unrelated.ts')).toBe('SENTINEL-unrelated')
    expect(exists('src/presentation-kit/Presentation.tsx')).toBe(true)
    expect(exists('src/presentations/index.ts')).toBe(true)
    expect(exists('package-lock.json')).toBe(false)
    expect(result.written).not.toContain('vite.config.ts')
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.dependencies.motion).toBeDefined()
    expect(pkg.dependencies['lucide-react']).toBeDefined()
    expect(pkg.devDependencies.playwright).toBeDefined()
    expect(result.addedDependencies).toContain('dependencies.motion')
  })

  it('never overwrites an existing file, even one an anchor would have written', () => {
    write('src/presentations/index.ts', 'SENTINEL-index')
    const { skipped } = scaffold(dir, ['index'])
    expect(read('src/presentations/index.ts')).toBe('SENTINEL-index')
    expect(skipped).toContain('src/presentations/index.ts')
  })

  it('is a no-op when all anchors are present and dependencies are declared', () => {
    scaffold(dir)
    const before = read('package.json')
    const result = scaffold(dir)
    expect(result.written).toEqual([])
    expect(result.addedDependencies).toEqual([])
    expect(read('package.json')).toBe(before)
  })

  it('declares the complete dependency set in the bootstrap package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(BOOTSTRAP_DIR, 'package.json'), 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) {
      expect(names, name).toContain(name)
    }
  })
})

describe('mergePackageJson', () => {
  it('keeps declared versions and scripts and adds the rest', () => {
    const { merged, added } = mergePackageJson(
      { scripts: { build: 'mine' }, dependencies: { motion: '^1.0.0' } },
      { type: 'module', scripts: { build: 'theirs', verify: 'v' }, dependencies: { motion: '^12', react: '^19' } },
    )
    expect(merged.scripts).toEqual({ build: 'mine', verify: 'v' })
    expect(merged.dependencies).toEqual({ motion: '^1.0.0', react: '^19' })
    expect(added).toEqual(['dependencies.react', 'scripts.verify'])
    expect(merged.type).toBe('module')
  })
})

describe('createPresentation', () => {
  beforeEach(() => scaffold(dir))

  it('writes a self-contained folder and one registry line, routed at /<slug>', () => {
    const result = createPresentation(dir, { slug: 'my-talk', title: "It's a Talk" })
    expect(result.route).toBe('/my-talk')
    for (const rel of ['Talk.tsx', 'entities.ts', 'Scene.tsx', 'my-talk.css', 'steps/index.ts', 'steps/01-opening.ts']) {
      expect(exists(`src/presentations/my-talk/${rel}`), rel).toBe(true)
    }
    expect(read('src/presentations/my-talk/Talk.tsx')).toContain("./my-talk.css")
    expect(read('src/presentations/my-talk/entities.ts')).toContain("my-talk:topic")
    const index = read('src/presentations/index.ts')
    expect(index).toMatch(/slug: 'my-talk'/)
    expect(index).toContain("title: 'It\\'s a Talk'")
    expect(index).toContain("import('./my-talk/Talk.tsx')")
  })

  it('keeps existing registry entries and folders untouched when another is added', () => {
    createPresentation(dir, { slug: 'first', title: 'First' })
    const firstFolder = read('src/presentations/first/Talk.tsx')
    const before = read('src/presentations/index.ts')
    createPresentation(dir, { slug: 'second', title: 'Second' })
    const after = read('src/presentations/index.ts')
    expect(after).toContain(before.slice(before.indexOf('{'), before.lastIndexOf('}') + 1))
    expect(read('src/presentations/first/Talk.tsx')).toBe(firstFolder)
    expect([...after.matchAll(/slug: '([^']+)'/g)].map((m) => m[1])).toEqual(['first', 'second'])
  })

  it('refuses a colliding slug or folder and changes nothing', () => {
    createPresentation(dir, { slug: 'first', title: 'First' })
    const index = read('src/presentations/index.ts')
    const talk = read('src/presentations/first/Talk.tsx')
    expect(() => createPresentation(dir, { slug: 'first', title: 'Other' })).toThrow(/already exists/)
    fs.mkdirSync(path.join(dir, 'src/presentations/orphan'))
    expect(() => createPresentation(dir, { slug: 'orphan', title: 'O' })).toThrow(/already exists/)
    write('src/presentations/index.ts', index.replace("slug: 'first'", "slug: 'taken'"))
    expect(() => createPresentation(dir, { slug: 'taken', title: 'T' })).toThrow(/already registered/)
    expect(read('src/presentations/first/Talk.tsx')).toBe(talk)
  })

  it('rejects invalid input and a missing index', () => {
    expect(() => createPresentation(dir, { slug: 'Bad Slug', title: 'T' })).toThrow(/invalid slug/)
    expect(() => createPresentation(dir, { slug: 'ok', title: ' ' })).toThrow(/title/)
    fs.rmSync(path.join(dir, 'src/presentations/index.ts'))
    expect(() => createPresentation(dir, { slug: 'ok', title: 'T' })).toThrow(/scaffold first/)
  })
})

describe('slugify', () => {
  it('makes URL-safe slugs', () => {
    expect(slugify("How to Use This Skill!  (v2)")).toBe('how-to-use-this-skill-v2')
  })
})
