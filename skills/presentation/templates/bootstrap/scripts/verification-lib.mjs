import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const sampleSlug = 'how-to-make-a-presentation'
export const expectedSteps = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]
export async function validateSample(root, slug = sampleSlug) {
  const registry = await readFile(path.join(root, 'src/presentations/index.ts'), 'utf8').catch(() => '')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`./${slug}/Talk`)) throw new Error(`sample registration: ${slug} is missing from src/presentations/index.ts`)
  const outlinePath = path.join(root, 'src/presentations', slug, 'steps/outline.mjs')
  const { outline } = await import(`${pathToFileURL(outlinePath).href}?t=${Date.now()}-${Math.random()}`).catch(() => { throw new Error(`sample registration: missing or malformed ${outlinePath}`) })
  if (!Array.isArray(outline) || outline.length !== expectedSteps.length) throw new Error(`sample registration: expected ${expectedSteps.length} sample steps`)
  expectedSteps.forEach((expected, i) => {
    const actual = outline[i]
    if (!actual || expected.some((value, j) => value !== [actual.era, actual.title, actual.caption][j])) throw new Error(`sample registration: step ${i + 1} title, caption, or era is missing or out of order`)
  })
  return outline.length
}
export async function validateRegistration(root, slug) {
  const registry = await readFile(path.join(root, 'src/presentations/index.ts'), 'utf8').catch(() => '')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`./${slug}/Talk`)) throw new Error(`presentation registration: ${slug} is missing from src/presentations/index.ts`)
}
export function parseArgs(args) {
  const result = { root: process.env.AND_SCENE_ROOT || process.cwd(), slug: process.env.AND_SCENE_SAMPLE_SLUG || sampleSlug, port: Number(process.env.AND_SCENE_PORT || 0), generic: process.env.AND_SCENE_GENERIC_VERIFY === '1' }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--root') result.root = path.resolve(args[++i])
    else if (arg === '--slug') result.slug = args[++i]
    else if (arg === '--port') result.port = Number(args[++i])
    else if (arg === '--generic') result.generic = true
    else throw new Error(`unknown argument: ${arg}`)
  }
  return result
}
