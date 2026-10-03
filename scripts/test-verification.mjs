import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temp = await mkdtemp(path.join(os.tmpdir(), 'and-scene-verification-'))
const faults = [
  ['build', 'src/verify-build-fault.ts', () => "export const fault: number = 'not a number'\n", /build check failed/],
  ['sample', 'src/presentations/index.ts', source => source.replace("  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },", ''), /sample check failed/],
  ['console', 'src/presentations/how-to-make-a-presentation/steps/index.tsx', source => source.replace('return <SceneLayer className="sample-scene">', 'console.error("injected browser fault"); return <SceneLayer className="sample-scene">'), /step 1.*injected browser fault/s],
  ['transition', 'src/presentation-kit/Presentation.tsx', source => source.replace('data-step-index={index}', 'data-step-index={0}'), /step 2.*Timeout|step 2.*timeout/s],
]
try {
  for (const [name, relative, inject, expected] of faults) {
    const project = path.join(temp, name)
    await mkdir(project)
    await cp(root, project, { recursive: true, filter: (source) => {
      const copied = path.relative(root, source)
      return !['node_modules', '.git', 'dist', 'artifacts'].some((excluded) => copied === excluded || copied.startsWith(`${excluded}${path.sep}`))
    } })
    await symlink(path.join(root, 'node_modules'), path.join(project, 'node_modules'), 'dir')
    const file = path.join(project, relative)
    const source = await readFile(file, 'utf8').catch(() => '')
    const changed = inject(source)
    assert.notEqual(changed, source, `${name} injection did not change ${relative}`)
    await writeFile(file, changed)
    const result = spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: project, encoding: 'utf8', timeout: 120000 })
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    assert.notEqual(result.status, 0, `${name} fault unexpectedly passed verification`)
    assert.match(output, expected, `${name} failure was not identified usefully:\n${output}`)
    assert.doesNotMatch(output, /PASS: build, canonical sample/, `${name} fault also reported success`)
    console.log(`PASS: isolated ${name} fault fails with actionable output`)
  }
} finally {
  await rm(temp, { recursive: true, force: true })
}
