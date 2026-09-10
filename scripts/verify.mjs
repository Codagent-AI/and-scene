import { spawn } from 'node:child_process'
import { withPresentationPage } from './lib/presentation-page.mjs'

const port = 4173
const referenceSlug = 'how-to-make-a-presentation'
const requireReference = process.argv.includes('--require-reference-sample') || process.env.AND_SCENE_REQUIRE_REFERENCE_SAMPLE === '1'
const requestedSlug = process.argv.slice(2).find((argument) => argument !== '--require-reference-sample')?.replace(/^\/+|\/+$/g, '')
const canonicalOutline = [
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

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

async function assertReferenceStep(page, index) {
  const [era, title, caption] = canonicalOutline[index]
  const rendered = [
    await page.locator('[data-presentation-toc] [aria-current="step"]').textContent(),
    await page.locator('[data-presentation-progress] [aria-current="step"]').getAttribute('aria-label'),
    await page.locator('[data-presentation-caption]').textContent(),
  ]
  for (const [field, actual, expected] of [
    ['era', rendered[0], `Go to ${era}`],
    ['title', rendered[1], `Go to step ${index + 1}: ${title}`],
    ['caption', rendered[2], caption],
  ]) {
    if (actual !== expected) throw new Error(`reference sample failed at step ${index + 1}: ${field} expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
  }
}

function assertNoBrowserErrors(errors) {
  const error = errors[0]
  if (error) throw new Error(`render phase failed at step ${error.step}: ${error.message}`)
}

async function verifyRoute(slug) {
  const isReference = requireReference && slug === referenceSlug
  await withPresentationPage(port, slug, async (page, url) => {
    page.setDefaultTimeout(2500)
    let currentStep = 0
    const browserErrors = []
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push({ step: currentStep + 1, message: message.text() }) })
    page.on('pageerror', (error) => browserErrors.push({ step: currentStep + 1, message: error.message }))
    if (isReference) {
      await page.goto(new URL('/', url).href, { waitUntil: 'networkidle' })
      if (await page.locator(`a[href="/${referenceSlug}"]`).count() !== 1) throw new Error(`reference sample is not registered: ${referenceSlug}`)
    }
    await page.goto(url, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`render phase failed: route /${slug} did not expose a valid data-step-count`)
    if (isReference && count !== 9) throw new Error(`render phase failed: expected 9 reference steps, received ${count}`)
    if (isReference && await root.getAttribute('data-presentation-mode') === 'present') await page.keyboard.press('p')
    for (let index = 0; index < count; index += 1) {
      currentStep = index
      try {
        if (index > 0) await page.keyboard.press('ArrowRight')
        await page.waitForFunction((expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === expected, String(index), { timeout: 2500 })
      } catch (error) {
        throw new Error(`render phase failed at step ${index + 1}: ${browserErrors[0]?.message ?? error.message}`)
      }
      assertNoBrowserErrors(browserErrors)
      if (isReference) await assertReferenceStep(page, index)
    }
    assertNoBrowserErrors(browserErrors)
    console.log(`Render verification passed for /${slug} (${count} steps).`)
  })
}

async function main() {
  await run('npm', ['run', 'build'])
  const slugs = new Set()
  if (requireReference) slugs.add(referenceSlug)
  if (requestedSlug) slugs.add(requestedSlug)
  if (slugs.size === 0) throw new Error('Usage: npm run verify -- <presentation-slug>')
  for (const slug of slugs) await verifyRoute(slug)
}

main().then(() => console.log('Presentation verification passed.')).catch((error) => {
  console.error(`Presentation verification failed: ${error.message}`)
  process.exitCode = 1
})
