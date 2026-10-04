import { cp, mkdir, mkdtemp, readFile, rm, writeFile, symlink } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const temp = await mkdtemp(path.join(os.tmpdir(), 'and-scene-verification-'))
const files = ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'src', 'scripts', 'node_modules']
const copyCase = async (name) => {
  const directory = path.join(temp, name)
  await mkdir(directory)
  for (const entry of files) {
    if (entry === 'node_modules') await symlink(path.join(root, entry), path.join(directory, entry), 'dir')
    else await cp(path.join(root, entry), path.join(directory, entry), { recursive: true })
  }
  return directory
}
const runCase = (name, mutate, expected) => {
  return (async () => {
    const directory = await copyCase(name)
    await mutate(directory)
    const result = spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: directory, encoding: 'utf8', timeout: 120_000 })
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    if (result.status === 0) throw new Error(`${name}: verification unexpectedly passed\n${output}`)
    if (!expected.test(output)) throw new Error(`${name}: failure was not actionable (exit ${result.status})\n${output}`)
  })()
}
const update = async (directory, relative, transform) => {
  const file = path.join(directory, relative)
  await writeFile(file, transform(await readFile(file, 'utf8')))
}

try {
  await runCase('build-failure', (directory) => update(directory, 'src/presentations/how-to-make-a-presentation/steps.tsx', (text) => `${text}\nconst broken: = true\n`), /FAIL during build and sample contract: .*build.*exited/si)
  await runCase('sample-order', (directory) => update(directory, 'src/presentations/how-to-make-a-presentation/steps.tsx', (text) => text.replace('You have a topic', 'Topic missing')), /Sample contract failed: missing or out-of-order step/)
  await runCase('browser-error', (directory) => update(directory, 'src/presentations/how-to-make-a-presentation/Scene.tsx', (text) => text.replace('return <div className="sample-scene">', 'if (index === 2) throw new Error("injected browser fault")\n  return <div className="sample-scene">')), /FAIL during step 3\/9: \[step 3\/9\] (?:console error|page error): .*injected browser fault/s)
  await runCase('transition-failure', (directory) => update(directory, 'src/presentation-kit/usePresentationNav.ts', (text) => text.replace('const next = useCallback(() => goTo(index + 1), [goTo, index])', 'const next = useCallback(() => undefined, [])')), /FAIL during step 2\/9: .*Timeout/si)
  console.log('PASS: isolated build, sample-contract, browser-error, and transition faults fail with actionable reports')
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await rm(temp, { recursive: true, force: true })
}
