import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Static contract checks for the distributable scaffold: kit and root-script parity with
// the bootstrap template, declared dependencies, committed lockfile, and style neutrality.
// Runs under `npm test`; the materialized-tree integration check lives in tests/browser.

const REPO = resolve(import.meta.dirname, '..', '..')
const BOOT = join(REPO, 'skills/presentation/templates/bootstrap')
const PRES = join(REPO, 'skills/presentation/templates/presentation')
const KIT = 'src/presentation-kit'
const SCRIPTS = ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']
const TEST_FILE = /\.test\.(ts|tsx|mjs)$/

const REQUIRED_DEPS = [
  'react',
  'react-dom',
  'motion',
  'lucide-react',
  'vite',
  '@vitejs/plugin-react',
  'typescript',
  '@types/react',
  '@types/react-dom',
  '@types/node',
  '@eslint/js',
  'eslint',
  'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh',
  'typescript-eslint',
  'globals',
  'playwright',
]

/** Relative POSIX paths of every file under dir, sorted. */
function walk(dir: string, prefix = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...walk(dir, rel))
    else out.push(rel)
  }
  return out.sort()
}

const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')
const read = (file: string) => readFileSync(file, 'utf8')
const isKitSource = (rel: string) => !TEST_FILE.test(rel)

/** sha256 per non-test kit file, keyed by path relative to the kit directory. */
function kitDigests(root: string): Record<string, string> {
  const dir = join(root, KIT)
  const out: Record<string, string> = {}
  for (const rel of walk(dir).filter(isKitSource)) out[rel] = sha(join(dir, rel))
  return out
}

function declaredDeps(pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }) {
  return { ...pkg.dependencies, ...pkg.devDependencies }
}

const bootPkg = JSON.parse(read(join(BOOT, 'package.json')))
const bootLock = JSON.parse(read(join(BOOT, 'package-lock.json')))

describe('bootstrap kit parity', () => {
  it('template kit holds the same non-test file set as src/presentation-kit', () => {
    const canonical = walk(join(REPO, KIT)).filter(isKitSource)
    const template = walk(join(BOOT, KIT)).filter(isKitSource)
    expect(template).toEqual(canonical)
  })

  it('template kit ships no test files', () => {
    expect(walk(join(BOOT, KIT)).filter((rel) => TEST_FILE.test(rel))).toEqual([])
  })

  it('every template kit file is byte-identical to its canonical source', () => {
    expect(kitDigests(BOOT)).toEqual(kitDigests(REPO))
  })
})

describe('bootstrap root script parity', () => {
  it.each(SCRIPTS)('%s is byte-identical to its template copy', (script) => {
    expect(sha(join(BOOT, script))).toBe(sha(join(REPO, script)))
  })
})

describe('bootstrap dependencies and lockfile', () => {
  it('package.json declares the complete required dependency set', () => {
    const declared = declaredDeps(bootPkg)
    const missing = REQUIRED_DEPS.filter((name) => !(name in declared))
    expect(missing).toEqual([])
  })

  it('package-lock.json records the required dependency set at the root', () => {
    const root = bootLock.packages[''] ?? {}
    const locked = declaredDeps(root)
    const missing = REQUIRED_DEPS.filter((name) => !(name in locked))
    expect(missing).toEqual([])
    const unresolved = REQUIRED_DEPS.filter((name) => !bootLock.packages[`node_modules/${name}`])
    expect(unresolved).toEqual([])
  })

  it('package.json and lock agree on each declared dependency', () => {
    const lockRoot = declaredDeps(bootLock.packages[''] ?? {})
    expect(lockRoot).toEqual(declaredDeps(bootPkg))
  })

  it('the bootstrap package.json exposes the declared build, lint, verify and inspect scripts', () => {
    for (const name of ['build', 'lint', 'verify', 'inspect', 'dev', 'preview']) {
      expect(bootPkg.scripts, name).toHaveProperty(name)
    }
    expect(bootPkg.scripts.build).toBe('tsc -b && vite build')
  })

  it('the lockfile is git-tracked and not generated only at test time', () => {
    const tracked = execFileSync('git', ['ls-files', '--', 'skills/presentation/templates/bootstrap/package-lock.json'], {
      cwd: REPO,
      encoding: 'utf8',
    }).trim()
    expect(tracked).toBe('skills/presentation/templates/bootstrap/package-lock.json')
  })

  it('no Tailwind package appears in package.json or the lockfile', () => {
    expect(read(join(BOOT, 'package.json'))).not.toMatch(/tailwind/i)
    expect(Object.keys(bootLock.packages).filter((key) => /tailwind/i.test(key))).toEqual([])
  })
})

describe('bootstrap style neutrality', () => {
  // Host and scaffold files, excluding the kit (checked by parity and the kit scan) and root scripts.
  const scaffoldFiles = walk(BOOT).filter(
    (rel) =>
      !rel.startsWith(`${KIT}/`) &&
      !rel.startsWith('scripts/') &&
      rel !== 'package-lock.json' &&
      !rel.endsWith('.gitignore'),
  )

  const VISUAL_DEFAULTS = [
    /\b(color|background|background-color|font|font-family|font-size|font-weight|border|border-radius|box-shadow|text-shadow|padding|margin|outline)\s*:/,
    /#[0-9a-fA-F]{3,8}\b/,
    /\b(rgb|rgba|hsl|hsla)\(/,
    /\bstyle=\{\{/,
    /@import\s+['"](?!\.)/,
    /\bclassName=["'][^"']*\b(btn|card|button)\b/,
  ]

  it('scaffold files reference no styling framework', () => {
    const offenders = scaffoldFiles.filter((rel) => /tailwind/i.test(read(join(BOOT, rel))))
    expect(offenders).toEqual([])
  })

  it('scaffold files define no visual defaults (colors, fonts, spacing, borders, shadows, components)', () => {
    const hits: string[] = []
    for (const rel of scaffoldFiles) {
      if (!/\.(tsx?|css|html|json|js)$/.test(rel) || rel === 'package.json' || rel === 'verify.config.json') continue
      const text = read(join(BOOT, rel))
      for (const pattern of VISUAL_DEFAULTS) if (pattern.test(text)) hits.push(`${rel}: ${pattern}`)
    }
    expect(hits).toEqual([])
  })

  it('bootstrap registry ships with no presentations', () => {
    const registry = read(join(BOOT, 'src/presentations/index.ts'))
    expect(registry.match(/slug:\s*['"]/g) ?? []).toEqual([])
    expect(registry).toMatch(/export const presentations: readonly PresentationEntry\[\] = \[\s*\]/)
  })

  it('verify.config.json disables the reference sample', () => {
    expect(JSON.parse(read(join(BOOT, 'verify.config.json')))).toEqual({ sample: false })
  })

  it('the reference presentation owns its CSS; the kit ships none', () => {
    const refStyles = join(REPO, 'src/presentations/how-to-make-a-presentation/styles.css')
    expect(existsSync(refStyles)).toBe(true)
    expect(read(join(REPO, 'src/presentations/how-to-make-a-presentation/Talk.tsx'))).toContain("import './styles.css'")
    const kitCss = walk(join(REPO, KIT)).filter((rel) => rel.endsWith('.css'))
    expect(kitCss).toEqual([])
  })

  it('the presentation template is a complete starter with active-state and attribution hooks', () => {
    for (const rel of ['entities.ts', 'Scene.tsx', 'Talk.tsx', 'styles.css', 'steps/index.ts', 'README.md']) {
      expect(existsSync(join(PRES, rel)), rel).toBe(true)
    }
    const css = read(join(PRES, 'styles.css'))
    expect(css).toContain('[data-presentation-active]')
    expect(css).toContain('[data-presentation-attribution]')
    expect(read(join(PRES, 'steps/index.ts')).match(/^\s+id: '/gm)?.length).toBe(3)
    expect(read(join(PRES, 'entities.ts'))).toContain("export const NS = '__SLUG__'")
    expect(read(join(PRES, 'Talk.tsx'))).toContain('title="__TITLE__"')
    expect(walk(PRES).filter((rel) => /tailwind/i.test(read(join(PRES, rel))))).toEqual([])
  })
})
