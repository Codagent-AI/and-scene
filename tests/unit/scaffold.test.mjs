import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/anchors.mjs'
import { registerInSource } from '../../skills/presentation/scripts/register.mjs'
import { BOOTSTRAP_DIR, createPresentation, scaffoldMissing } from '../../skills/presentation/scripts/scaffold.mjs'
import { buildAnchor, kitAnchor, tmpDir, write } from './helpers.mjs'

const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8')

describe('scaffoldMissing', () => {
  it('fully scaffolds an empty directory with all three anchors', () => {
    const dir = tmpDir()
    const result = scaffoldMissing(dir)
    expect(result.missing).toEqual(['build', 'kit', 'index'])
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(result.created).toContain('package-lock.json')
    expect(fs.existsSync(path.join(dir, 'scripts', 'verify.mjs'))).toBe(true)
  })

  it('resolves templates from the skill directory, independent of the working directory', () => {
    const before = process.cwd()
    const dir = tmpDir()
    process.chdir(tmpDir())
    try {
      scaffoldMissing(dir)
    } finally {
      process.chdir(before)
    }
    expect(detectAnchors(dir).kit).toBe(true)
    expect(BOOTSTRAP_DIR).toBe(path.resolve(__dirname, '../../skills/presentation/templates/bootstrap'))
  })

  it('skips scaffolding when every anchor is present', () => {
    const dir = tmpDir()
    scaffoldMissing(dir)
    expect(scaffoldMissing(dir)).toMatchObject({ missing: [], created: [], merged: [], installed: false })
  })

  it('scaffolds only the missing anchors and leaves present files untouched', () => {
    const dir = write(tmpDir(), {
      ...buildAnchor(),
      ...kitAnchor,
      'src/presentation-kit/Presentation.tsx': 'my own kit',
      'src/main.tsx': 'my own main',
    })
    const before = read(dir, 'package.json')
    const result = scaffoldMissing(dir)
    expect(result.missing).toEqual(['index'])
    expect(read(dir, 'src/presentation-kit/Presentation.tsx')).toBe('my own kit')
    expect(read(dir, 'src/main.tsx')).toBe('my own main')
    expect(read(dir, 'package.json')).toBe(before)
    expect(result.created).toContain('src/presentations/index.ts')
    expect(result.created.some((f) => f.startsWith('src/presentation-kit/'))).toBe(false)
    expect(detectAnchors(dir).index).toBe(true)
  })

  it('merges only missing dependencies and scripts into an existing package.json', () => {
    const dir = write(tmpDir(), {
      'package.json': { name: 'mine', scripts: { build: 'x', custom: 'y' }, dependencies: { react: '^18.0.0' } },
    })
    const { merged } = scaffoldMissing(dir)
    const pkg = JSON.parse(read(dir, 'package.json'))
    expect(pkg.name).toBe('mine')
    expect(pkg.scripts).toMatchObject({ build: 'x', custom: 'y', verify: expect.any(String) })
    expect(pkg.dependencies.react).toBe('^18.0.0')
    for (const dep of ['motion', 'lucide-react', 'react-dom']) expect(pkg.dependencies[dep]).toBeTruthy()
    for (const dep of ['vite', '@vitejs/plugin-react', 'typescript', 'playwright', 'eslint']) expect(pkg.devDependencies[dep]).toBeTruthy()
    expect(merged).toContain('dependencies.motion')
    expect(merged).not.toContain('dependencies.react')
  })

  it('ships the full dependency set and no styling framework', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(BOOTSTRAP_DIR, 'package.json'), 'utf8'))
    const all = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(all[dep], dep).toBeTruthy()
    }
    expect(Object.keys(all).filter((d) => /tailwind|styled|emotion/.test(d))).toEqual([])
  })
})

describe('createPresentation and registry', () => {
  it('writes a self-contained folder and registers it, keeping existing entries', () => {
    const dir = tmpDir()
    scaffoldMissing(dir)
    const before = read(dir, 'src/presentations/index.ts')
    const folder = createPresentation(dir, { slug: 'my-talk', title: 'My Talk' })
    expect(fs.readdirSync(folder).sort()).toEqual(['Talk.tsx', 'entities.ts', 'scene.tsx', 'steps.ts', 'style.css'])
    const after = read(dir, 'src/presentations/index.ts')
    expect(after).toContain("slug: 'hello-scene'")
    expect(after).toContain("slug: 'my-talk'")
    expect(after).toContain("import('./my-talk/Talk')")
    expect(after.indexOf('hello-scene')).toBeLessThan(after.indexOf('my-talk'))
    expect(after.replace(/\n {2}\{\n {4}slug: 'my-talk'[\s\S]*?\n {2}\},/, '')).toBe(before)
    expect(read(dir, 'src/presentations/my-talk/Talk.tsx')).toContain('My Talk')
    expect(read(dir, 'src/presentations/my-talk/entities.ts')).toContain('my-talk-idea')
    expect(fs.existsSync(path.join(dir, 'src/presentations/hello-scene/Talk.tsx'))).toBe(true)
  })

  it('refuses a duplicate slug, an existing folder, and an invalid slug', () => {
    const dir = tmpDir()
    scaffoldMissing(dir)
    createPresentation(dir, { slug: 'one', title: 'One' })
    expect(() => createPresentation(dir, { slug: 'one', title: 'One' })).toThrow(/already exists/)
    expect(() => createPresentation(dir, { slug: 'Bad Slug', title: 'x' })).toThrow(/Invalid slug/)
    expect(() => registerInSource(read(dir, 'src/presentations/index.ts'), { slug: 'one', title: 'x' })).toThrow(/already registered/)
  })

  it('fails clearly when the registry marker is gone', () => {
    expect(() => registerInSource('export const presentations = []', { slug: 'a', title: 'A' })).toThrow(/marker/)
  })

  it('keeps visual styling out of the starter and the template (presentation-owned only)', () => {
    const roots = [path.join(BOOTSTRAP_DIR, 'src/presentations/hello-scene'), path.resolve(BOOTSTRAP_DIR, '../presentation')]
    for (const root of roots) {
      const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(css.trim()).toBe('')
    }
  })
})
