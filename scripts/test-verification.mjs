import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve('.')
const cases = [
  { name: 'build failure', expected: 'Build check failed', mutate: async app => writeFile(join(app, 'src/verification-fault.ts'), 'export const = ;\n') },
  { name: 'missing sample', expected: 'Sample check failed', mutate: async app => {
    const file = join(app, 'src/presentations/index.ts')
    const text = await readFile(file, 'utf8')
    await writeFile(file, text.replace(/\n\s*\{ slug: 'how-to-make-a-presentation'.*\n/, '\n'))
  } },
  { name: 'runtime browser error', expected: 'Browser error on /how-to-make-a-presentation at step 3', mutate: async app => {
    const file = join(app, 'src/presentations/how-to-make-a-presentation/steps/HowToScene.tsx')
    const text = await readFile(file, 'utf8')
    await writeFile(file, text.replace('const step = payload.through', "const step = payload.through\n  if (step === 3) throw new Error('injected browser failure')"))
  } },
  { name: 'other registered route runtime error', expected: 'Browser error on /secondary-fault at step 1', mutate: async app => {
    const folder = join(app, 'src/presentations/secondary-fault')
    await mkdir(folder, { recursive: true })
    await writeFile(join(folder, 'Talk.tsx'), "export default function Talk() { if (typeof window !== 'undefined') throw new Error('secondary route fault'); return null }\n")
    const registry = join(app, 'src/presentations/index.ts')
    const text = await readFile(registry, 'utf8')
    await writeFile(registry, text.replace('export const presentations: PresentationEntry[] = [', "export const presentations: PresentationEntry[] = [{ slug: 'secondary-fault', title: 'Secondary fault', load: () => import('./secondary-fault/Talk') },"))
  } },
  { name: 'stalled transition', expected: 'Step transition failed for /how-to-make-a-presentation at step 2', mutate: async app => {
    const file = join(app, 'src/presentation-kit/usePresentationNav.ts')
    const text = await readFile(file, 'utf8')
    await writeFile(file, text.replace('const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex])', 'const next = useCallback(() => {}, [])'))
  } },
]
const temp = await mkdtemp(join(tmpdir(), 'and-scene-e2e-faults-'))
try {
  for (let index = 0; index < cases.length; index++) {
    const fixture = cases[index]
    const app = join(temp, `${index}-${fixture.name.replaceAll(' ', '-')}`)
    await cp(join(root, 'src'), join(app, 'src'), { recursive: true })
    for (const file of ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) await cp(join(root, file), join(app, file))
    await cp(join(root, 'scripts/verify.mjs'), join(app, 'scripts-verify.mjs'))
    await symlink(join(root, 'node_modules'), join(app, 'node_modules'), 'dir')
    await fixture.mutate(app)
    const port = 4300 + index
    const result = spawnSync(process.execPath, [join(app, 'scripts-verify.mjs')], {
      cwd: app,
      env: { ...process.env, AND_SCENE_VERIFY_PORT: String(port) },
      encoding: 'utf8',
      timeout: 180_000,
    })
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    if (result.error) throw new Error(`${fixture.name}: verification process failed: ${result.error.message}`)
    if (result.status === 0) throw new Error(`${fixture.name}: faulty fixture unexpectedly passed\n${output}`)
    if (!output.includes(fixture.expected)) throw new Error(`${fixture.name}: expected actionable message “${fixture.expected}”\n${output}`)
    console.log(`E2E-002 ${fixture.name}: non-zero with actionable output`)
  }
  console.log('E2E-002 passed: all isolated verification faults failed cleanly.')
} catch (error) {
  console.error(`E2E-002 failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await rm(temp, { recursive: true, force: true })
}
