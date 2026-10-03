import assert from 'node:assert/strict'
import { readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { isolatedProject } from './helpers/isolated-project.mjs'

async function isolatedCopy(edit) {
  const copy = await isolatedProject('and-scene-fault-')
  await edit(copy.project)
  return copy
}
function run(project, port) {
  return spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: project, encoding: 'utf8', timeout: 90_000, env: { ...process.env, PRESENTATION_PREVIEW_PORT: String(port) } })
}

test('verification rejects isolated build, canonical-sample, browser-error, and transition faults', { timeout: 300_000 }, async (t) => {
  const faults = [
    ['build failure', async (project) => { const file = path.join(project, 'src/presentations/how-to-make-a-presentation/Talk.tsx'); await writeFile(file, `${await readFile(file, 'utf8')}\nconst broken: number = 'not a number'\n`) }, /FAIL .*build|FAIL .*sample validation/],
    ['missing sample', async (project) => { await rm(path.join(project, 'src/presentations/how-to-make-a-presentation'), { recursive: true }) }, /FAIL .*sample validation/],
    ['browser console error', async (project) => { const file = path.join(project, 'src/presentations/how-to-make-a-presentation/Talk.tsx'); const text = await readFile(file, 'utf8'); await writeFile(file, text.replace('  const n = payload.through', "  console.error('injected browser fault')\n  const n = payload.through")) }, /FAIL step 1:.*console: injected browser fault/],
    ['failed transition', async (project) => { const file = path.join(project, 'src/presentation-kit/usePresentationNav.ts'); const text = await readFile(file, 'utf8'); await writeFile(file, text.replace('const next = useCallback(() => setIndex((value) => Math.min(count - 1, value + 1)), [count])', 'const next = useCallback(() => setIndex((value) => value), [])')) }, /FAIL step 1:.*step transition did not advance to 2/],
  ]
  let port = 4200
  for (const [name, edit, expected] of faults) await t.test(name, async () => {
    const { temporary, project } = await isolatedCopy(edit)
    try {
      const result = run(project, port++)
      assert.notEqual(result.status, 0, `${name} unexpectedly passed`)
      assert.match(result.stdout + result.stderr, expected)
    } finally { await rm(temporary, { recursive: true, force: true }) }
  })
})
