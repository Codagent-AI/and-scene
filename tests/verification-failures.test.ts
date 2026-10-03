import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const canonical = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

async function runWithSample(steps: string) {
  const temp = await mkdtemp(path.join(tmpdir(), 'and-scene-verify-fault-'))
  await mkdir(path.join(temp, 'scripts'), { recursive: true })
  await mkdir(path.join(temp, 'src/presentations/how-to-make-a-presentation'), { recursive: true })
  await symlink(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir')
  await writeFile(path.join(temp, 'scripts/verify.mjs'), await readFile(path.join(root, 'scripts/verify.mjs')))
  await writeFile(path.join(temp, 'src/presentations/index.ts'), "export const presentations = [{ slug: 'how-to-make-a-presentation', load: () => import('./how-to-make-a-presentation/Talk') }]\n")
  await writeFile(path.join(temp, 'src/presentations/how-to-make-a-presentation/steps.ts'), steps)
  await writeFile(path.join(temp, 'src/presentations/how-to-make-a-presentation/Talk.tsx'), 'export default function Talk() { return null }\n')
  try {
    execFileSync(process.execPath, ['scripts/verify.mjs'], { cwd: temp, stdio: 'pipe' })
    return { code: 0, output: '' }
  } catch (error) {
    const failure = error as { status: number; stderr: Buffer }
    return { code: failure.status, output: failure.stderr.toString() }
  } finally { await rm(temp, { recursive: true, force: true }) }
}

describe('reference verification failure contract', () => {
  it('fails clearly when the committed sample is missing canonical content', async () => {
    const result = await runWithSample("export const STEPS = []\n")
    expect(result.code).toBe(1)
    expect(result.output).toContain('reference sample check: step 1 is missing canonical content')
  }, 30_000)

  it('fails clearly when the canonical steps are out of order', async () => {
    const reversed = [...canonical].reverse().map(([era, title, caption]) => `${era} ${title} ${caption}`).join('\n')
    const result = await runWithSample(reversed)
    expect(result.code).toBe(1)
    expect(result.output).toContain('reference sample check: step 1 is missing canonical content or is out of canonical order')
  }, 30_000)
})
