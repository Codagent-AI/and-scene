import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM helper without type declarations
import { BOOTSTRAP, createPresentation, detect, detectAnchors, listPresentations, scaffold } from './lib.mjs'

const dirs: string[] = []
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'skill-'))
  dirs.push(d)
  return d
}
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))
const put = (root: string, rel: string, body = '') => {
  mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
  writeFileSync(path.join(root, rel), body)
}

describe('target detection', () => {
  it('scaffolds an empty directory at its root with all anchors missing and no confirmation', () => {
    const d = tmp()
    const r = detect(d)
    expect(r.target).toBe(d)
    expect(r.missing).toEqual(['build', 'kit', 'index'])
    expect(r.needsConfirmation).toBe(false)
  })

  it('targets presentations/ in a monorepo and never the root, requiring confirmation', () => {
    for (const signal of [
      (d: string) => put(d, 'package.json', '{"workspaces":["packages/*"]}'),
      (d: string) => put(d, 'pnpm-workspace.yaml', 'packages: []'),
      (d: string) => mkdirSync(path.join(d, 'apps'), { recursive: true }),
    ]) {
      const d = tmp()
      signal(d)
      put(d, 'README.md', 'unrelated')
      const r = detect(d)
      expect(r.target).toBe(path.join(d, 'presentations'))
      expect(r.monorepo).toBe(true)
      expect(r.needsConfirmation).toBe(true)
    }
  })

  it('keeps targeting presentations/ for a partially scaffolded monorepo root', () => {
    const d = tmp()
    put(d, 'package.json', '{"workspaces":["packages/*"]}')
    scaffold(d, ['kit'])
    expect(detect(d).target).toBe(path.join(d, 'presentations'))
    const e = tmp()
    put(e, 'package.json', '{"workspaces":["packages/*"]}')
    scaffold(e, ['index'])
    expect(detect(e).target).toBe(path.join(e, 'presentations'))
  })

  it('does not accept placeholder files as kit or index anchors', () => {
    const d = tmp()
    put(d, 'src/presentation-kit/index.ts', '// TODO: implement Presentation')
    put(d, 'src/presentations/index.ts', '// registry goes here')
    expect(detectAnchors(d)).toMatchObject({ kit: false, index: false })
    put(d, 'src/presentation-kit/index.ts', "export { Presentation } from './Missing'")
    expect(detectAnchors(d).kit).toBe(false)
    scaffold(d, ['kit', 'index'])
    expect(detectAnchors(d)).toMatchObject({ kit: false, index: false }) // files existed, never overwritten
  })

  it('uses an existing presentation app and detects anchors by function, not identical files', () => {
    const d = tmp()
    scaffold(d, ['build', 'kit', 'index'])
    expect(detect(d)).toMatchObject({ missing: [], needsConfirmation: false, target: d })
    // Cosmetic differences: reformatted index, extra dependency, renamed vite config.
    put(d, 'src/presentations/index.tsx', 'export const REGISTRY = []')
    rmSync(path.join(d, 'src/presentations/index.ts'))
    expect(detectAnchors(d).index).toBe(true)
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    pkg.dependencies.extra = '1.0.0'
    writeFileSync(path.join(d, 'package.json'), JSON.stringify(pkg))
    expect(detectAnchors(d).build).toBe(true)
  })

  it('lists registered presentations', () => {
    const d = tmp()
    scaffold(d, ['build', 'kit', 'index'])
    createPresentation(d, 'second-talk', "Second Talk")
    expect(listPresentations(d).map((p: { slug: string }) => p.slug)).toEqual(['starter', 'second-talk'])
  })
})

describe('scaffold', () => {
  it('materializes build setup, kit, and index with the full dependency set', () => {
    const d = tmp()
    const res = scaffold(d, ['build', 'kit', 'index'])
    expect(res.skipped).toEqual([])
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(deps, dep).toContain(dep)
    }
    expect(deps.some((x) => /tailwind/i.test(x))).toBe(false)
    expect(existsSync(path.join(d, 'package-lock.json'))).toBe(true)
  })

  it('scaffolds only missing anchors and never overwrites existing files', () => {
    const d = tmp()
    scaffold(d, ['build', 'kit', 'index'])
    put(d, 'src/presentation-kit/Presentation.tsx', 'custom')
    rmSync(path.join(d, 'src/presentations'), { recursive: true })
    const res = scaffold(d, ['index'])
    expect(res.created).toContain('src/presentations/index.ts')
    expect(res.created.every((f: string) => !f.startsWith('src/presentation-kit'))).toBe(true)
    expect(readFileSync(path.join(d, 'src/presentation-kit/Presentation.tsx'), 'utf8')).toBe('custom')
    const again = scaffold(d, ['build', 'kit', 'index'])
    expect(again.created).toEqual([])
  })

  it('adds dependencies, verify tooling, and entry wiring when only kit and index are missing', () => {
    const d = tmp()
    scaffold(d, ['build'])
    const pkgPath = path.join(d, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    for (const k of ['motion', 'lucide-react']) delete pkg.dependencies[k]
    delete pkg.devDependencies.playwright
    delete pkg.scripts.verify
    writeFileSync(pkgPath, JSON.stringify(pkg))
    rmSync(path.join(d, 'scripts'), { recursive: true })
    put(d, 'src/main.tsx', "import { createRoot } from 'react-dom/client'\nimport App from './App'\n\ncreateRoot(document.getElementById('root')!).render(<App />)\n")
    const res = scaffold(d, ['kit', 'index'])
    const merged = JSON.parse(readFileSync(pkgPath, 'utf8'))
    expect(merged.dependencies.motion).toBeTruthy()
    expect(merged.dependencies['lucide-react']).toBeTruthy()
    expect(merged.devDependencies.playwright).toBeTruthy()
    expect(merged.scripts.verify).toBeTruthy()
    expect(existsSync(path.join(d, 'scripts/verify.mjs'))).toBe(true)
    const main = readFileSync(path.join(d, 'src/main.tsx'), 'utf8')
    expect(main).toContain('if (!mountPresentations()) {')
    expect(main.indexOf("from './presentations/mount'")).toBeLessThan(main.indexOf('createRoot('))
    expect(res.manual).toEqual([])
    expect(scaffold(d, ['index']).merged).toEqual([]) // idempotent: no double wrapping
  })

  it('reports an entry point it cannot patch safely', () => {
    const d = tmp()
    put(d, 'src/main.tsx', "import {\n  a,\n} from 'x'\nconsole.log(a)\n")
    expect(scaffold(d, ['index']).manual[0]).toMatch(/mountPresentations/)
  })

  it('merges only missing scripts and dependencies into an existing package.json', () => {
    const d = tmp()
    put(d, 'package.json', JSON.stringify({ name: 'mine', scripts: { build: 'custom' }, dependencies: { react: '^18.0.0' } }))
    const res = scaffold(d, ['build'])
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('mine')
    expect(pkg.scripts.build).toBe('custom')
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.dependencies.motion).toBeTruthy()
    expect(pkg.scripts.verify).toBeTruthy()
    expect(res.merged[0]).toMatch(/^package.json/)
    expect(existsSync(path.join(d, 'package-lock.json'))).toBe(false)
  })

  it('does not touch the monorepo root when scaffolding into presentations/', () => {
    const d = tmp()
    put(d, 'package.json', '{"workspaces":["packages/*"],"scripts":{"build":"x"}}')
    put(d, 'keep.txt', 'unrelated')
    const before = readFileSync(path.join(d, 'package.json'), 'utf8')
    const { target } = detect(d)
    scaffold(target, ['build', 'kit', 'index'])
    expect(readFileSync(path.join(d, 'package.json'), 'utf8')).toBe(before)
    expect(readdirSync(d).sort()).toEqual(['keep.txt', 'package.json', 'presentations'])
    expect(detect(d).missing).toEqual([])
  })

  it('resolves templates from the skill directory regardless of cwd', () => {
    const cwd = process.cwd()
    const d = tmp()
    process.chdir(d)
    try {
      expect(scaffold(path.join(d, 'out'), ['kit']).created.length).toBeGreaterThan(5)
    } finally {
      process.chdir(cwd)
    }
  })
})

describe('createPresentation', () => {
  it('writes a self-contained folder, registers it, and preserves existing presentations', () => {
    const d = tmp()
    scaffold(d, ['build', 'kit', 'index'])
    const before = readFileSync(path.join(d, 'src/presentations/starter/Talk.tsx'), 'utf8')
    const res = createPresentation(d, 'my-talk', 'My Talk')
    expect(res.route).toBe('/my-talk')
    for (const f of ['entities.ts', 'Talk.tsx', 'talk.css', 'steps/Scene.tsx', 'steps/meta.ts', 'steps/index.ts']) {
      expect(existsSync(path.join(d, 'src/presentations/my-talk', f)), f).toBe(true)
    }
    expect(readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'my-talk'")
    expect(readFileSync(path.join(d, 'src/presentations/starter/Talk.tsx'), 'utf8')).toBe(before)
    expect(listPresentations(d)).toHaveLength(2)
  })

  it('rejects bad slugs, duplicates, and missing indexes', () => {
    const d = tmp()
    expect(() => createPresentation(d, 'x', 'X')).toThrow(/scaffold first/)
    scaffold(d, ['build', 'kit', 'index'])
    expect(() => createPresentation(d, 'Bad Slug', 'X')).toThrow(/invalid slug/)
    createPresentation(d, 'dup', 'Dup')
    expect(() => createPresentation(d, 'dup', 'Dup')).toThrow(/already exists/)
  })
})

describe('template parity and neutrality', () => {
  const root = path.resolve(__dirname, '../../..')
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = path.join(dir, n)
      return statSync(p).isDirectory() ? walk(p) : [p]
    })

  it('keeps the bootstrap kit byte-aligned with the canonical kit (tests excluded)', () => {
    const canon = path.join(root, 'src/presentation-kit')
    const snap = path.join(BOOTSTRAP, 'src/presentation-kit')
    const rel = (base: string, files: string[]) => files.map((f) => path.relative(base, f)).sort()
    const canonFiles = walk(canon).filter((f) => !/\.test\.tsx?$/.test(f))
    expect(rel(snap, walk(snap))).toEqual(rel(canon, canonFiles))
    for (const f of canonFiles) {
      expect(readFileSync(path.join(snap, path.relative(canon, f)), 'utf8'), path.relative(canon, f)).toBe(readFileSync(f, 'utf8'))
    }
  })

  it('keeps the app entry and router files aligned with the template copies', () => {
    for (const f of ['src/main.tsx', 'src/Landing.tsx', 'src/route.ts', 'src/index.css', 'src/presentations/mount.tsx']) {
      expect(readFileSync(path.join(BOOTSTRAP, f), 'utf8'), f).toBe(readFileSync(path.join(root, f), 'utf8'))
    }
  })

  it('keeps verification and inspection scripts aligned with the template copies', () => {
    for (const f of ['lib.mjs', 'verify.mjs', 'inspect-presentation.mjs']) {
      expect(readFileSync(path.join(BOOTSTRAP, 'scripts', f), 'utf8'), f).toBe(readFileSync(path.join(root, 'scripts', f), 'utf8'))
    }
  })

  it('ships no styling framework, theme, or visual defaults in the scaffold', () => {
    for (const f of walk(BOOTSTRAP).filter((p) => !p.endsWith('package-lock.json'))) {
      const src = readFileSync(f, 'utf8')
      const rel = path.relative(BOOTSTRAP, f)
      expect(src, rel).not.toMatch(/tailwind/i)
      if (/\.css$/.test(f)) expect(src, rel).not.toMatch(/(^|[;{\s])(color|background|font-family|font-size|border|box-shadow)\s*:/m)
    }
    expect(readFileSync(path.join(BOOTSTRAP, 'package-lock.json'), 'utf8')).not.toMatch(/tailwind/i)
  })

  it('declares the same dependency versions as the root app for shared packages', () => {
    const rootPkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
    const tpl = JSON.parse(readFileSync(path.join(BOOTSTRAP, 'package.json'), 'utf8'))
    const all = { ...rootPkg.dependencies, ...rootPkg.devDependencies }
    for (const [name, v] of Object.entries({ ...tpl.dependencies, ...tpl.devDependencies })) expect(all[name], name).toBe(v)
  })
})
