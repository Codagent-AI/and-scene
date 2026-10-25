import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { BOOTSTRAP_DIR, SKILL_DIR, detectAnchors, isMonorepo, resolveTarget } from './lib.mjs'
import { newPresentation, registerPresentation } from './new-presentation.mjs'
import { scaffold } from './scaffold.mjs'

const dirs = []
function tmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'presentation-skill-'))
  dirs.push(dir)
  return dir
}
afterEach(() => {
  while (dirs.length) fs.rmSync(dirs.pop(), { recursive: true, force: true })
})
const write = (dir, rel, text = '') => {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  fs.writeFileSync(path.join(dir, rel), text)
}
const buildAnchorFiles = (dir) => {
  write(
    dir,
    'package.json',
    JSON.stringify({ name: 'host', scripts: { build: 'tsc -b && vite build' }, dependencies: { react: '^19' }, devDependencies: { vite: '^8', typescript: '~6' } }),
  )
  write(dir, 'vite.config.ts', 'export default {}')
}

describe('template resolution', () => {
  it('resolves bootstrap templates from the skill directory, whatever the cwd', () => {
    expect(BOOTSTRAP_DIR).toBe(path.join(SKILL_DIR, 'templates', 'bootstrap'))
    expect(fs.existsSync(path.join(BOOTSTRAP_DIR, 'package.json'))).toBe(true)
    const cwd = tmp()
    const res = spawnSync(process.execPath, [path.join(SKILL_DIR, 'scripts', 'detect-target.mjs'), cwd], { cwd: os.tmpdir(), encoding: 'utf8' })
    expect(res.status).toBe(0)
    expect(JSON.parse(res.stdout).kind).toBe('empty')
  })
})

describe('anchor detection and target resolution', () => {
  it('finds no anchors in an empty directory and targets the root', () => {
    const dir = tmp()
    const plan = resolveTarget(dir)
    expect(plan).toMatchObject({ kind: 'empty', target: dir, anchors: { build: false, kit: false, index: false }, needsConfirmation: false })
    expect(plan.missing).toEqual(['build', 'kit', 'index'])
  })

  it('treats a standalone non-empty project as root target and asks for confirmation', () => {
    const dir = tmp()
    buildAnchorFiles(dir)
    const plan = resolveTarget(dir)
    expect(plan).toMatchObject({ kind: 'standalone', target: dir, needsConfirmation: true })
    expect(plan.missing).toEqual(['kit', 'index'])
  })

  it.each([
    ['workspaces', (d) => write(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d) => write(d, 'pnpm-workspace.yaml', 'packages: []')],
    ['packages/ layout', (d) => write(d, 'packages/a/index.js')],
    ['apps/ layout', (d) => write(d, 'apps/a/index.js')],
  ])('targets presentations/ in a monorepo (%s)', (_name, setup) => {
    const dir = tmp()
    setup(dir)
    expect(isMonorepo(dir)).toBe(true)
    const plan = resolveTarget(dir)
    expect(plan).toMatchObject({ kind: 'monorepo', target: path.join(dir, 'presentations'), needsConfirmation: true })
    expect(plan.missing).toEqual(['build', 'kit', 'index'])
  })

  it('uses a monorepo whose only anchor is the root build setup as a presentations/ target', () => {
    const dir = tmp()
    buildAnchorFiles(dir)
    write(dir, 'pnpm-workspace.yaml', 'packages: []')
    write(dir, 'README.md', 'keep me')
    expect(resolveTarget(dir)).toMatchObject({ kind: 'monorepo', target: path.join(dir, 'presentations') })
  })

  it('uses an already-scaffolded app and reports nothing missing', () => {
    const dir = tmp()
    scaffold({ cwd: dir })
    const plan = resolveTarget(dir)
    expect(plan).toMatchObject({ kind: 'existing-app', target: dir, missing: [], needsConfirmation: false })
  })

  it('detects anchors by contract, not by file-for-file identity', () => {
    const dir = tmp()
    write(
      dir,
      'src/presentation-kit/engine.tsx',
      "import { AnimatePresence } from 'motion/react'\nexport type Step = { id: string }\nexport function Presentation() { window.addEventListener('keydown', () => {}); return AnimatePresence && 'scale(1)' }",
    )
    write(dir, 'src/presentations/index.js', 'export const presentations = [{ slug: "a" }]')
    write(dir, 'src/router.js', 'import { presentations } from "./presentations/index.js"\nexport const route = () => presentations.find((p) => p.slug === location.pathname)')
    expect(detectAnchors(dir)).toEqual({ build: false, kit: true, index: true })
  })

  it('rejects look-alike infrastructure that does not implement the contracts', () => {
    const dir = tmp()
    write(dir, 'src/presentation-kit/engine.tsx', 'export function Presentation() {}\nexport type Step = {}')
    write(dir, 'src/presentations/index.js', 'export const presentations = []')
    expect(detectAnchors(dir)).toEqual({ build: false, kit: false, index: false })
    write(dir, 'src/presentations/index.js', 'export const presentations = [{ slug: "a" }]')
    expect(detectAnchors(dir).index).toBe(false)
  })
})

describe('scaffold', () => {
  it('performs a full scaffold in an empty directory', () => {
    const dir = tmp()
    const report = scaffold({ cwd: dir })
    expect(report.target).toBe(dir)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    for (const f of ['package-lock.json', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts', 'scripts/verify.mjs']) {
      expect(fs.existsSync(path.join(dir, f)), f).toBe(true)
    }
  })

  it('does nothing when every anchor is present', () => {
    const dir = tmp()
    scaffold({ cwd: dir })
    const again = scaffold({ cwd: dir })
    expect(again.written).toEqual([])
    expect(again.dependenciesAdded).toEqual([])
  })

  it('scaffolds only the missing anchors and keeps existing files untouched', () => {
    const dir = tmp()
    buildAnchorFiles(dir)
    write(dir, 'src/main.tsx', 'host entry')
    const before = fs.readFileSync(path.join(dir, 'vite.config.ts'), 'utf8')
    const report = scaffold({ cwd: dir })
    expect(fs.readFileSync(path.join(dir, 'vite.config.ts'), 'utf8')).toBe(before)
    expect(fs.readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('host entry')
    expect(report.wire[0]).toMatch(/src\/main\.tsx already exists/)
    expect(report.written).not.toContain('tsconfig.json')
    expect(report.written).toContain('src/presentation-kit/Presentation.tsx')
    for (const f of ['verify.mjs', 'inspect-presentation.mjs', 'inspection-checks.mjs', 'preview.mjs']) {
      expect(fs.existsSync(path.join(dir, 'scripts', f)), f).toBe(true)
    }
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not install a second lockfile over a host package.json', () => {
    const dir = tmp()
    buildAnchorFiles(dir)
    expect(scaffold({ cwd: dir }).written).not.toContain('package-lock.json')
  })

  it('merges the missing dependencies and scripts into an existing package.json', () => {
    const dir = tmp()
    buildAnchorFiles(dir)
    const report = scaffold({ cwd: dir })
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies.react).toBe('^19')
    for (const name of ['motion', 'lucide-react', 'react-dom']) expect(pkg.dependencies[name]).toBeTruthy()
    for (const name of ['playwright', '@vitejs/plugin-react', 'eslint', '@types/node']) expect(pkg.devDependencies[name]).toBeTruthy()
    expect(pkg.scripts.verify).toBeTruthy()
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(report.dependenciesAdded).toContain('playwright')
    // Every merged npm command points at a script that now exists.
    for (const command of [pkg.scripts.verify, pkg.scripts.inspect]) {
      expect(fs.existsSync(path.join(dir, command.split(' ')[1])), command).toBe(true)
    }
  })

  it('adds the verification scripts when only the presentation index is missing', () => {
    const dir = tmp()
    scaffold({ cwd: dir })
    fs.rmSync(path.join(dir, 'scripts'), { recursive: true })
    fs.rmSync(path.join(dir, 'src/presentations'), { recursive: true })
    const report = scaffold({ cwd: dir })
    expect(report.missing).toEqual(['index'])
    expect(fs.existsSync(path.join(dir, 'scripts/verify.mjs'))).toBe(true)
  })

  it('scaffolds a self-contained app under presentations/ in a monorepo and leaves the root alone', () => {
    const dir = tmp()
    buildAnchorFiles(dir)
    write(dir, 'pnpm-workspace.yaml', 'packages: []')
    write(dir, 'README.md', 'keep me')
    const rootPkg = fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
    const report = scaffold({ cwd: dir })
    expect(report.target).toBe(path.join(dir, 'presentations'))
    expect(detectAnchors(path.join(dir, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(rootPkg)
    expect(fs.readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe('keep me')
    expect(fs.existsSync(path.join(dir, 'src'))).toBe(false)
  })

  it('writes nothing in a dry run', () => {
    const dir = tmp()
    const report = scaffold({ cwd: dir, dryRun: true })
    expect(report.written.length).toBeGreaterThan(10)
    expect(fs.readdirSync(dir)).toEqual([])
  })

  it('never adds Tailwind or a styling framework', () => {
    const dir = tmp()
    scaffold({ cwd: dir })
    const pkg = fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind/i)
  })
})

describe('new presentation', () => {
  it('creates a self-contained folder, registers it, and keeps existing entries', () => {
    const dir = tmp()
    scaffold({ cwd: dir })
    const indexFile = path.join(dir, 'src/presentations/index.ts')
    const before = fs.readFileSync(indexFile, 'utf8')
    const result = newPresentation({ cwd: dir, slug: 'my-talk', title: "Ada's Talk" })
    expect(result).toMatchObject({ folder: 'src/presentations/my-talk', route: '/my-talk' })
    for (const f of ['Talk.tsx', 'Scene.tsx', 'steps.ts', 'entities.ts', 'style.css']) {
      expect(fs.existsSync(path.join(dir, 'src/presentations/my-talk', f)), f).toBe(true)
    }
    const after = fs.readFileSync(indexFile, 'utf8')
    expect(after).toContain("slug: 'my-talk'")
    expect(after).toContain("title: 'Ada\\'s Talk'")
    expect(after).toContain("slug: 'starter'")
    expect(after.startsWith(before.slice(0, before.indexOf('presentations: PresentationEntry[]')))).toBe(true)
    const talk = fs.readFileSync(path.join(dir, 'src/presentations/my-talk/Talk.tsx'), 'utf8')
    expect(talk).toContain('title={"Ada\'s Talk"}')
    expect(fs.readFileSync(path.join(dir, 'src/presentations/my-talk/entities.ts'), 'utf8')).toContain("'my-talk/idea'")
  })

  it('keeps the visual style inside the presentation folder, never the kit', () => {
    const dir = tmp()
    scaffold({ cwd: dir })
    const kitBefore = fs.readdirSync(path.join(dir, 'src/presentation-kit'), { recursive: true }).sort()
    newPresentation({ cwd: dir, slug: 'styled', title: 'Styled' })
    expect(fs.readdirSync(path.join(dir, 'src/presentation-kit'), { recursive: true }).sort()).toEqual(kitBefore)
    expect(fs.existsSync(path.join(dir, 'src/presentations/styled/style.css'))).toBe(true)
  })

  it('refuses an existing slug, an invalid slug, and an unscaffolded project', () => {
    const dir = tmp()
    expect(() => newPresentation({ cwd: dir, slug: 'a', title: 'A' })).toThrow(/scaffold the missing anchors/)
    scaffold({ cwd: dir })
    newPresentation({ cwd: dir, slug: 'dup', title: 'Dup' })
    expect(() => newPresentation({ cwd: dir, slug: 'dup', title: 'Dup' })).toThrow(/already exists/)
    expect(() => newPresentation({ cwd: dir, slug: 'Bad Slug', title: 'x' })).toThrow(/--slug/)
    expect(() => newPresentation({ cwd: dir, slug: 'ok', title: '' })).toThrow(/--title/)
  })

  it('fails clearly when the registry array cannot be found', () => {
    const dir = tmp()
    write(dir, 'index.ts', 'export const nothing = 1')
    expect(() => registerPresentation(path.join(dir, 'index.ts'), { slug: 'a', title: 'A' })).toThrow(/cannot find the presentations array/)
  })

  it('supports a JavaScript registry', () => {
    const dir = tmp()
    scaffold({ cwd: dir })
    fs.renameSync(path.join(dir, 'src/presentations/index.ts'), path.join(dir, 'src/presentations/index.js'))
    newPresentation({ cwd: dir, slug: 'from-js', title: 'From JS' })
    expect(fs.readFileSync(path.join(dir, 'src/presentations/index.js'), 'utf8')).toContain("slug: 'from-js'")
    expect(fs.existsSync(path.join(dir, 'src/presentations/from-js/Talk.tsx'))).toBe(true)
  })

  it('writes nothing when the registry cannot be extended, so a retry is not blocked', () => {
    const dir = tmp()
    scaffold({ cwd: dir })
    const indexFile = path.join(dir, 'src/presentations/index.ts')
    const original = fs.readFileSync(indexFile, 'utf8')
    fs.writeFileSync(indexFile, original.replace(/presentations: PresentationEntry\[\] = \[/, 'presentations = Object.freeze(['))
    const broken = fs.readFileSync(indexFile, 'utf8')
    expect(() => newPresentation({ cwd: dir, slug: 'half', title: 'Half' })).toThrow(/cannot find the presentations array/)
    expect(fs.existsSync(path.join(dir, 'src/presentations/half'))).toBe(false)
    expect(fs.readFileSync(indexFile, 'utf8')).toBe(broken)
    fs.writeFileSync(indexFile, original)
    expect(newPresentation({ cwd: dir, slug: 'half', title: 'Half' }).route).toBe('/half')
  })

  it('leaves existing presentation folders untouched', () => {
    const dir = tmp()
    scaffold({ cwd: dir })
    const starter = path.join(dir, 'src/presentations/starter/steps.ts')
    const before = fs.readFileSync(starter, 'utf8')
    newPresentation({ cwd: dir, slug: 'second', title: 'Second' })
    expect(fs.readFileSync(starter, 'utf8')).toBe(before)
  })
})
