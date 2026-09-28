/**
 * INT-001: Materialized bootstrap is complete and style-neutral.
 *
 * Copies `skills/presentation/templates/bootstrap/` into a fresh OS temp
 * directory (outside this repository), adds one minimal generated
 * presentation using only the scene kit's public contract, installs
 * dependencies for real, and proves the materialized app builds and passes
 * its own `npm run verify` render check. Also asserts the declared
 * dependency set, template-resolution independence from CWD, and
 * byte-for-byte kit parity (which doubles as proof that no visual defaults
 * were injected into the distributable snapshot).
 *
 * This test is intentionally slow (real `npm install` + a real Chromium
 * browser) — that is expected for an integration test at this boundary.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(TEST_DIR, '../../..')
const BOOTSTRAP_TEMPLATE = path.join(REPO_ROOT, 'skills', 'presentation', 'templates', 'bootstrap')
const SKILL_MD = path.join(REPO_ROOT, 'skills', 'presentation', 'SKILL.md')
const CANONICAL_KIT_DIR = path.join(REPO_ROOT, 'src', 'presentation-kit')
const TEMPLATE_KIT_DIR = path.join(BOOTSTRAP_TEMPLATE, 'src', 'presentation-kit')

const NPM_INSTALL_TIMEOUT_MS = 5 * 60 * 1000
const BUILD_TIMEOUT_MS = 3 * 60 * 1000
const VERIFY_TIMEOUT_MS = 4 * 60 * 1000
const SETUP_TIMEOUT_MS = NPM_INSTALL_TIMEOUT_MS * 2

let tempDir: string
let setupError: Error | null = null

const SMOKE_TALK_SOURCE = `import { Box, Label, Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'

interface SmokePayload {
  headline: string
}

function Scene({ payload }: SceneProps<SmokePayload>) {
  return (
    <SceneLayer>
      <Box layoutId="smoke-test-box">
        <Label>{payload.headline}</Label>
      </Box>
    </SceneLayer>
  )
}

const STEPS: Step<SmokePayload>[] = [
  {
    id: 'only-step',
    era: 'Demo',
    title: 'Smoke Test',
    caption: 'A single-step smoke test presentation, generated for INT-001.',
    payload: { headline: 'Hello, and-scene' },
    Scene,
  },
]

export default function Talk() {
  return <Presentation steps={STEPS} title="Smoke Test" initialMode="browse" />
}
`

function run(command: string, args: string[], cwd: string, timeout: number): string {
  return execFileSync(command, args, {
    cwd,
    timeout,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function listFilesRecursively(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(full))
    } else {
      files.push(full)
    }
  }
  return files
}

describe('bootstrap template integration (INT-001)', () => {
  beforeAll(async () => {
    try {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
      fs.cpSync(BOOTSTRAP_TEMPLATE, tempDir, { recursive: true })

      // Add ONE trivial generated presentation, using only the scene kit's
      // public contract (Presentation/SceneLayer/Box/Label/Step/SceneProps
      // exported from presentation-kit/index.ts) — no talk-specific kit
      // changes required.
      const presentationDir = path.join(tempDir, 'src', 'presentations', 'smoke-test')
      fs.mkdirSync(presentationDir, { recursive: true })
      fs.writeFileSync(path.join(presentationDir, 'Talk.tsx'), SMOKE_TALK_SOURCE)

      const registryPath = path.join(tempDir, 'src', 'presentations', 'index.ts')
      const registrySource = fs.readFileSync(registryPath, 'utf8')
      const registryEntry =
        "export const presentations: PresentationRegistryEntry[] = [\n" +
        "  { slug: 'smoke-test', title: 'Smoke Test', load: () => import('./smoke-test/Talk') },\n" +
        ']'
      const updatedRegistry = registrySource.replace(
        'export const presentations: PresentationRegistryEntry[] = []',
        registryEntry,
      )
      if (updatedRegistry === registrySource) {
        throw new Error('could not locate the empty registry array to append the smoke-test entry')
      }
      fs.writeFileSync(registryPath, updatedRegistry)

      run('npm', ['install', '--no-audit', '--no-fund'], tempDir, NPM_INSTALL_TIMEOUT_MS)
      run('npx', ['playwright', 'install', 'chromium'], tempDir, NPM_INSTALL_TIMEOUT_MS)
    } catch (err) {
      setupError = err instanceof Error ? err : new Error(String(err))
    }
  }, SETUP_TIMEOUT_MS)

  afterAll(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('completed setup (temp copy, registry edit, install) without error', () => {
    if (setupError) {
      throw setupError
    }
    expect(tempDir).toBeTruthy()
    expect(fs.existsSync(tempDir)).toBe(true)
  })

  it(
    'builds the materialized app from a working directory outside the source repo',
    () => {
      expect(path.resolve(tempDir)).not.toContain(REPO_ROOT)
      const output = run('npm', ['run', 'build'], tempDir, BUILD_TIMEOUT_MS)
      expect(output).toBeDefined()
    },
    BUILD_TIMEOUT_MS + 15_000,
  )

  it(
    'passes `npm run verify` (build + registry + Playwright render check) with no errors',
    () => {
      const output = run('npm', ['run', 'verify'], tempDir, VERIFY_TIMEOUT_MS)
      expect(output).toMatch(/All checks passed/)
      expect(output).not.toMatch(/FAILED/)
    },
    VERIFY_TIMEOUT_MS + 15_000,
  )

  it('declares the complete required dependency set', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const all = { ...pkg.dependencies, ...pkg.devDependencies }
    const required = [
      'playwright',
      'vite',
      '@vitejs/plugin-react',
      'typescript',
      'motion',
      'lucide-react',
      'react',
      'react-dom',
      'eslint',
    ]
    for (const dep of required) {
      expect(all, `expected package.json to declare "${dep}"`).toHaveProperty(dep)
    }
  })

  it('resolves templates relative to the skill file, not the caller CWD', () => {
    const skillSource = fs.readFileSync(SKILL_MD, 'utf8')
    expect(skillSource).toMatch(/import\.meta\.url/)
    // The build/verify assertions above already ran with `cwd: tempDir`,
    // fully outside REPO_ROOT, proving working-directory independence in
    // practice.
    expect(path.isAbsolute(tempDir)).toBe(true)
  })

  it('never introduces Tailwind into the scaffold', () => {
    const pkgSource = fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8')
    expect(pkgSource.toLowerCase()).not.toMatch(/tailwind/)
  })

  it('keeps the distributable scene kit byte-identical to the canonical kit (proves parity and absence of injected visual defaults)', () => {
    const canonicalFiles = listFilesRecursively(CANONICAL_KIT_DIR).filter(
      (file) => !file.includes(`${path.sep}__tests__${path.sep}`),
    )
    expect(canonicalFiles.length).toBeGreaterThan(0)

    for (const canonicalFile of canonicalFiles) {
      const relative = path.relative(CANONICAL_KIT_DIR, canonicalFile)
      const templateFile = path.join(TEMPLATE_KIT_DIR, relative)
      expect(fs.existsSync(templateFile), `missing template copy of ${relative}`).toBe(true)
      const canonicalContent = fs.readFileSync(canonicalFile, 'utf8')
      const templateContent = fs.readFileSync(templateFile, 'utf8')
      expect(templateContent, `${relative} drifted from the canonical scene kit`).toBe(canonicalContent)
    }

    // No stray extra files in the template copy beyond the canonical set.
    const templateFiles = listFilesRecursively(TEMPLATE_KIT_DIR)
    expect(templateFiles.length).toBe(canonicalFiles.length)
  })
})
