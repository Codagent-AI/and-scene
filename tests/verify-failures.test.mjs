import { spawnSync } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
const repository = resolve(import.meta.dirname, '..')
async function isolatedCopy(name, mutate) {
  const directory = await mkdtemp(join(tmpdir(), `and-scene-${name}-`))
  await cp(repository, directory, { recursive: true, filter: (source) => !source.includes('/node_modules') && !source.includes('/dist') && !source.startsWith(join(repository, 'artifacts') + '/') && !source.includes('/.git/') })
  await symlink(join(repository, 'node_modules'), join(directory, 'node_modules'), 'dir')
  await mutate(directory)
  return directory
}
function run(directory, port) {
  return spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: directory, encoding: 'utf8', timeout: 120_000, env: { ...process.env, PREVIEW_PORT: String(port) } })
}
describe('production verification failure contract', () => {
  it('fails actionably for isolated build, sample, runtime, and transition faults', async () => {
    const cases = [
      ['build', async (dir) => { const p = join(dir, 'src/presentations/how-to-make-a-presentation/Talk.tsx'); await writeFile(p, `${await readFile(p, 'utf8')}\nexport const = ;\n`) }, /build failed/i],
      ['sample', async (dir) => { const p = join(dir, 'src/presentations/index.ts'); const s = await readFile(p, 'utf8'); await writeFile(p, s.replace(/\s*\{ slug: 'how-to-make-a-presentation',[^\n]*\n/, '')) }, /sample check failed.*not registered/i],
      ['caption order', async (dir) => { const p = join(dir, 'src/presentations/how-to-make-a-presentation/steps/index.tsx'); let s = await readFile(p, 'utf8'); const first = 'It starts with you, a topic, and mild overconfidence.'; const second = 'One question at a time: the topic, the look, then each beat of the story.'; s = s.replace(first, '__SWAPPED_CAPTION__').replace(second, first).replace('__SWAPPED_CAPTION__', second); await writeFile(p, s) }, /render check failed on step 1: expected canonical caption/i],
      ['runtime', async (dir) => { const p = join(dir, 'src/presentations/how-to-make-a-presentation/steps/index.tsx'); let s = await readFile(p, 'utf8'); s = s.replace('function Scene({ payload }: { payload: Payload }) {', "function Scene({ payload }: { payload: Payload }) { console.error('injected render fault');"); await writeFile(p, s) }, /render check failed on step 1.*injected render fault/i],
      ['transition', async (dir) => { const p = join(dir, 'src/presentation-kit/usePresentationNav.ts'); let s = await readFile(p, 'utf8'); s = s.replace('goTo(index + 1)', 'goTo(index)'); await writeFile(p, s) }, /render check failed on step 2: transition did not advance/i],
    ]
    const directories = []
    try {
      for (let index = 0; index < cases.length; index++) {
        const [name, mutate, expected] = cases[index]
        const directory = await isolatedCopy(name, mutate)
        directories.push(directory)
        const result = run(directory, 4281 + index)
        const output = `${result.stdout}\n${result.stderr}`
        expect(result.error, `${name}: verifier subprocess should complete`).toBeUndefined()
        expect(result.status, `${name}: ${output}`).not.toBe(0)
        expect(output, name).toMatch(expected)
        expect(output, name).toMatch(/FAIL:/)
      }
    } finally { await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true }))) }
  }, 240_000)
})
