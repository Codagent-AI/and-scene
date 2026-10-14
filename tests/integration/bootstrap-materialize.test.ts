// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

// INT-001: the bootstrap snapshot, materialized into a fresh directory outside this repository
// by the skill's own helper, builds, lints, and passes its local verification with a presentation
// generated from templates/presentation.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const skillRoot = join(repoRoot, 'skills', 'presentation')
const helper = join(skillRoot, 'scripts', 'scaffold.mjs')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
// Dependency install and Chromium provisioning dominate; the cache keeps repeat runs practical.
const MATERIALIZE_TIMEOUT_MS = 900_000

const disposables: string[] = []

afterAll(() => {
  for (const dir of disposables) rmSync(dir, { recursive: true, force: true })
})

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  disposables.push(dir)
  return dir
}

function listFiles(root: string, dir = ''): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const rel = join(dir, entry.name)
      return entry.isDirectory() ? listFiles(root, rel) : [rel]
    })
}

function step(command: string, args: string[], cwd: string, timeout: number) {
  const run = spawnSync(command, args, { cwd, encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024 })
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`
  return { status: run.status, output }
}

function expectPassing(label: string, result: { status: number | null; output: string }) {
  if (result.status !== 0) console.error(`${label} failed:\n${result.output}`)
  expect(result.status, label).toBe(0)
}

describe('INT-001 materialized bootstrap is complete and style-neutral', () => {
  it(
    'scaffolds, installs from the committed lock, builds, lints, and verifies a generated presentation',
    () => {
      // The helper runs from a directory unrelated to the skill and to the repository.
      const elsewhere = tempDir('and-scene-int-cwd-')
      const app = join(tempDir('and-scene-int-app-'), 'app')
      mkdirSync(app)

      const scaffold = step(process.execPath, [helper, 'scaffold', app, '--no-install'], elsewhere, 120_000)
      expectPassing('scaffold', scaffold)
      const add = step(
        process.execPath,
        [helper, 'add', app, '--slug', 'int-check', '--title', 'Integration check'],
        elsewhere,
        120_000,
      )
      expectPassing('add presentation', add)

      expectPassing('npm ci', step(npm, ['ci', '--no-audit', '--no-fund'], app, 600_000))
      expectPassing('npm run build', step(npm, ['run', 'build'], app, 300_000))
      expectPassing('npm run lint', step(npm, ['run', 'lint'], app, 300_000))
      const verify = step(npm, ['run', 'verify'], app, 900_000)
      expectPassing('npm run verify', verify)
      expect(verify.output).toMatch(/PASS: int-check \(1 steps\)/)
      expect(verify.output).toMatch(/ok int-check: step 1\/1/)

      // Three anchors and the full dependency set.
      for (const anchor of ['vite.config.ts', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts']) {
        expect(existsSync(join(app, anchor)), anchor).toBe(true)
      }
      const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as {
        dependencies: Record<string, string>
        devDependencies: Record<string, string>
      }
      const declared = { ...pkg.dependencies, ...pkg.devDependencies }
      for (const name of [
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
        'eslint',
        'typescript-eslint',
        'playwright',
      ]) {
        expect(declared[name], name).toBeDefined()
      }
      expect(Object.keys(declared).filter((name) => /tailwind/.test(name))).toEqual([])

      // Kit files are byte-identical to the canonical source.
      const canonicalKit = join(repoRoot, 'src', 'presentation-kit')
      const kitFiles = listFiles(canonicalKit).filter((file) => !/\.test\./.test(file))
      expect(listFiles(join(app, 'src', 'presentation-kit'))).toEqual(kitFiles)
      for (const file of kitFiles) {
        expect(readFileSync(join(app, 'src', 'presentation-kit', file), 'utf8'), file).toBe(
          readFileSync(join(canonicalKit, file), 'utf8'),
        )
      }

      // The scaffold's host CSS carries no visual defaults.
      const hostCss = readFileSync(join(app, 'src', 'index.css'), 'utf8')
      expect(hostCss).not.toMatch(/\b(color|font|font-family|background|border|box-shadow)\s*:/)
    },
    MATERIALIZE_TIMEOUT_MS,
  )
})
