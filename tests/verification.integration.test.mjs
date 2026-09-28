import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
async function isolatedCopy(edit) {
  const temporary = await mkdtemp(path.join(tmpdir(), 'and-scene-fault-'))
  const project = path.join(temporary, 'app')
  await cp(path.join(repo, 'src'), path.join(project, 'src'), { recursive: true })
  await cp(path.join(repo, 'scripts'), path.join(project, 'scripts'), { recursive: true })
  for (const file of ['package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json']) await cp(path.join(repo, file), path.join(project, file))
  await symlink(path.join(repo, 'node_modules'), path.join(project, 'node_modules'), 'dir')
  await edit(project)
  return { temporary, project }
}
function run(project, port) {
  return spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: project, encoding: 'utf8', timeout: 90_000, env: { ...process.env, PRESENTATION_PREVIEW_PORT: String(port) } })
}

test('verification rejects isolated build, canonical-sample, browser-error, and transition faults', { timeout: 300_000 }, async (t) => {
  const faults = [
    ['build failure', async (project) => { const file = path.join(project, 'src/presentations/how-to-make-a-presentation/Talk.tsx'); await writeFile(file, `${await readFile(file, 'utf8')}\nconst broken: number = 'not a number'\n`) }, /FAIL .*build|FAIL .*sample validation/],
    ['missing sample', async (project) => { await rm(path.join(project, 'src/presentations/how-to-make-a-presentation'), { recursive: true }) }, /FAIL .*sample validation/],
    ['browser console error', async (project) => { const file = path.join(project, 'src/presentations/how-to-make-a-presentation/Talk.tsx'); const text = await readFile(file, 'utf8'); await writeFile(file, text.replace('function Scene({ payload }', 'function Scene({ payload }').replace('  const n = payload.through', "  console.error('injected browser fault')\n  const n = payload.through")) }, /FAIL step 1:.*console: injected browser fault/],
    ['failed transition', async (project) => { const file = path.join(project, 'src/presentation-kit/usePresentationNav.ts'); const text = await readFile(file, 'utf8'); await writeFile(file, text.replace('const next = useCallback(() => setIndex((value) => Math.min(count - 1, value + 1)), [count])', 'const next = useCallback(() => setIndex((value) => value), [])')) }, /FAIL step 1:.*step transition did not advance to 2/],
  ]
  let port = 4200
  for (const [name, edit, expected] of faults) await t.test(name, async () => {
    const { temporary, project } = await isolatedCopy(edit)
    try {
      const result = run(project, port++)
      assert.notEqual(result.status, 0, `${name} unexpectedly passed`)
      assert.match(result.stdout + result.stderr, expected)
      assert.match(result.stdout + result.stderr, /FAIL /)
    } finally { await rm(temporary, { recursive: true, force: true }) }
  })
})
