import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, rm, writeFile, unlink, symlink } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cases = [
  { name: 'build', port: 4301, mutate: async copy => writeFile(path.join(copy, 'src/broken.ts'), 'export const broken: string = 42'), expected: /build check failed/ },
  { name: 'missing sample', port: 4302, mutate: async copy => unlink(path.join(copy, 'src/presentations/how-to-make-a-presentation/steps.tsx')), expected: /sample check failed: missing/ },
  { name: 'malformed sample', port: 4303, mutate: async copy => {
    const file = path.join(copy, 'src/presentations/how-to-make-a-presentation/steps.tsx')
    const source = await readFile(file, 'utf8')
    await writeFile(file, source.replace("title: 'You have a topic'", "title: 'Wrong first title'"))
  }, expected: /sample check failed: expected canonical nine titles and captions/ },
  { name: 'browser console', port: 4304, mutate: async copy => {
    const file = path.join(copy, 'src/presentations/how-to-make-a-presentation/steps.tsx')
    const source = await readFile(file, 'utf8')
    await writeFile(file, source.replace('function Scene({ payload }: { payload: Payload }) {', "function Scene({ payload }: { payload: Payload }) {\n  if (payload.cards === 0 && !payload.skill) console.error('fixture browser failure')"))
  }, expected: /Verification failed at step 1 \(You have a topic\): render check failed at step 1 .*console error: fixture browser failure/ },
  { name: 'late browser console', port: 4306, mutate: async copy => {
    const file = path.join(copy, 'src/presentations/how-to-make-a-presentation/steps.tsx')
    const source = await readFile(file, 'utf8')
    await writeFile(file, source.replace('function Scene({ payload }: { payload: Payload }) {', "function Scene({ payload }: { payload: Payload }) {\n  if (payload.reveal) setTimeout(() => console.error('late fixture browser failure'), 100)"))
  }, expected: /render check failed at step 9 \(You’re looking at one\): console error: late fixture browser failure/ },
  { name: 'stalled transition', port: 4305, mutate: async copy => {
    const file = path.join(copy, 'src/presentation-kit/usePresentationNav.ts')
    const source = await readFile(file, 'utf8')
    await writeFile(file, source.replace('const next = useCallback(() => goTo(stepIndex + 1), [goTo, stepIndex])', 'const next = useCallback(() => {}, [goTo, stepIndex])'))
  }, expected: /render check failed at step 2 \(The skill interviews you\): ArrowRight did not advance/ },
]

async function runCase(test) {
  const copy = await mkdtemp(path.join(tmpdir(), `and-scene-${test.name.replace(/\s/g, '-')}-`))
  try {
    await cp(root, copy, { recursive: true, filter: source => !/(^|\/)(node_modules|\.git|dist|artifacts|validator_logs)(\/|$)/.test(path.relative(root, source)) })
    await symlink(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), 'dir')
    await test.mutate(copy)
    const result = spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: copy, env: { ...process.env, PORT: String(test.port) }, encoding: 'utf8', timeout: 60000 })
    const output = `${result.stdout}\n${result.stderr}`
    assert.notEqual(result.status, 0, `${test.name} fault unexpectedly passed`)
    assert.match(output, test.expected, `${test.name} failure was not actionable:\n${output}`)
    assert.doesNotMatch(output, /Verification passed:/)
    console.log(`E2E-002 ${test.name}: non-zero, actionable failure confirmed.`)
  } finally {
    await rm(copy, { recursive: true, force: true })
  }
}

for (const test of cases) await runCase(test)
console.log('E2E-002 passed: isolated build, sample, browser-console, and transition faults fail clearly.')
