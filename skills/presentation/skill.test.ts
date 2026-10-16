import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(SKILL_DIR, '../..')
const BOOTSTRAP = path.join(SKILL_DIR, 'templates/bootstrap')
const SKIP = new Set(['node_modules', 'dist', '.inspection'])

function walk(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return []
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full, base) : [path.relative(base, full)]
  })
}

const isTest = (f: string) => f.split(path.sep).includes('__tests__') || /\.test\.[cm]?[jt]sx?$/.test(f)
const read = (p: string) => readFileSync(p)
const skill = readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8')

describe('bootstrap template drift', () => {
  it('kit is byte-identical to the canonical src/presentation-kit (no extra/missing files)', () => {
    const canonical = walk(path.join(REPO, 'src/presentation-kit')).filter((f) => !isTest(f)).sort()
    const template = walk(path.join(BOOTSTRAP, 'src/presentation-kit')).sort()
    expect(template).toEqual(canonical)
    for (const f of canonical) {
      expect(
        read(path.join(BOOTSTRAP, 'src/presentation-kit', f)).equals(read(path.join(REPO, 'src/presentation-kit', f))),
        f,
      ).toBe(true)
    }
  })

  it.each(['verify.mjs', 'inspect-presentation.mjs', 'preview-server.mjs'])('scripts/%s matches its template copy', (f) => {
    expect(read(path.join(BOOTSTRAP, 'scripts', f)).equals(read(path.join(REPO, 'scripts', f)))).toBe(true)
  })

  it('template package.json declares the full dependency set and no styling framework', () => {
    const pkg = JSON.parse(readFileSync(path.join(BOOTSTRAP, 'package.json'), 'utf8'))
    for (const d of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies).toHaveProperty(d)
    for (const d of [
      'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node',
      'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright',
    ]) expect(pkg.devDependencies).toHaveProperty(d)
    for (const s of ['build', 'lint', 'verify', 'inspect', 'dev', 'preview']) expect(pkg.scripts).toHaveProperty(s)
    expect(pkg.presentationVerification).toBeUndefined()
    const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(' ')
    expect(all).not.toMatch(/tailwind|styled-components|emotion|bootstrap|sass/i)
    expect(existsSync(path.join(BOOTSTRAP, 'package-lock.json'))).toBe(true)
  })

  it('template has all three anchors and ships no visual defaults', () => {
    for (const p of ['package.json', 'vite.config.ts', 'src/presentation-kit/index.ts', 'src/presentations/index.ts', '.gitignore'])
      expect(existsSync(path.join(BOOTSTRAP, p)), p).toBe(true)
    const registry = readFileSync(path.join(BOOTSTRAP, 'src/presentations/index.ts'), 'utf8')
    expect(registry).not.toMatch(/^\s*\{\s*slug:/m)
    const css = readFileSync(path.join(BOOTSTRAP, 'src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css.trim()).toBe('')
    const ignore = readFileSync(path.join(BOOTSTRAP, '.gitignore'), 'utf8')
    for (const e of ['node_modules', 'dist', '.inspection']) expect(ignore).toContain(e)
  })
})

describe('SKILL.md', () => {
  it('has valid frontmatter', () => {
    const m = /^---\n([\s\S]*?)\n---\n/.exec(skill)
    expect(m).not.toBeNull()
    expect(m![1]).toMatch(/^name: presentation$/m)
    const desc = /^description: (.+)$/m.exec(m![1])
    expect(desc?.[1].length ?? 0).toBeGreaterThan(40)
    expect(desc![1]).toMatch(/presentation/i)
  })

  it('references only template paths that exist', () => {
    const refs = new Set([...skill.matchAll(/templates\/(?:bootstrap|presentation)\/[\w./-]*/g)].map((m) => m[0]))
    expect(refs.size).toBeGreaterThan(0)
    for (const r of refs) expect(existsSync(path.join(SKILL_DIR, r.replace(/[./]+$/, ''))), r).toBe(true)
    expect(existsSync(path.join(SKILL_DIR, 'templates/presentation/registry-entry.txt'))).toBe(true)
  })

  it('states the key behaviors', () => {
    expect(skill).toMatch(/one at a time/i)
    expect(skill).toMatch(/relative to the directory containing this `SKILL\.md`/)
    expect(skill).toMatch(/under `presentations\/`/)
    expect(skill).toMatch(/confirmation before writing/i)
    expect(skill).toMatch(/npm run inspect -- <slug>/)
    expect(skill).toMatch(/project-local/i)
    expect(skill).toMatch(/never report success/i)
    expect(skill).toMatch(/npm run verify -- --slug/)
    for (const hook of [
      'data-step-count', 'data-step-index', 'data-presentation-mode', 'data-presentation-progress-item',
      'data-presentation-toc-item', 'data-presentation-attribution', 'data-presentation-allow-overlap', 'groupKey',
    ]) expect(skill).toContain(hook)
  })

  it('presentation templates carry no look', () => {
    const dir = path.join(SKILL_DIR, 'templates/presentation')
    const css = readFileSync(path.join(dir, '__SLUG__.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css.trim()).toBe('')
    for (const f of ['entities.ts', 'Talk.tsx', 'steps/index.ts']) expect(existsSync(path.join(dir, f)), f).toBe(true)
  })
})
