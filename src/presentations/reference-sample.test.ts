import { presentations } from './index'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { STEPS } from './how-to-make-a-presentation/steps'

const outline = [
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

test('registers the canonical nine-step reference sample', () => {
  const sample = presentations.find((presentation) => presentation.slug === 'how-to-make-a-presentation')

  expect(sample?.title).toBe('How to Use This Skill to Make a Presentation')
  expect(STEPS.map(({ era, title, caption }) => [era, title, caption])).toEqual(outline)
})

test('ships project-local production verification and visual inspection helpers', () => {
  const verifyPath = join(process.cwd(), 'scripts', 'verify.mjs')
  const inspectPath = join(process.cwd(), 'scripts', 'inspect-presentation.mjs')
  const warningsPath = join(process.cwd(), 'scripts', 'visual-warnings.mjs')

  expect(existsSync(verifyPath)).toBe(true)
  expect(existsSync(inspectPath)).toBe(true)
  expect(existsSync(warningsPath)).toBe(true)
  expect(readFileSync(verifyPath, 'utf8')).toContain('127.0.0.1')
  expect(readFileSync(verifyPath, 'utf8')).toContain('data-step-count')
  expect(readFileSync(verifyPath, 'utf8')).toContain('data-presentation-marker')
  expect(readFileSync(verifyPath, 'utf8')).toContain('data-presentation-title')
  expect(readFileSync(verifyPath, 'utf8')).toContain('data-presentation-caption')
  expect(readFileSync(verifyPath, 'utf8')).toContain('canonical metadata mismatch')
  expect(readFileSync(inspectPath, 'utf8')).toContain('collectVisualWarnings')
  expect(readFileSync(warningsPath, 'utf8')).toContain('data-presentation-allow-overlap')
})

test('aligns present-mode CSS with the kit stage geometry', () => {
  const css = readFileSync(join(process.cwd(), 'src', 'presentations', 'how-to-make-a-presentation', 'presentation.css'), 'utf8')

  expect(css).toContain("[data-presentation-mode='present'] [data-presentation-header] { height: 48px;")
  expect(css).toContain("[data-presentation-mode='present'] [data-presentation-stage] { height: calc(100vh - 104px);")
  expect(css).toContain("[data-presentation-mode='present'] [data-presentation-footer] { height: 56px;")
})
