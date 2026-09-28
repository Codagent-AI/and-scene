import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runVerify } from '../../scripts/__tests__/helpers/isolated-copy'

/**
 * INT-001: materializes the distributable `skills/presentation/templates/bootstrap/`
 * snapshot into an isolated temporary directory outside this repository, installs
 * its committed lockfile, and proves it is a complete, style-neutral, self-contained
 * scaffold — independent of this checkout's working directory.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SKILL_DIR = path.join(REPO_ROOT, 'skills', 'presentation')
const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
const CANONICAL_KIT_DIR = path.join(REPO_ROOT, 'src', 'presentation-kit')
const TEMPLATE_KIT_DIR = path.join(BOOTSTRAP_DIR, 'src', 'presentation-kit')

const REQUIRED_DEPENDENCIES = ['react', 'react-dom', 'motion', 'lucide-react']
const REQUIRED_DEV_DEPENDENCIES = [
  'vite',
  '@vitejs/plugin-react',
  'typescript',
  '@types/react',
  '@types/react-dom',
  '@types/node',
  'eslint',
  'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh',
  'typescript-eslint',
  'playwright',
]

function listFilesRecursive(dir: string, base = dir): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    if (entry.name === '__tests__') return []
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listFilesRecursive(full, base)
    return [path.relative(base, full)]
  })
}

/** Substitutes `__TOKEN__` placeholders the same way the skill procedure does. */
function fillTemplate(source: string, tokens: Record<string, string>): string {
  return Object.entries(tokens).reduce((text, [token, value]) => text.split(`__${token}__`).join(value), source)
}

let tempDir: string

describe('INT-001: materialized bootstrap template', () => {
  beforeAll(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'and-scene-bootstrap-'))

    cpSync(BOOTSTRAP_DIR, tempDir, { recursive: true })

    // Materialize a minimal presentation from templates/presentation/ so the
    // scaffold has a registered route to build and render, exactly as the
    // skill's "create" flow would produce for a real request.
    const slug = 'demo'
    const presentationDir = path.join(tempDir, 'src', 'presentations', slug)
    mkdirSync(path.join(presentationDir, 'steps'), { recursive: true })

    const presentationTemplateDir = path.join(SKILL_DIR, 'templates', 'presentation')
    const tokens = {
      SLUG: slug,
      TITLE: 'Demo Talk',
      ERA: 'intro',
      STEP_TITLE: 'Hello',
      STEP_CAPTION: 'It begins',
      STEP_VISUAL: 'Hello',
    }

    for (const [file, dest] of [
      ['Talk.tsx', 'Talk.tsx'],
      ['entities.ts', 'entities.ts'],
      ['PRESENTATION.css', `${slug}.css`],
      ['steps/index.ts', 'steps/index.ts'],
      ['steps/step-01.tsx', 'steps/step-01.tsx'],
    ]) {
      const source = readFileSync(path.join(presentationTemplateDir, file), 'utf8')
      writeFileSync(path.join(presentationDir, dest), fillTemplate(source, tokens))
    }

    const registryPath = path.join(tempDir, 'src', 'presentations', 'index.ts')
    const registrySource = readFileSync(registryPath, 'utf8')
    writeFileSync(
      registryPath,
      registrySource.replace(
        'export const presentations: PresentationRegistryEntry[] = []',
        `export const presentations: PresentationRegistryEntry[] = [\n  { slug: '${slug}', title: 'Demo Talk', load: () => import('./${slug}/Talk') },\n]`,
      ),
    )

    const install = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: tempDir, encoding: 'utf8' })
    if (install.status !== 0) {
      throw new Error(`npm ci failed:\n${install.stdout}\n${install.stderr}`)
    }
  }, 180_000)

  afterAll(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true })
  })

  it('resolves and materializes independent of the caller working directory', () => {
    expect(tempDir).not.toContain(REPO_ROOT)
    expect(statSync(path.join(tempDir, 'package.json')).isFile()).toBe(true)
  })

  it('provides all three contract anchors', () => {
    expect(statSync(path.join(tempDir, 'package.json')).isFile()).toBe(true)
    expect(statSync(path.join(tempDir, 'vite.config.ts')).isFile()).toBe(true)
    expect(statSync(path.join(tempDir, 'src', 'presentation-kit', 'types.ts')).isFile()).toBe(true)
    expect(statSync(path.join(tempDir, 'src', 'presentation-kit', 'Presentation.tsx')).isFile()).toBe(true)
    expect(statSync(path.join(tempDir, 'src', 'presentations', 'index.ts')).isFile()).toBe(true)
  })

  it('declares the complete required dependency set and no styling framework', () => {
    const pkg = JSON.parse(readFileSync(path.join(tempDir, 'package.json'), 'utf8'))
    for (const dependency of REQUIRED_DEPENDENCIES) {
      expect(pkg.dependencies, `missing dependency "${dependency}"`).toHaveProperty(dependency)
    }
    for (const dependency of REQUIRED_DEV_DEPENDENCIES) {
      expect(pkg.devDependencies, `missing devDependency "${dependency}"`).toHaveProperty(dependency)
    }

    const allDeclared = { ...pkg.dependencies, ...pkg.devDependencies }
    const styleFrameworks = Object.keys(allDeclared).filter((name) => /tailwind/i.test(name))
    expect(styleFrameworks).toEqual([])
  })

  it('ships a scene kit with no visual-default styling and installs cleanly', () => {
    const kitFiles = listFilesRecursive(path.join(tempDir, 'src', 'presentation-kit'))
    expect(kitFiles.length).toBeGreaterThan(0)
    for (const relativePath of kitFiles) {
      if (!relativePath.endsWith('.ts') && !relativePath.endsWith('.tsx')) continue
      const contents = readFileSync(path.join(tempDir, 'src', 'presentation-kit', relativePath), 'utf8')
      expect(contents, `${relativePath} should not import a stylesheet`).not.toMatch(/import\s+['"].*\.css['"]/)
    }
  })

  it('keeps the template scene kit byte-aligned with the canonical src/presentation-kit source', () => {
    const canonicalFiles = listFilesRecursive(CANONICAL_KIT_DIR).sort()
    const templateFiles = listFilesRecursive(TEMPLATE_KIT_DIR).sort()
    expect(templateFiles).toEqual(canonicalFiles)

    for (const relativePath of canonicalFiles) {
      const canonical = readFileSync(path.join(CANONICAL_KIT_DIR, relativePath), 'utf8')
      const template = readFileSync(path.join(TEMPLATE_KIT_DIR, relativePath), 'utf8')
      expect(template, `${relativePath} has drifted from the canonical kit`).toEqual(canonical)
    }
  })

  it('builds the materialized app with no type or build errors', () => {
    const build = spawnSync('npm', ['run', 'build'], { cwd: tempDir, encoding: 'utf8' })
    expect(build.status, `build failed:\n${build.stdout}\n${build.stderr}`).toBe(0)
    expect(statSync(path.join(tempDir, 'dist', 'index.html')).isFile()).toBe(true)
  }, 60_000)

  it('opens its registered route through its local verification entry point', () => {
    const verify = runVerify(tempDir)
    expect(verify.status, `verify failed:\n${verify.stdout}\n${verify.stderr}`).toBe(0)
    expect(verify.stdout).toMatch(/\[verify\] PASS/)
  }, 120_000)
})
