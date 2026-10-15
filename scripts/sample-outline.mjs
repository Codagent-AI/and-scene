import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

export const referenceOutline = [
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

export async function validateSample(root, slug = 'how-to-make-a-presentation') {
  const fail = (message) => { throw new Error(`[sample] ${message}`) }
  const registryPath = path.join(root, 'src/presentations/index.ts')
  const sampleDir = path.join(root, 'src/presentations', slug)
  const registry = await readFile(registryPath, 'utf8').catch(() => fail('presentation registry missing'))
  await access(sampleDir).catch(() => fail(`sample directory missing: ${slug}`))
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`./${slug}/Talk`)) fail(`registry does not register ${slug}`)
  const outline = await readFile(path.join(sampleDir, 'steps/index.tsx'), 'utf8').catch(() => fail('sample outline missing'))
  let cursor = 0
  for (let index = 0; index < referenceOutline.length; index++) {
    for (const value of referenceOutline[index]) {
      const encoded = JSON.stringify(value).slice(1, -1)
      const at = outline.indexOf(encoded, cursor)
      if (at < 0) fail(`step ${index + 1} missing or out of order: ${value}`)
      cursor = at + encoded.length
    }
  }
}
