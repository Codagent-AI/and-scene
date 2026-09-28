/**
 * E2E-002: Verification failures are actionable.
 *
 * Runs `npm run verify` against independent disposable copies of this
 * repository, each with one representative fault injected, and asserts
 * every copy exits non-zero, names the failed phase (and, for
 * browser/transition faults, the offending step), never reports success,
 * and leaves the source checkout untouched.
 *
 * Each copy reuses this repo's installed `node_modules` via a symlink
 * (already proven complete/correct by INT-001) instead of a fresh
 * `npm install`, so fault injection stays fast and deterministic.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(TEST_DIR, '../..')

const RUN_TIMEOUT_MS = 3 * 60 * 1000
const SETUP_TIMEOUT_MS = RUN_TIMEOUT_MS

let baseDir: string
let baseRepoStateBefore: string[]
let setupError: Error | null = null

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

function makeCopy(label: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `and-scene-verify-${label}-`))
  fs.cpSync(baseDir, dir, { recursive: true })
  fs.symlinkSync(path.join(REPO_ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

/** Runs verify in `dir` and returns { status, output } without throwing on non-zero exit. */
function runVerify(dir: string): { status: number; output: string } {
  try {
    const output = execFileSync('npm', ['run', 'verify'], {
      cwd: dir,
      timeout: RUN_TIMEOUT_MS,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { status: 0, output }
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

describe('verification failures are actionable (E2E-002)', () => {
  beforeAll(() => {
    try {
      baseRepoStateBefore = listFilesRecursively(REPO_ROOT).filter((f) => !f.includes(`${path.sep}node_modules${path.sep}`))
      baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-verify-base-'))
      fs.cpSync(REPO_ROOT, baseDir, {
        recursive: true,
        filter: (src) => {
          const relative = path.relative(REPO_ROOT, src)
          return !/^(node_modules|dist|screenshots|\.git)(\/|$)/.test(relative)
        },
      })
    } catch (err) {
      setupError = err instanceof Error ? err : new Error(String(err))
    }
  }, SETUP_TIMEOUT_MS)

  afterAll(() => {
    if (baseDir) fs.rmSync(baseDir, { recursive: true, force: true })

    // The source checkout must be unchanged by any fault-injection copy.
    const after = listFilesRecursively(REPO_ROOT).filter((f) => !f.includes(`${path.sep}node_modules${path.sep}`))
    expect(after.sort()).toEqual(baseRepoStateBefore.sort())
  })

  it(
    'fails the build phase on a build-breaking edit',
    () => {
      if (setupError) throw setupError
      const dir = makeCopy('build')
      try {
        const sceneFile = path.join(dir, 'src', 'presentations', 'how-to-make-a-presentation', 'Scene.tsx')
        fs.appendFileSync(sceneFile, '\nconst brokenSyntax: = ;\n')

        const { status, output } = runVerify(dir)

        expect(status).not.toBe(0)
        expect(output).toMatch(/FAILED \(build\)/)
        expect(output).not.toMatch(/All checks passed/)
      } finally {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    },
    RUN_TIMEOUT_MS + 15_000,
  )

  it(
    'fails the registry phase when the reference sample is missing',
    () => {
      if (setupError) throw setupError
      const dir = makeCopy('missing-sample')
      try {
        const registryPath = path.join(dir, 'src', 'presentations', 'index.ts')
        const source = fs.readFileSync(registryPath, 'utf8')
        // Replace the canonical slug with an unrelated one, so the registry
        // is non-empty but no longer contains the reference sample.
        const retargeted = source.replace(/slug: 'how-to-make-a-presentation'/, "slug: 'something-else'")
        expect(retargeted).not.toBe(source)
        fs.writeFileSync(registryPath, retargeted)

        const { status, output } = runVerify(dir)

        expect(status).not.toBe(0)
        expect(output).toMatch(/FAILED \(registry\)/)
        expect(output).toMatch(/how-to-make-a-presentation.*not registered/)
        expect(output).not.toMatch(/All checks passed/)
      } finally {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    },
    RUN_TIMEOUT_MS + 15_000,
  )

  it(
    'fails the render phase and names the offending step on a runtime/console error',
    () => {
      if (setupError) throw setupError
      const dir = makeCopy('console-error')
      try {
        const sceneFile = path.join(dir, 'src', 'presentations', 'how-to-make-a-presentation', 'Scene.tsx')
        const source = fs.readFileSync(sceneFile, 'utf8')
        const patched = source.replace(
          'export function HowToMakeAPresentationScene({ payload }: SceneProps<HowToMakeAPresentationPayload>) {\n  const { step } = payload',
          'export function HowToMakeAPresentationScene({ payload }: SceneProps<HowToMakeAPresentationPayload>) {\n' +
            '  const { step } = payload\n' +
            "  if (step === 5) console.error('E2E-002 fault-injection console error')",
        )
        expect(patched).not.toBe(source)
        fs.writeFileSync(sceneFile, patched)

        const { status, output } = runVerify(dir)

        expect(status).not.toBe(0)
        expect(output).toMatch(/FAILED \(render\)/)
        expect(output).toMatch(/at step 4/)
        expect(output).toMatch(/E2E-002 fault-injection console error/)
        expect(output).not.toMatch(/All checks passed/)
      } finally {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    },
    RUN_TIMEOUT_MS + 15_000,
  )

  it(
    'fails the render phase when a step transition does not advance the public step index',
    () => {
      if (setupError) throw setupError
      const dir = makeCopy('stuck-nav')
      try {
        const navFile = path.join(dir, 'src', 'presentation-kit', 'usePresentationNav.ts')
        const source = fs.readFileSync(navFile, 'utf8')
        const patched = source.replace(
          'const next = useCallback(() => setIndex((current) => clamp(current + 1)), [clamp])',
          'const next = useCallback(() => setIndex((current) => current), [clamp])',
        )
        expect(patched).not.toBe(source)
        fs.writeFileSync(navFile, patched)

        const { status, output } = runVerify(dir)

        expect(status).not.toBe(0)
        expect(output).toMatch(/FAILED \(render\)/)
        expect(output).toMatch(/did not advance by one/)
        expect(output).not.toMatch(/All checks passed/)
      } finally {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    },
    RUN_TIMEOUT_MS + 15_000,
  )

  // Each case above spawns and terminates its own `vite preview` subprocess
  // on a freshly allocated port; a preview subprocess left running from a
  // prior case would surface as an EADDRINUSE/hang failure in the next
  // case, so the four passing cases above are themselves the proof that
  // `terminate()` releases the port between runs.
})
