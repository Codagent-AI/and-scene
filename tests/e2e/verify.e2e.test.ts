import fs from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import reference from '../fixtures/reference-sample.json'
import { cleanupTmpDirs, copyRepo, edit, isListening, previewPorts, repoRoot, run } from '../integration/helpers.ts'

afterAll(cleanupTmpDirs)

describe('E2E-001: reference presentation passes production verification', () => {
  const result = run('npm', ['run', 'verify'], { cwd: repoRoot })

  it('exits zero with a clear pass after checking all nine steps', () => {
    expect(result.status, result.output).toBe(0)
    expect(result.output).toMatch(/VERIFY PASS: build, sample, render \(1 presentation\(s\), 9 step\(s\)\)/)
    expect(result.output).not.toMatch(/VERIFY FAIL/)
  })

  it('builds first, finds the sample registered, and matches the normative outline against independent expectations', () => {
    expect(JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/reference-sample.json'), 'utf8'))).toEqual(reference)
    const lines = result.output.split('\n')
    const at = (re: RegExp) => lines.findIndex((l) => re.test(l))
    expect(at(/build: ok/)).toBeGreaterThan(-1)
    expect(at(/sample: "how-to-make-a-presentation" is registered/)).toBeGreaterThan(at(/build: ok/))
    expect(at(/preview: vite preview/)).toBeGreaterThan(at(/sample: ".*" is registered/))
    expect(result.output).toContain('sample: 9 steps match the normative outline')
  })

  it('binds, probes and browses the preview on 127.0.0.1 only', () => {
    const ports = new Set(previewPorts(result.output))
    expect(ports.size).toBe(1)
    const [port] = [...ports]
    expect(result.output).toContain(`readiness probe GET http://127.0.0.1:${port}/`)
    expect(result.output).toContain(`render: http://127.0.0.1:${port}/how-to-make-a-presentation`)
    expect(result.output).not.toMatch(/localhost|\[::1\]/)
    for (const url of result.output.match(/https?:\/\/[^\s]+/g) ?? []) expect(url).toMatch(/^http:\/\/127\.0\.0\.1:/)
  })

  it('leaves no preview server listening after it returns', async () => {
    for (const port of previewPorts(result.output)) expect(await isListening(port)).toBe(false)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const sample = 'src/presentations/how-to-make-a-presentation'

  interface Fault {
    name: string
    apply: (dir: string) => void
    phase: string
    mention: RegExp
    previewStarted: boolean
  }

  const faults: Fault[] = [
    {
      name: 'a build-breaking edit',
      apply: (dir) => fs.appendFileSync(path.join(dir, sample, 'steps/step-2.tsx'), "\nexport const broken: number = 'not a number'\n"),
      phase: 'build',
      mention: /TS2322|not assignable|npm run build failed/,
      previewStarted: false,
    },
    {
      name: 'a sample missing from the registry',
      apply: (dir) => edit(path.join(dir, 'src/presentations/index.ts'), (s) => s.replace(/^.*slug: 'how-to-make-a-presentation'.*\n/m, '')),
      phase: 'sample',
      mention: /"how-to-make-a-presentation" is not registered/,
      previewStarted: false,
    },
    {
      name: 'out-of-order sample steps',
      apply: (dir) => edit(path.join(dir, sample, 'steps/index.ts'), (s) => s.replace('step2, step3', 'step3, step2')),
      phase: 'sample',
      mention: /step 2 (era|title|caption) is/,
      previewStarted: true,
    },
    {
      name: 'a step that emits a browser error',
      apply: (dir) => edit(path.join(dir, sample, 'SampleScene.tsx'), (s) => s.replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {', "export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  if (payload.step === 4) console.error('injected step failure')")),
      phase: 'render',
      mention: /at step 4 \(index 3\).*console\.error: injected step failure/,
      previewStarted: true,
    },
    {
      name: 'a scene that throws while rendering',
      apply: (dir) => edit(path.join(dir, sample, 'SampleScene.tsx'), (s) => s.replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {', "export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  if (payload.step === 4) throw new Error('injected render exception')")),
      phase: 'render',
      mention: /at step 4 \(index 3\).*injected render exception/,
      previewStarted: true,
    },
    {
      name: 'a transition that does not advance the step index',
      apply: (dir) => edit(path.join(dir, 'src/presentation-kit/usePresentationNav.ts'), (s) => s.replace('setIndex((i) => clamp(i + 1, countRef.current))', 'setIndex((i) => (i === 4 ? i : clamp(i + 1, countRef.current)))')),
      phase: 'render',
      mention: /at step 6 \(index 5\).*transition did not advance: step index stayed at 4/,
      previewStarted: true,
    },
  ]

  it.each(faults)('fails non-zero, names the phase and step, and cleans up for $name', async (fault) => {
    const dir = copyRepo('verify-fault')
    fault.apply(dir)
    const result = run('npm', ['run', 'verify'], { cwd: dir })
    expect(result.status, result.output).not.toBe(0)
    expect(result.output).toContain(`VERIFY FAIL [${fault.phase}]`)
    expect(result.output).toMatch(fault.mention)
    expect(result.output).not.toMatch(/VERIFY PASS/)
    const ports = previewPorts(result.output)
    expect(ports.length > 0).toBe(fault.previewStarted)
    for (const port of ports) expect(await isListening(port)).toBe(false)
  })
})
