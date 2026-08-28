// @vitest-environment node
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, test } from 'vitest'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const temporaryDirectories: string[] = []
const excludedRoots = new Set(['.git', 'artifacts', 'dist', 'node_modules', 'validator_logs'])

async function makeFaultCopy() {
  const target = await mkdtemp(join(tmpdir(), 'and-scene-e2e-'))
  temporaryDirectories.push(target)
  await cp(repositoryRoot, target, {
    recursive: true,
    filter: (source) => {
      const path = relative(repositoryRoot, source)
      return !path || !excludedRoots.has(path.split(/[\\/]/, 1)[0] || '')
    },
  })
  await symlink(join(repositoryRoot, 'node_modules'), join(target, 'node_modules'), 'dir')
  return target
}

async function replaceInFile(path: string, expected: string, replacement: string) {
  const source = await readFile(path, 'utf8')
  expect(source, `fault target missing from ${basename(path)}`).toContain(expected)
  await writeFile(path, source.replace(expected, replacement))
}

function runVerification(target: string) {
  const result = spawnSync('npm', ['run', 'verify'], {
    cwd: target,
    encoding: 'utf8',
    timeout: 120_000,
  })
  return { ...result, output: `${result.stdout}\n${result.stderr}` }
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

describe('E2E-002 actionable verification failures', () => {
  test('reports a build-breaking fault as a non-zero build-phase failure', async () => {
    const target = await makeFaultCopy()
    const talk = join(target, 'src', 'presentations', 'how-to-make-a-presentation', 'Talk.tsx')
    await writeFile(talk, `${await readFile(talk, 'utf8')}\nconst injectedTypeError: string = 42\n`)

    const result = runVerification(target)

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('verify: FAIL — build phase failed')
  }, 120_000)

  test('reports an out-of-order reference sample at the offending rendered step', async () => {
    const target = await makeFaultCopy()
    const stepsPath = join(target, 'src', 'presentations', 'how-to-make-a-presentation', 'steps', 'index.tsx')
    const source = await readFile(stepsPath, 'utf8')
    const lines = source.split('\n')
    const first = lines.findIndex((line) => line.includes("id: 'topic'"))
    const second = lines.findIndex((line) => line.includes("id: 'interview'"))
    expect(first).toBeGreaterThanOrEqual(0)
    expect(second).toBeGreaterThan(first)
    ;[lines[first], lines[second]] = [lines[second]!, lines[first]!]
    await writeFile(stepsPath, lines.join('\n'))

    const result = runVerification(target)

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('verify: FAIL — render phase failed at step 1')
    expect(result.output).toContain('expected title "You have a topic"')
  }, 120_000)

  test('reports a browser console fault at the offending step', async () => {
    const target = await makeFaultCopy()
    const stepsPath = join(target, 'src', 'presentations', 'how-to-make-a-presentation', 'steps', 'index.tsx')
    await replaceInFile(
      stepsPath,
      'function SkillScene({ payload }: SceneProps<ScenePayload>) {\n  return (',
      "function SkillScene({ payload }: SceneProps<ScenePayload>) {\n  console.error('injected browser fault')\n  return (",
    )

    const result = runVerification(target)

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('verify: FAIL — render phase failed at step 1: console error: injected browser fault')
  }, 120_000)

  test('reports a stalled public step transition and cleans up the preview', async () => {
    const target = await makeFaultCopy()
    const navigation = join(target, 'src', 'presentation-kit', 'usePresentationNav.ts')
    await replaceInFile(
      navigation,
      'const next = useCallback(() => setStepIndex((current) => clampStep(current + 1, stepCount)), [stepCount])',
      'const next = useCallback(() => {}, [])',
    )

    const result = runVerification(target)

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('verify: FAIL — render phase failed at step 2: public step index did not advance')
  }, 120_000)
})
