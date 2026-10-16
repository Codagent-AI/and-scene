import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error untyped helper module
import { expectedSnapshot } from '../../scripts/sync-templates.mjs'
// @ts-expect-error untyped helper module
import { detect, listPresentations, newPresentation, resolveTarget, scaffold } from '../../skills/presentation/scripts/scaffold.mjs'

const ROOT = join(import.meta.dirname, '..', '..')
const SKILL = join(ROOT, 'skills/presentation')
const BOOTSTRAP = join(SKILL, 'templates/bootstrap')
const skillText = readFileSync(join(SKILL, 'SKILL.md'), 'utf8')

const temps: string[] = []
const tmp = () => {
  const dir = mkdtempSync(join(tmpdir(), 'and-scene-skill-'))
  temps.push(dir)
  return dir
}
afterEach(() => temps.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

describe('SKILL.md', () => {
  it('has skill frontmatter', () => {
    expect(skillText).toMatch(/^---\nname: presentation\ndescription: .{40,}\n---\n/)
  })

  it('states the gather, scaffold, generate/modify, and self-verify procedure', () => {
    for (const phrase of [
      'one question per message',
      'partial detail',
      'ASCII mockup',
      'contract anchors',
      'state the target directory',
      'relative to this `SKILL.md` file',
      'presentations/',
      'Do not assume Chromium',
      'npm run verify',
      'npm run inspect',
      'data-presentation-allow-overlap',
      'never report success while a check fails',
      'scaffold.mjs list',
    ]) {
      expect(skillText.replace(/\s+/g, ' ').toLowerCase(), phrase).toContain(phrase.toLowerCase())
    }
  })

  it('keeps visual styling out of the kit and defaults to plain CSS', () => {
    expect(skillText).toMatch(/plain CSS/i)
    expect(skillText).toMatch(/styling-framework-neutral/i)
  })
})

describe('bootstrap snapshot', () => {
  it('is aligned with the canonical kit, scripts, shell, and rendered starter presentation', () => {
    for (const [rel, text] of Object.entries(expectedSnapshot() as Record<string, string>)) {
      expect(readFileSync(join(BOOTSTRAP, rel), 'utf8'), rel).toBe(text)
    }
    const kit = (dir: string) => readdirSync(join(dir, 'src/presentation-kit'), { recursive: true }).filter((f) => !/\.test\./.test(String(f))).sort()
    expect(kit(BOOTSTRAP)).toEqual(kit(ROOT))
  })

  it('declares the complete dependency set, a lock file, and no styling framework', () => {
    const pkg = JSON.parse(readFileSync(join(BOOTSTRAP, 'package.json'), 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(names, dep).toContain(dep)
    }
    expect(names.filter((n) => /tailwind/.test(n))).toEqual([])
    expect(existsSync(join(BOOTSTRAP, 'package-lock.json'))).toBe(true)
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    for (const s of ['verify', 'inspect', 'lint']) expect(pkg.scripts[s]).toBeTruthy()
  })
})

describe('scaffold helper', () => {
  const standalone = () => {
    const dir = tmp()
    scaffold(dir)
    return dir
  }

  it('does a full scaffold in an empty directory at its root', () => {
    const dir = tmp()
    const info = detect(dir)
    expect(info).toMatchObject({ target: dir, empty: true, missing: ['build', 'kit', 'index'], needsConfirmation: false })
    const report = scaffold(dir)
    expect(report.written).toBe(true)
    expect(detect(dir).missing).toEqual([])
    expect(existsSync(join(dir, 'package-lock.json'))).toBe(true)
    expect(existsSync(join(dir, 'src/presentation-kit/index.ts'))).toBe(true)
  })

  it('skips scaffolding when all anchors exist and never overwrites', () => {
    const dir = standalone()
    writeFileSync(join(dir, 'src/Landing.tsx'), '// mine\n')
    const again = scaffold(dir)
    expect(again.needsScaffold).toBe(false)
    expect(again.created).toEqual([])
    expect(readFileSync(join(dir, 'src/Landing.tsx'), 'utf8')).toBe('// mine\n')
  })

  it('scaffolds only the missing anchors in a partial project, keeping existing files', () => {
    const dir = standalone()
    rmSync(join(dir, 'src/presentation-kit'), { recursive: true })
    writeFileSync(join(dir, 'vite.config.ts'), '// custom\n')
    const before = readFileSync(join(dir, 'src/presentations/index.ts'), 'utf8')
    expect(scaffold(dir).written).toBe(false)
    const report = scaffold(dir, { confirm: true })
    expect(report.missing).toEqual(['kit'])
    expect(report.created.every((f: string) => f.startsWith('src/presentation-kit/') || f.startsWith('scripts/'))).toBe(true)
    expect(readFileSync(join(dir, 'vite.config.ts'), 'utf8')).toBe('// custom\n')
    expect(readFileSync(join(dir, 'src/presentations/index.ts'), 'utf8')).toBe(before)
    expect(detect(dir).missing).toEqual([])
  })

  it('detects anchors by contract, not byte-identical files', () => {
    const dir = tmp()
    mkdirSync(join(dir, 'src/presentation-kit'), { recursive: true })
    writeFileSync(join(dir, 'src/presentation-kit/index.tsx'), 'export const Presentation = () => null\n')
    mkdirSync(join(dir, 'src/presentations'), { recursive: true })
    writeFileSync(join(dir, 'src/presentations/index.tsx'), 'export const PRESENTATIONS = []\n')
    expect(detect(dir).anchors).toMatchObject({ kit: true, index: true, build: false })
  })

  it('targets presentations/ in a monorepo and preserves existing content', () => {
    const dir = tmp()
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'mono', workspaces: ['packages/*'], scripts: { build: 'vite build' }, devDependencies: { vite: '^8', react: '^19', typescript: '~6' } }),
    )
    writeFileSync(join(dir, 'tsconfig.json'), '{}')
    mkdirSync(join(dir, 'packages/a'), { recursive: true })
    writeFileSync(join(dir, 'README.md'), 'keep me')
    const rootPkg = readFileSync(join(dir, 'package.json'), 'utf8')
    const info = detect(dir)
    expect(info.monorepo).toBe(true)
    expect(info.target).toBe(join(dir, 'presentations'))
    expect(info.needsConfirmation).toBe(true)
    // Without confirmation nothing is written.
    const refused = scaffold(dir)
    expect(refused.written).toBe(false)
    expect(existsSync(join(dir, 'presentations'))).toBe(false)
    const done = scaffold(dir, { confirm: true })
    expect(done.written).toBe(true)
    expect(readFileSync(join(dir, 'package.json'), 'utf8')).toBe(rootPkg)
    expect(readFileSync(join(dir, 'README.md'), 'utf8')).toBe('keep me')
    expect(detect(dir).missing).toEqual([])
    expect(resolveTarget(dir)).toBe(join(dir, 'presentations'))
  })

  it('merges missing dependencies into an existing build setup without touching existing ones', () => {
    const dir = tmp()
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'app', scripts: { build: 'tsc -b && vite build' }, dependencies: { react: '^18.0.0' }, devDependencies: { vite: '^7', typescript: '^5' } }))
    writeFileSync(join(dir, 'tsconfig.json'), '{}')
    expect(detect(dir).needsConfirmation).toBe(true)
    scaffold(dir, { confirm: true })
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.devDependencies.vite).toBe('^7')
    for (const dep of ['motion', 'lucide-react', 'playwright']) expect({ ...pkg.dependencies, ...pkg.devDependencies }[dep]).toBeTruthy()
    expect(pkg.scripts.verify).toBeTruthy()
  })

  it('creates and registers a presentation, preserving others, and lists them', () => {
    const dir = standalone()
    const startRegistry = readFileSync(join(dir, 'src/presentations/index.ts'), 'utf8')
    const starter = readFileSync(join(dir, 'src/presentations/getting-started/steps.ts'), 'utf8')
    newPresentation(dir, 'my-talk', "It's a Talk")
    expect(listPresentations(dir).map((p: { slug: string }) => p.slug)).toEqual(['getting-started', 'my-talk'])
    expect(readFileSync(join(dir, 'src/presentations/index.ts'), 'utf8')).toContain(startRegistry.split('\n]')[0])
    expect(readFileSync(join(dir, 'src/presentations/getting-started/steps.ts'), 'utf8')).toBe(starter)
    expect(readFileSync(join(dir, 'src/presentations/my-talk/Talk.tsx'), 'utf8')).toContain('p-my-talk')
    expect(() => newPresentation(dir, 'my-talk', 'dup')).toThrow(/already exists/)
    expect(() => newPresentation(dir, 'Bad Slug', 't')).toThrow(/kebab-case/)
  })

  it('repairs a missing build anchor including the app entry index.html needs', () => {
    const dir = standalone()
    for (const f of ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'src/main.tsx']) rmSync(join(dir, f))
    expect(detect(dir).missing).toEqual(['build'])
    scaffold(dir, { confirm: true })
    expect(detect(dir).missing).toEqual([])
    expect(existsSync(join(dir, 'src/main.tsx'))).toBe(true)
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('/src/main.tsx')
  })

  it('treats a renamed registry and reformatted entries as the same contract', () => {
    const dir = standalone()
    renameSync(join(dir, 'src/presentations/index.ts'), join(dir, 'src/presentations/catalog.ts'))
    const catalog = join(dir, 'src/presentations/catalog.ts')
    writeFileSync(catalog, readFileSync(catalog, 'utf8').replaceAll("'", '"'))
    expect(detect(dir).anchors.index).toBe(true)
    expect(listPresentations(dir)).toEqual([{ slug: 'getting-started', title: 'Getting Started' }])
    newPresentation(dir, 'second', 'Second')
    expect(existsSync(join(dir, 'src/presentations/second/Talk.tsx'))).toBe(true)
    expect(listPresentations(dir).map((p: { slug: string }) => p.slug)).toEqual(['getting-started', 'second'])
  })

  it('imports the kit from wherever the project keeps it', () => {
    const dir = standalone()
    renameSync(join(dir, 'src/presentation-kit'), join(dir, 'src/scene-kit'))
    expect(detect(dir).anchors.kit).toBe(true)
    newPresentation(dir, 'third', 'Third')
    expect(readFileSync(join(dir, 'src/presentations/third/Scene.tsx'), 'utf8')).toContain("'../../scene-kit/index.ts'")
  })

  it('resolves templates from the skill directory regardless of cwd', () => {
    const dir = tmp()
    const elsewhere = tmp()
    execFileSync('node', [join(SKILL, 'scripts/scaffold.mjs'), 'scaffold', dir], { cwd: elsewhere })
    expect(existsSync(join(dir, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(readdirSync(elsewhere)).toEqual([])
  })
})
