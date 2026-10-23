import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyWithSharedModules, materializeBootstrap, removeDir, run } from '../integration/helpers'

/**
 * E2E-002: verification fails loudly and specifically. Each case is a disposable copy of the
 * application with one fault, and each copy must exit non-zero, name the failed phase (and the
 * step, for browser and transition faults), never print PASS, and leave no preview running.
 */
let base: string
const copies: string[] = []

beforeAll(() => {
  base = materializeBootstrap('e2e002-base-')
  const install = run('npm', ['ci', '--no-audit', '--no-fund'], base, 900_000)
  if (install.status !== 0) throw new Error(`npm ci failed:\n${install.output}`)
}, 1_000_000)

afterAll(() => {
  for (const dir of copies) removeDir(dir)
  if (base) removeDir(base)
})

/** A disposable copy with one edit applied to a file, relative to the copy root. */
function faulty(edit: (text: string) => string, file: string): string {
  const dir = copyWithSharedModules(base, join(base, 'node_modules'), 'e2e002-')
  copies.push(dir)
  const path = join(dir, file)
  writeFileSync(path, edit(readFileSync(path, 'utf8')))
  return dir
}

function replaceOnce(text: string, from: string, to: string): string {
  if (!text.includes(from)) throw new Error(`fault template not found: ${from}`)
  return text.replace(from, to)
}

async function previewStopped(output: string): Promise<boolean> {
  const match = output.match(/preview ready at (http:\/\/127\.0\.0\.1:\d+)/)
  if (!match) return true
  try {
    await fetch(match[1], { signal: AbortSignal.timeout(1000) })
    return false
  } catch {
    return true
  }
}

/** Asserts a failing verification names its phase (and step) and leaves no preview running. */
async function expectFailure(result: { status: number | null; output: string }, phase: string, step?: number) {
  expect(result.status, result.output).not.toBe(0)
  expect(result.output).toContain(`verify: FAIL (${phase})`)
  expect(result.output).not.toContain('verify: PASS')
  if (step !== undefined) expect(result.output).toMatch(new RegExp(`${phase}: step ${step}\\b`))
  expect(await previewStopped(result.output)).toBe(true)
}

describe('build failure', () => {
  it('a type error in a non-sample application file fails in the build phase', async () => {
    const dir = faulty((text) => `${text}\nexport const broken: number = 'x'\n`, 'src/Landing.tsx')
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'build')
    expect(await previewStopped(result.output)).toBe(true)
  }, 400_000)
})

describe('sample failures', () => {
  it('a missing or unregistered sample fails in the sample phase', async () => {
    const dir = faulty(
      () =>
        [
          "import type { ComponentType } from 'react'",
          '',
          'export interface PresentationEntry {',
          '  slug: string',
          '  title: string',
          '  load: () => Promise<{ default: ComponentType }>',
          '}',
          '',
          'export const presentations: PresentationEntry[] = []',
          '',
        ].join('\n'),
      'src/presentations/index.ts',
    )
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'sample')
  }, 400_000)

  it('two steps swapped out of order fail at the first step that differs', async () => {
    const dir = faulty(
      (text) => replaceOnce(text, 'step02, step03,', 'step03, step02,'),
      'src/presentations/how-to-make-a-presentation/steps/index.ts',
    )
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'sample', 1)
  }, 400_000)

  it('a changed normative title fails and names the step', async () => {
    const dir = faulty(
      (text) => replaceOnce(text, "title: 'Answers become steps'", "title: 'Answers become'"),
      'src/presentations/how-to-make-a-presentation/steps/03-answers-become-steps.tsx',
    )
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'sample', 2)
  }, 400_000)

  it('a changed normative caption fails and names the step', async () => {
    const dir = faulty(
      (text) => replaceOnce(text, 'One question at a time:', 'One question:'),
      'src/presentations/how-to-make-a-presentation/steps/02-the-skill-interviews-you.tsx',
    )
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'sample', 1)
  }, 400_000)
})

describe('browser and transition failures', () => {
  it('a console error on the first step fails the render phase at step 1', async () => {
    const dir = faulty(
      (text) =>
        replaceOnce(
          text,
          'export function Diagram({ payload }: SceneProps<DiagramState>) {',
          "export function Diagram({ payload }: SceneProps<DiagramState>) {\n  if (payload.visible.length === 2) console.error('fault')",
        ),
      'src/presentations/how-to-make-a-presentation/scene.tsx',
    )
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'render', 0)
  }, 400_000)

  it('a console error on the final step fails the render phase at step 9', async () => {
    const dir = faulty(
      (text) =>
        replaceOnce(
          text,
          'export function Diagram({ payload }: SceneProps<DiagramState>) {',
          "export function Diagram({ payload }: SceneProps<DiagramState>) {\n  if (payload.added.includes('reveal-frame')) console.error('fault')",
        ),
      'src/presentations/how-to-make-a-presentation/scene.tsx',
    )
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'render', 8)
  }, 400_000)

  it('a console error raised while entering step 4 fails the render phase at that step', async () => {
    const dir = faulty(
      (text) =>
        replaceOnce(
          text,
          'export function Diagram({ payload }: SceneProps<DiagramState>) {',
          "export function Diagram({ payload }: SceneProps<DiagramState>) {\n  if (payload.added.includes('card-2')) console.error('fault')",
        ),
      'src/presentations/how-to-make-a-presentation/scene.tsx',
    )
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'render', 3)
  }, 400_000)

  it('an uncaught page error raised while entering step 4 fails the render phase at that step', async () => {
    const dir = faulty(
      (text) =>
        replaceOnce(
          text,
          'export function Diagram({ payload }: SceneProps<DiagramState>) {',
          "export function Diagram({ payload }: SceneProps<DiagramState>) {\n  if (payload.added.includes('card-2')) throw new Error('fault')",
        ),
      'src/presentations/how-to-make-a-presentation/scene.tsx',
    )
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'render', 3)
  }, 400_000)

  it('a transition that does not advance the public step index fails the transition phase at the stuck step', async () => {
    const dir = faulty(
      (text) =>
        replaceOnce(
          text,
          'const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])',
          'const next = useCallback(() => setIndex((i) => (i === 3 ? i : clampIndex(i + 1, count))), [count])',
        ),
      'src/presentation-kit/usePresentationNav.ts',
    )
    const result = run('npm', ['run', 'verify'], dir, 300_000)
    await expectFailure(result, 'transition', 3)
  }, 400_000)
})

describe('process cleanup', () => {
  it('interrupting a running verification stops the preview and releases its port', async () => {
    const dir = copyWithSharedModules(base, join(base, 'node_modules'), 'e2e002-int-')
    copies.push(dir)
    const child = spawn('npm', ['run', 'verify'], { cwd: dir, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    await waitFor(() => output.includes('preview ready at'), 240_000)
    const exited = new Promise<number | null>((resolve) => child.on('exit', (code) => resolve(code)))
    process.kill(-child.pid!, 'SIGINT')
    const code = await exited
    expect([130, null]).toContain(code)
    expect(await previewStopped(output)).toBe(true)
  }, 400_000)
})

async function waitFor(predicate: () => boolean, timeout: number) {
  const deadline = Date.now() + timeout
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for condition')
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}
