import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { command, stepCount, visitSteps, withBrowser } from './browser.mjs'

export const SAMPLE_SLUG = 'how-to-make-a-presentation'
// Independent normative metadata, not imported from the implementation under test.
export const EXPECTED = [
  {
    "era": "the ask",
    "title": "You have a topic",
    "caption": "It starts with you, a topic, and mild overconfidence."
  },
  {
    "era": "the ask",
    "title": "The skill interviews you",
    "caption": "One question at a time: the topic, the look, then each beat of the story."
  },
  {
    "era": "the gathering",
    "title": "Answers become steps",
    "caption": "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next."
  },
  {
    "era": "the gathering",
    "title": "The deck grows",
    "caption": "Same shapes, new beats. Every answer extends the story without redrawing it."
  },
  {
    "era": "the gathering",
    "title": "You set the depth",
    "caption": "Spell out every step, or sketch a few and see how it looks. You hold the gate."
  },
  {
    "era": "the build",
    "title": "It assembles the scene",
    "caption": "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph."
  },
  {
    "era": "the build",
    "title": "It checks its own work",
    "caption": "Before saying done, it builds and renders every step — and fixes what breaks."
  },
  {
    "era": "the loop",
    "title": "Changed your mind? Loop it.",
    "caption": "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch."
  },
  {
    "era": "the reveal",
    "title": "You're looking at one",
    "caption": "This presentation was built exactly this way. Thanks for watching."
  }
]
export function validateMetadata(actual) {
  if (actual.length !== EXPECTED.length) throw new Error('sample must have nine steps')
  EXPECTED.forEach((expected, i) => {
    for (const key of ['era', 'title', 'caption']) {
      if (actual[i][key] !== expected[key]) throw new Error(`sample step ${i}: incorrect ${key}`)
    }
  })
}
export async function verify({ cwd = process.cwd(), slug = SAMPLE_SLUG, build = true } = {}) {
  let phase = 'build'
  let activeStep = 0
  try {
    if (build) await command('npm', ['run', 'build'], cwd)
    phase = 'sample'
    const registry = await readFile(resolve(cwd, 'src/presentations/index.ts'), 'utf8')
    // Explicit registry contract; browser checks below prove reachability and metadata.
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error('invalid presentation slug')
    if (!new RegExp(`slug\\s*:\\s*['"]${slug}['"]`).test(registry)) throw new Error(`missing registered presentation ${slug}`)
    phase = 'render'
    await withBrowser(cwd, async (page, url) => {
      const errors = []
      page.on('console', message => { if (message.type() === 'error') errors.push(`step ${activeStep}: console.error: ${message.text()}`) })
      page.on('pageerror', error => errors.push(`step ${activeStep}: pageerror: ${error.message}`))
      await page.goto(`${url}/${slug}`)
      const { hook, count } = await stepCount(page)
      const metadata = []
      try { await visitSteps(page, count, hook, async index => {
        const title = await page.locator('[data-presentation-title]').textContent()
        // Narration remains available when present mode intentionally hides its paragraph.
        const caption = await hook.getAttribute('data-presentation-step-caption')
        const marker = await page.locator('[data-presentation-marker]').textContent()
        metadata.push({ title, caption, era: marker.split(' / ').slice(1).join(' / ') })
        if (errors.length) throw new Error(errors.join('\n'))
        console.log(`step ${index}: rendered (${await hook.getAttribute('data-presentation-mode')})`)
        activeStep = index + 1
      }) } catch (error) { throw new Error([...errors, error.message].join('\n'), { cause: error }) }
      if (slug === SAMPLE_SLUG) { phase = 'sample'; validateMetadata(metadata) }
      if (errors.length) throw new Error(errors.join('\n'))
    })
    console.log(`PASS verification: ${slug}`)
  } catch (error) {
    throw new Error(`FAIL ${phase}${phase === 'render' ? ` step ${activeStep}` : ''}: ${error.message}`, { cause: error })
  }
}
if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  verify({ slug: process.argv[2] ?? SAMPLE_SLUG }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
