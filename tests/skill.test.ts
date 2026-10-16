import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM scripts without type declarations
import { detectAnchors, resolveTarget } from '../skills/presentation/scripts/detect.mjs'
// @ts-expect-error plain ESM scripts without type declarations
import { scaffold } from '../skills/presentation/scripts/scaffold.mjs'
import { REPO, isTest, walk } from './helpers'

const SKILL = path.join(REPO, 'skills/presentation')
const BOOT = path.join(SKILL, 'templates/bootstrap')
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-skill-'))
const write = (dir: string, rel: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  fs.writeFileSync(path.join(dir, rel), content)
}
const monorepoRoot = () => {
  const dir = tmp()
  write(dir, 'package.json', JSON.stringify({ name: 'mono', workspaces: ['packages/*'], scripts: { build: 'vite build' }, devDependencies: { vite: '1', react: '1', typescript: '1' } }, null, 2))
  write(dir, 'vite.config.ts', 'export default {}')
  write(dir, 'README.md', 'unrelated root content')
  write(dir, 'packages/a/index.ts', 'export {}')
  return dir
}

describe('SKILL.md contract', () => {
  const text = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8')
  it('has skill frontmatter', () => {
    expect(text).toMatch(/^---\nname: presentation\ndescription: .+\n---/)
  })
  it.each([
    ['one question at a time', /one question (per message|at a time)/i],
    ['partial detail', /partial detail/i],
    ['ASCII mockups', /ASCII mockup/],
    ['three anchors', /Build setup[\s\S]*Scene kit[\s\S]*Presentation index/],
    ['monorepo target', /monorepo[\s\S]*presentations\//],
    ['confirm before writing', /confirm before writing/i],
    ['skill-relative templates', /relative to \*\*this file's directory\*\*/],
    ['dependencies not assumed', /Never assume the dependencies/],
    ['no styling framework by default', /Tailwind/],
    ['modify lists candidates', /list the registered presentations/],
    ['first/last/dense inspection', /first step, the last step, and every dense or key step/],
    ['narrow viewport', /--viewport 390x844/],
    ['project-local helper', /npm run inspect/],
    ['allow-overlap marker', /data-presentation-allow-overlap/],
    ['no success while failing', /Never report success while a check fails/],
  ])('covers %s', (_n, re) => expect(text).toMatch(re))
})

describe('anchor detection and target resolution', () => {
  it('scaffolds an empty directory at its root with all anchors', () => {
    const dir = tmp()
    const r = resolveTarget(dir)
    expect(r.target).toBe(dir)
    expect(r.missing).toEqual(['build', 'kit', 'index'])
    expect(r.needsConfirmation).toBe(false)
    scaffold(dir, r.missing)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(resolveTarget(dir).missing).toEqual([])
  })

  it('skips scaffolding when all anchors exist, tolerating cosmetic differences', () => {
    const dir = tmp()
    scaffold(dir, ['build', 'kit', 'index'])
    fs.renameSync(path.join(dir, 'src/presentation-kit/index.ts'), path.join(dir, 'src/presentation-kit/index.tsx'))
    write(dir, 'src/extra.ts', '// extra file and deps do not matter')
    expect(resolveTarget(dir).missing).toEqual([])
  })

  it('detects contracts, not file names: a renamed kit directory and registry file still count', () => {
    const dir = tmp()
    scaffold(dir, ['build', 'kit', 'index'])
    fs.renameSync(path.join(dir, 'src/presentation-kit'), path.join(dir, 'src/scene-kit'))
    fs.renameSync(path.join(dir, 'src/presentations/index.ts'), path.join(dir, 'src/presentations/registry.ts'))
    for (const f of walk(path.join(dir, 'src'), (x) => /\.tsx?$/.test(x))) {
      const t = fs.readFileSync(f, 'utf8').replaceAll("presentation-kit'", "scene-kit'").replace("from './presentations'", "from './presentations/registry'")
      fs.writeFileSync(f, t)
    }
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not count a registry the entry point never reaches', () => {
    const dir = tmp()
    scaffold(dir, ['build', 'kit'])
    write(dir, 'src/main.tsx', "console.log('own app')\n")
    write(dir, 'src/presentations/index.ts', "export const p = [{ slug: 'a', load: () => import('./a') }]\n")
    expect(detectAnchors(dir).index).toBe(false)
  })

  it('wires an existing entry point to the router, keeping its app for other paths', () => {
    const dir = tmp()
    scaffold(dir, ['build'])
    const own = "document.getElementById('root')!.textContent = 'mine'\n"
    write(dir, 'src/main.tsx', own)
    const r = scaffold(dir, ['kit', 'index'])
    expect(fs.readFileSync(path.join(dir, 'src/app-main.tsx'), 'utf8')).toBe(own)
    expect(fs.readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toContain("import('./app-main')")
    expect(r.written.some((w: string) => w.includes('router entry'))).toBe(true)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('replaces a .ts entry with a .tsx router entry and repoints index.html', () => {
    const dir = tmp()
    scaffold(dir, ['build'])
    write(dir, 'index.html', '<script type="module" src="/src/main.ts"></script>')
    write(dir, 'src/main.ts', "console.log('mine')\n")
    scaffold(dir, ['kit', 'index'])
    expect(fs.existsSync(path.join(dir, 'src/main.ts'))).toBe(false)
    expect(fs.readFileSync(path.join(dir, 'src/app-main.ts'), 'utf8')).toContain('mine')
    expect(fs.readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toContain("import('./app-main')")
    expect(fs.readFileSync(path.join(dir, 'index.html'), 'utf8')).toContain('/src/main.tsx')
    expect(detectAnchors(dir).index).toBe(true)
  })

  it('scaffolds a monorepo into presentations/ and preserves the root', () => {
    const dir = monorepoRoot()
    const before = Object.fromEntries(walk(dir).map((f) => [f, fs.readFileSync(f, 'utf8')]))
    const r = resolveTarget(dir)
    expect(r.target).toBe(path.join(dir, 'presentations'))
    expect(r.anchors).toEqual({ build: false, kit: false, index: false })
    expect(r.needsConfirmation).toBe(true)
    scaffold(r.target, r.missing)
    expect(detectAnchors(r.target)).toEqual({ build: true, kit: true, index: true })
    for (const [f, content] of Object.entries(before)) expect(fs.readFileSync(f, 'utf8')).toBe(content)
    expect(resolveTarget(dir).target).toBe(r.target)
  })

  it('scaffolds only the missing anchors without disturbing existing files', () => {
    const dir = tmp()
    scaffold(dir, ['build'])
    write(dir, 'vite.config.ts', '// customised\nexport default {}\n')
    const pkgBefore = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    pkgBefore.dependencies.extra = '1.0.0'
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkgBefore))
    const r = resolveTarget(dir)
    expect(r.missing).toEqual(['kit', 'index'])
    expect(r.needsConfirmation).toBe(true)
    const result = scaffold(dir, r.missing)
    expect(result.written).not.toContain('vite.config.ts')
    expect(fs.readFileSync(path.join(dir, 'vite.config.ts'), 'utf8')).toContain('customised')
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).dependencies.extra).toBe('1.0.0')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('merges the dependency set into an existing package.json without overriding versions', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ name: 'x', dependencies: { react: '^18.0.0' } }))
    scaffold(dir, ['kit'])
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies.react).toBe('^18.0.0')
    for (const d of ['react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[d]).toBeTruthy()
    for (const d of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      expect(pkg.devDependencies[d]).toBeTruthy()
    }
  })

  it('resolves templates from the skill directory regardless of cwd', () => {
    const dir = tmp()
    const prev = process.cwd()
    process.chdir(os.tmpdir())
    try {
      scaffold(dir, ['build', 'kit', 'index'])
    } finally {
      process.chdir(prev)
    }
    expect(fs.existsSync(path.join(dir, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
  })
})

describe('template alignment', () => {
  const kitFiles = walk(path.join(REPO, 'src/presentation-kit'), (f) => !isTest(f))

  it('keeps the bootstrap kit byte-aligned with src/presentation-kit', () => {
    const tplFiles = walk(path.join(BOOT, 'src/presentation-kit'), (f) => !isTest(f))
    const rel = (base: string, fs_: string[]) => fs_.map((f) => path.relative(base, f)).sort()
    expect(rel(path.join(BOOT, 'src/presentation-kit'), tplFiles)).toEqual(rel(path.join(REPO, 'src/presentation-kit'), kitFiles))
    for (const f of kitFiles) {
      const r = path.relative(path.join(REPO, 'src/presentation-kit'), f)
      expect(fs.readFileSync(path.join(BOOT, 'src/presentation-kit', r), 'utf8'), r).toBe(fs.readFileSync(f, 'utf8'))
    }
  })

  it.each(['lib.mjs', 'verify.mjs', 'inspect-presentation.mjs'])('keeps scripts/%s aligned', (f) => {
    expect(fs.readFileSync(path.join(BOOT, 'scripts', f), 'utf8')).toBe(fs.readFileSync(path.join(REPO, 'scripts', f), 'utf8'))
  })

  it.each(['Router.tsx', 'Landing.tsx', 'route.ts'])('keeps src/%s aligned', (f) => {
    expect(fs.readFileSync(path.join(BOOT, 'src', f), 'utf8')).toBe(fs.readFileSync(path.join(REPO, 'src', f), 'utf8'))
  })

  it('ships the dependency set and no styling framework', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(BOOT, 'package.json'), 'utf8'))
    const all = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const d of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      expect(all[d], d).toBeTruthy()
    }
    expect(JSON.stringify(all)).not.toMatch(/tailwind/i)
    for (const f of walk(BOOT, (x) => !x.endsWith('package-lock.json'))) {
      expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/tailwind/i)
    }
    expect(fs.existsSync(path.join(BOOT, 'package-lock.json'))).toBe(true)
  })

  it('starts with an empty host stylesheet and a comment-only presentation stylesheet', () => {
    for (const f of ['src/index.css', 'src/presentations/example/talk.css']) {
      const css = fs.readFileSync(path.join(BOOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim()
      expect(css, f).toBe('')
    }
  })

  it('keeps the presentation template aligned with the bootstrap example', () => {
    const tpl = path.join(SKILL, 'templates/presentation')
    for (const f of walk(tpl)) {
      const r = path.relative(tpl, f)
      const expected = fs.readFileSync(f, 'utf8').replaceAll('__SLUG__', 'example').replaceAll('__TITLE__', 'Example Presentation')
      expect(fs.readFileSync(path.join(BOOT, 'src/presentations/example', r), 'utf8'), r).toBe(expected)
    }
  })
})
