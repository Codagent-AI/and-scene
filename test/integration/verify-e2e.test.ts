import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

// Files needed to run `npm run build` / `npm run verify` — everything except
// node_modules (symlinked back to the real install, so copies stay fast and
// never redownload Chromium) and generated output.
const INCLUDE = [
  'package.json',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'scripts',
  'src',
  'public',
]

const workDirs: string[] = []

function makeDisposableCopy(): string {
  const workDir = mkdtempSync(path.join(tmpdir(), 'and-scene-e2e-'))
  workDirs.push(workDir)
  const appDir = path.join(workDir, 'app')
  mkdirSync(appDir)
  for (const name of INCLUDE) {
    cpSync(path.join(REPO_ROOT, name), path.join(appDir, name), { recursive: true })
  }
  symlinkSync(path.join(REPO_ROOT, 'node_modules'), path.join(appDir, 'node_modules'), 'dir')
  return appDir
}

/** Runs `npm run verify` in `appDir` and returns its outcome without throwing. */
function runVerify(appDir: string): { status: number; output: string } {
  try {
    const output = execFileSync('npm', ['run', 'verify'], { cwd: appDir, encoding: 'utf8', stdio: 'pipe' })
    return { status: 0, output }
  } catch (error) {
    const execError = error as { status?: number; stdout?: string; stderr?: string }
    return { status: execError.status ?? 1, output: `${execError.stdout ?? ''}${execError.stderr ?? ''}` }
  }
}

afterEach(() => {
  while (workDirs.length > 0) {
    const workDir = workDirs.pop()
    if (workDir) rmSync(workDir, { recursive: true, force: true })
  }
})

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, renders every canonical step on 127.0.0.1, and exits zero', () => {
    const { status, output } = runVerify(REPO_ROOT)
    expect(output).toContain('127.0.0.1')
    expect(output).toContain('how-to-make-a-presentation')
    expect(output).toContain('[verify] PASS')
    expect(status).toBe(0)
  }, 120_000)
})

/** Asserts a source-checkout file is byte-identical to before the disposable-copy run. */
function expectSourceUnchanged(relativePath: string, before: string) {
  expect(readFileSync(path.join(REPO_ROOT, relativePath), 'utf8')).toBe(before)
}

describe('E2E-002: verification failures are actionable', () => {
  it('fails the build phase on a type error, without mutating the source checkout', () => {
    const relativePath = 'src/presentations/how-to-make-a-presentation/steps/01-you-have-a-topic.tsx'
    const before = readFileSync(path.join(REPO_ROOT, relativePath), 'utf8')
    const appDir = makeDisposableCopy()
    const stepFile = path.join(appDir, relativePath)
    writeFileSync(stepFile, `${before}\nconst brokenTypeError: number = 'not a number'\n`)

    const { status, output } = runVerify(appDir)

    expect(status).not.toBe(0)
    expect(output.toLowerCase()).toMatch(/error|fail/)
    expectSourceUnchanged(relativePath, before)
  }, 120_000)

  it('fails when the committed reference sample is unregistered', () => {
    const relativePath = 'src/presentations/index.ts'
    const before = readFileSync(path.join(REPO_ROOT, relativePath), 'utf8')
    const appDir = makeDisposableCopy()
    const registryFile = path.join(appDir, relativePath)
    // Drop just the registered entry, keeping the `PresentationEntry[]`
    // typing intact so this fails on the missing-sample check rather than an
    // unrelated type error from an untyped empty array.
    writeFileSync(registryFile, before.replace(/\[\s*\{[\s\S]*\}\s*,?\s*\]/, '[]'))

    const { status, output } = runVerify(appDir)

    expect(status).not.toBe(0)
    expect(output).toContain('how-to-make-a-presentation')
    expect(output).toContain('is not registered')
    expectSourceUnchanged(relativePath, before)
  }, 120_000)

  it('fails and names the step when a step is reordered out of canonical order', () => {
    const relativePath = 'src/presentations/how-to-make-a-presentation/steps/index.ts'
    const before = readFileSync(path.join(REPO_ROOT, relativePath), 'utf8')
    const appDir = makeDisposableCopy()
    const stepsIndexFile = path.join(appDir, relativePath)
    // Swap the first two entries in the exported STEPS array so step 0 no
    // longer reports the canonical "You have a topic" caption.
    const swapped = before.replace(
      'youHaveATopic,\n  theSkillInterviewsYou,',
      'theSkillInterviewsYou,\n  youHaveATopic,',
    )
    expect(swapped).not.toBe(before)
    writeFileSync(stepsIndexFile, swapped)

    const { status, output } = runVerify(appDir)

    expect(status).not.toBe(0)
    expect(output).toContain('step 0')
    expectSourceUnchanged(relativePath, before)
  }, 120_000)

  it('fails on a console error emitted while stepping through the sample', () => {
    const relativePath = 'src/presentations/how-to-make-a-presentation/steps/scene.tsx'
    const before = readFileSync(path.join(REPO_ROOT, relativePath), 'utf8')
    const appDir = makeDisposableCopy()
    const sceneFile = path.join(appDir, relativePath)
    writeFileSync(
      sceneFile,
      before.replace(
        'export function Scene({ payload }: SceneProps<ScenePayload>) {',
        "export function Scene({ payload }: SceneProps<ScenePayload>) {\n  if (payload.showSkill) console.error('injected fault: E2E-002 console error')",
      ),
    )

    const { status, output } = runVerify(appDir)

    expect(status).not.toBe(0)
    expect(output.toLowerCase()).toContain('console error')
    expectSourceUnchanged(relativePath, before)
  }, 120_000)
})
