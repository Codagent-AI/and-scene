import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REPO, copyRepo, isListening, remove, run, tempDir, type RunResult } from '../support/sandbox'

const verify = (cwd: string) => run('npm', ['run', 'verify'], cwd)
const origin = (r: RunResult) => /preview (http:\/\/127\.0\.0\.1:\d+)/.exec(r.stdout)?.[1]

async function edit(file: string, change: (s: string) => string) {
  await writeFile(file, change(await readFile(file, 'utf8')))
}

describe('E2E-001: reference presentation passes production verification', () => {
  let result: RunResult
  beforeAll(async () => {
    result = await verify(REPO)
  })

  it('exits zero with a clear pass', () => {
    expect(result.stderr).not.toMatch(/FAIL/)
    expect(result.stdout).toContain('PASS verify: build, sample, render')
    expect(result.code).toBe(0)
  })

  it('runs every phase in order and registers the sample', () => {
    const phases = [...result.stdout.matchAll(/^\[(\w+)\]/gm)].map((m) => m[1])
    expect(phases.indexOf('build')).toBeLessThan(phases.indexOf('sample'))
    expect(phases.indexOf('sample')).toBeLessThan(phases.indexOf('render'))
    expect(result.stdout).toContain('[sample] how-to-make-a-presentation registered')
  })

  it('serves, probes and browses the sample on 127.0.0.1 and steps through all nine steps', () => {
    const url = /\[render\] (http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation) 9 steps ok/.exec(result.stdout)?.[1]
    expect(url).toBeTruthy()
    expect(new URL(url!).hostname).toBe('127.0.0.1')
    expect(origin(result)).toBeTruthy()
    expect(result.stdout).not.toMatch(/localhost/)
  })

  it('leaves no preview server behind', async () => {
    expect(await isListening(origin(result)!)).toBe(false)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const dirs: string[] = []
  afterAll(() => Promise.all(dirs.map(remove)))

  async function faulty(name: string, fault: (dir: string) => Promise<void>) {
    const dir = await tempDir(`verify-${name}`)
    dirs.push(dir)
    await copyRepo(dir)
    await fault(dir)
    return { dir, result: await verify(dir) }
  }
  const sample = (dir: string, f: string) => path.join(dir, 'src/presentations/how-to-make-a-presentation', f)

  const cases: {
    name: string
    fault: (dir: string) => Promise<void>
    expected: RegExp
    previewStarted: boolean
  }[] = [
    {
      name: 'build',
      // A type error in the registry, not in the sample: a sample-only build would miss it.
      fault: (dir) => edit(path.join(dir, 'src/presentations/index.ts'), (s) => `${s}\nexport const broken: number = 'not a number'\n`),
      expected: /FAIL verify \[build\]/,
      previewStarted: false,
    },
    {
      name: 'missing-sample',
      fault: (dir) => edit(path.join(dir, 'src/presentations/index.ts'), (s) => s.replace(/= \[[\s\S]*\n\]/, '= []')),
      expected: /FAIL verify \[sample\].*how-to-make-a-presentation.*not registered/,
      previewStarted: false,
    },
    {
      name: 'malformed-config',
      fault: (dir) => writeFile(path.join(dir, 'verify.config.json'), '{ not json'),
      expected: /FAIL verify \[sample\].*verify\.config\.json/,
      previewStarted: false,
    },
    {
      name: 'out-of-order',
      fault: (dir) =>
        edit(sample(dir, 'steps/narration.ts'), (s) => {
          const lines = s.split('\n')
          const a = lines.findIndex((l) => l.includes("id: 'interview'"))
          ;[lines[a], lines[a + 1]] = [lines[a + 1], lines[a]]
          return lines.join('\n')
        }),
      expected: /FAIL verify \[render\] \(step 2\).*step 2 era|FAIL verify \[render\] \(step 2\).*step 2 title/,
      previewStarted: true,
    },
    {
      name: 'console-error',
      fault: (dir) =>
        edit(sample(dir, 'steps/Scene.tsx'), (s) =>
          s
            .replace("import {", "import { useEffect } from 'react'\nimport {")
            .replace('  return (\n    <SceneLayer>', "  useEffect(() => {\n    if (payload.step === 5) console.error('injected console failure')\n  }, [payload.step])\n  return (\n    <SceneLayer>"),
        ),
      expected: /FAIL verify \[render\] \(step 5\).*injected console failure/,
      previewStarted: true,
    },
    {
      name: 'page-error',
      fault: (dir) =>
        edit(sample(dir, 'steps/Scene.tsx'), (s) =>
          s
            .replace("import {", "import { useEffect } from 'react'\nimport {")
            .replace('  return (\n    <SceneLayer>', "  useEffect(() => {\n    if (payload.step === 7) setTimeout(() => { throw new Error('injected uncaught failure') }, 30)\n  }, [payload.step])\n  return (\n    <SceneLayer>"),
        ),
      expected: /FAIL verify \[render\] \(step 7\).*injected uncaught failure/,
      previewStarted: true,
    },
    {
      name: 'stalled-transition',
      fault: (dir) =>
        edit(path.join(dir, 'src/presentation-kit/usePresentationNav.ts'), (s) =>
          s.replace('setIndex((i) => Math.min(last, i + 1))', 'setIndex((i) => Math.min(last, 3, i + 1))'),
        ),
      expected: /FAIL verify \[render\] \(step 5\).*transition failed/,
      previewStarted: true,
    },
  ]

  it.each(cases)('$name fault exits non-zero naming the failed phase', async ({ name, fault, expected, previewStarted }) => {
    const { result } = await faulty(name, fault)
    expect(result.code).not.toBe(0)
    expect(result.stdout + result.stderr).not.toContain('PASS verify')
    expect(result.stderr).toMatch(expected)
    if (previewStarted) {
      const url = origin(result)
      expect(url, 'preview should have started for a render fault').toBeTruthy()
      expect(await isListening(url!)).toBe(false)
    } else {
      expect(origin(result)).toBeUndefined()
    }
  })
})
