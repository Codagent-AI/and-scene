import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REPO_ROOT, run, type RunResult } from './helpers'

// INT-001: the distributable bootstrap, materialized outside the repository, installs from its
// committed lockfile, builds, lints, and passes the local verification gate with one generated
// presentation. Setup is shared by every case in this file.

const TEMPLATES = resolve(import.meta.dirname, '..', '..', 'skills', 'presentation', 'templates')
const BOOT = join(TEMPLATES, 'bootstrap')
const PRES = join(TEMPLATES, 'presentation')
const SLUG = 'bootstrap-smoke'
const TITLE = 'Bootstrap Smoke'
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

function kitDigests(root: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rel of walk(join(root, KIT)).filter((r) => !TEST_FILE.test(r))) out[rel] = sha(join(root, KIT, rel))
  return out
}

let app = ''
let scratch = ''
let install: RunResult
let build: RunResult
let lint: RunResult
let verify: RunResult

beforeAll(async () => {
  // Fresh directory outside the repository; every child process runs with this as its cwd.
  scratch = mkdtempSync(join(tmpdir(), 'and-scene-int001-'))
  app = join(scratch, 'app')
  cpSync(BOOT, app, { recursive: true })

  const env = { PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' }
  install = await run('npm', ['ci', '--no-audit', '--no-fund', '--prefer-offline'], {
    cwd: app,
    env,
    timeoutMs: 900_000,
  })
  if (install.code !== 0) return

  // Instantiate the presentation template (README.md is documentation, not copied) and register it.
  const dest = join(app, 'src/presentations', SLUG)
  for (const rel of walk(PRES).filter((r) => r !== 'README.md')) {
    const target = join(dest, rel)
    mkdirSync(join(target, '..'), { recursive: true })
    // Kit specifiers are computed from the scene-kit location recorded for this layout (src/presentation-kit).
    const text = readFileSync(join(PRES, rel), 'utf8')
      .replaceAll('__SLUG__', SLUG)
      .replaceAll('__TITLE__', TITLE)
      .replaceAll('__KIT_FROM_STEPS__', '../../../presentation-kit')
      .replaceAll('__KIT__', '../../presentation-kit')
    writeFileSync(target, text)
  }
  const registryPath = join(app, 'src/presentations/index.ts')
  const registry = readFileSync(registryPath, 'utf8')
  const line = `  { slug: '${SLUG}', title: '${TITLE}', load: () => import('./${SLUG}/Talk') },`
  const closing = registry.match(/\n\]\n/g) ?? []
  if (closing.length !== 1) throw new Error('registry closing bracket not found exactly once')
  writeFileSync(registryPath, registry.replace(/\n\]\n/, `\n${line}\n]\n`))

  build = await run('npm', ['run', 'build'], { cwd: app, env, timeoutMs: 600_000 })
  lint = await run('npm', ['run', 'lint'], { cwd: app, env, timeoutMs: 600_000 })
  verify = await run('npm', ['run', 'verify'], { cwd: app, env, timeoutMs: 900_000 })
}, 2_400_000)

afterAll(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true })
})

describe('INT-001 materialized bootstrap', () => {
  it('is materialized outside the source repository from the skill-relative template', () => {
    expect(app.startsWith(REPO_ROOT + sep)).toBe(false)
    expect(existsSync(join(app, 'package.json'))).toBe(true)
    expect(existsSync(join(app, 'src/presentations', SLUG, 'Talk.tsx'))).toBe(true)
  })

  it('has all three scaffold anchors: build setup, scene kit, and registered presentation', () => {
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(existsSync(join(app, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(app, 'tsconfig.app.json'))).toBe(true)
    const kitIndex = readFileSync(join(app, KIT, 'index.ts'), 'utf8')
    expect(kitIndex).toContain("export { Presentation } from './Presentation'")
    expect(kitIndex).toMatch(/export type \{[^}]*\bStep\b[^}]*\}/)
    expect(kitIndex).toMatch(/export type \{[^}]*\bSceneProps\b[^}]*\}/)
    const registry = readFileSync(join(app, 'src/presentations/index.ts'), 'utf8')
    expect(registry.match(/slug:\s*['"]/g)).toHaveLength(1)
    expect(registry).toContain(`import('./${SLUG}/Talk')`)
  })

  it('installs with npm ci from the committed lockfile without rewriting it', () => {
    expect(install.output).toBeDefined()
    expect(install.code, install.output.slice(-2000)).toBe(0)
    expect(sha(join(app, 'package-lock.json'))).toBe(sha(join(BOOT, 'package-lock.json')))
    const missing = REQUIRED_DEPS.filter((name) => !existsSync(join(app, 'node_modules', name, 'package.json')))
    expect(missing).toEqual([])
  })

  it('builds the materialized app', () => {
    expect(build.code, build.output.slice(-2000)).toBe(0)
  })

  it('lints the materialized app', () => {
    expect(lint.code, lint.output.slice(-2000)).toBe(0)
  })

  it('passes the local verification gate and renders the registered route', () => {
    expect(verify.code, verify.output.slice(-3000)).toBe(0)
    expect(verify.output).toContain('PASS verify')
    expect(verify.output).toContain('sample skipped')
    expect(verify.output).toMatch(/1 registered presentation, \d+ steps rendered cleanly/)
    expect(verify.output).toMatch(new RegExp(`open http://127\\.0\\.0\\.1:\\d+/${SLUG}`))
  })

  it('materialized non-test kit files stay byte-identical to the canonical kit', () => {
    expect(kitDigests(app)).toEqual(kitDigests(REPO_ROOT))
  })

  it('materialized root scripts stay byte-identical to the canonical scripts', () => {
    for (const script of SCRIPTS) expect(sha(join(app, script)), script).toBe(sha(join(REPO_ROOT, script)))
  })

  it('declares the complete dependency set and no styling framework', () => {
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    const declared = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(REQUIRED_DEPS.filter((name) => !(name in declared))).toEqual([])
    const files = ['package.json', 'package-lock.json', 'vite.config.ts', 'index.html', 'src/index.css', 'src/main.tsx']
    for (const rel of files) expect(readFileSync(join(app, rel), 'utf8'), rel).not.toMatch(/tailwind/i)
  })

  it('ships no visual defaults in host files; the generated presentation owns its styling', () => {
    const hostFiles = ['src/index.css', 'src/Root.tsx', 'src/Landing.tsx', 'src/router.ts', 'src/main.tsx', 'index.html']
    const offenders = hostFiles.filter((rel) =>
      /\b(color|background|font-family|font-size|border|box-shadow|border-radius|padding|margin)\s*:|#[0-9a-fA-F]{3,6}\b|\brgba?\(/.test(
        readFileSync(join(app, rel), 'utf8'),
      ),
    )
    expect(offenders).toEqual([])
    expect(readFileSync(join(app, 'src/presentations', SLUG, 'styles.css'), 'utf8')).toContain('[data-presentation-attribution]')
  })

  it('leaves no unreplaced placeholders in the generated presentation', () => {
    const files = walk(join(app, 'src/presentations', SLUG))
    const leftover = files.filter((rel) => /__(SLUG|TITLE|KIT|KIT_FROM_STEPS)__/.test(readFileSync(join(app, 'src/presentations', SLUG, rel), 'utf8')))
    expect(leftover).toEqual([])
    expect(existsSync(join(app, 'src/presentations', SLUG, 'README.md'))).toBe(false)
  })
})
