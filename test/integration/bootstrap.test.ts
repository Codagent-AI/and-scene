import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SKILL_MD = path.join(REPO_ROOT, 'skills', 'presentation', 'SKILL.md')
const SKILL_DIR = path.dirname(SKILL_MD)
const BOOTSTRAP_TEMPLATE = path.join(SKILL_DIR, 'templates', 'bootstrap')
const CANONICAL_KIT = path.join(REPO_ROOT, 'src', 'presentation-kit')

const REQUIRED_DEPENDENCIES = ['react', 'react-dom', 'motion', 'lucide-react']
const REQUIRED_DEV_DEPENDENCIES = [
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
  'globals',
  'typescript-eslint',
  'playwright',
]

function listFilesRecursive(dir: string, base = dir): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(full, base))
    } else {
      files.push(path.relative(base, full))
    }
  }
  return files.sort()
}

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  let workDir: string
  let appDir: string

  beforeAll(() => {
    // Resolve the template relative to the skill file, not this test's cwd,
    // then materialize it outside the source repository entirely.
    expect(statSync(SKILL_MD).isFile()).toBe(true)
    workDir = mkdtempSync(path.join(tmpdir(), 'and-scene-bootstrap-'))
    appDir = path.join(workDir, 'materialized-app')
    cpSync(BOOTSTRAP_TEMPLATE, appDir, { recursive: true })

    execFileSync('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: appDir,
      stdio: 'inherit',
    })
  }, 180_000)

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true })
  })

  it('resolves the template independent of the caller working directory', () => {
    // The template was located via SKILL_DIR (derived from SKILL_MD's own
    // path) above, then materialized into a tmp dir far from REPO_ROOT and
    // outside this test's cwd (process.cwd() stays at the repo root/whatever
    // the test runner started in) — the copy above succeeding already proves
    // resolution did not depend on process.cwd().
    expect(path.isAbsolute(BOOTSTRAP_TEMPLATE)).toBe(true)
    expect(appDir.startsWith(REPO_ROOT)).toBe(false)
  })

  it('declares the complete required dependency set with no Tailwind', () => {
    const pkg = JSON.parse(readFileSync(path.join(appDir, 'package.json'), 'utf8'))
    for (const dep of REQUIRED_DEPENDENCIES) {
      expect(pkg.dependencies, `missing runtime dependency ${dep}`).toHaveProperty(dep)
    }
    for (const dep of REQUIRED_DEV_DEPENDENCIES) {
      expect(pkg.devDependencies, `missing dev dependency ${dep}`).toHaveProperty(dep)
    }
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of Object.keys(allDeps)) {
      expect(name.toLowerCase()).not.toContain('tailwind')
    }
  })

  it('has all three scaffold anchors present', () => {
    expect(statSync(path.join(appDir, 'vite.config.ts')).isFile()).toBe(true)
    expect(statSync(path.join(appDir, 'package.json')).isFile()).toBe(true)
    expect(statSync(path.join(appDir, 'src', 'presentation-kit', 'types.ts')).isFile()).toBe(true)
    expect(statSync(path.join(appDir, 'src', 'presentation-kit', 'Presentation.tsx')).isFile()).toBe(true)
    expect(statSync(path.join(appDir, 'src', 'presentation-kit', 'Stage.tsx')).isFile()).toBe(true)
    const registrySource = readFileSync(path.join(appDir, 'src', 'presentations', 'index.ts'), 'utf8')
    expect(registrySource).toMatch(/export const presentations/)
  })

  it('ships no kit-owned visual defaults', () => {
    const kitSource = listFilesRecursive(path.join(appDir, 'src', 'presentation-kit'))
      .filter((file) => file.endsWith('.tsx') || file.endsWith('.ts'))
      .map((file) => readFileSync(path.join(appDir, 'src', 'presentation-kit', file), 'utf8'))
      .join('\n')
    for (const forbidden of ['background-color', 'font-family', 'box-shadow', 'border-radius', 'tailwind']) {
      expect(kitSource.toLowerCase()).not.toContain(forbidden)
    }
  })

  it('keeps the template kit byte-aligned with the canonical src/presentation-kit', () => {
    const canonicalFiles = listFilesRecursive(CANONICAL_KIT)
    const templateFiles = listFilesRecursive(path.join(appDir, 'src', 'presentation-kit'))
    expect(templateFiles).toEqual(canonicalFiles)
    for (const file of canonicalFiles) {
      const canonical = readFileSync(path.join(CANONICAL_KIT, file), 'utf8')
      const template = readFileSync(path.join(appDir, 'src', 'presentation-kit', file), 'utf8')
      expect(template, `${file} drifted from canonical src/presentation-kit`).toBe(canonical)
    }
  })

  it('builds without Tailwind or another styling framework', () => {
    execFileSync('npm', ['run', 'build'], { cwd: appDir, stdio: 'inherit' })
    expect(statSync(path.join(appDir, 'dist', 'index.html')).isFile()).toBe(true)
  }, 60_000)

  it('builds and renders its registered route through the local verification entry point', () => {
    execFileSync('npm', ['run', 'verify'], { cwd: appDir, stdio: 'inherit' })
  }, 120_000)
})
