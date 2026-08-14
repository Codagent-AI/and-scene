import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const baseUrl = `http://${host}:${port}`
const slug = 'how-to-make-a-presentation'
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

function assertReferenceSample() {
  const registryPath = 'src/presentations/index.ts'
  const stepsPath = `src/presentations/${slug}/steps.tsx`
  const talkPath = `src/presentations/${slug}/Talk.tsx`
  if (![registryPath, stepsPath, talkPath].every(existsSync)) throw new Error('reference sample files are missing')

  const registry = readFileSync(registryPath, 'utf8')
  const steps = readFileSync(stepsPath, 'utf8')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`./${slug}/Talk`)) throw new Error('reference sample is not registered')
  let previousTitle = -1
  for (const [era, title, caption] of canonicalOutline) {
    if (!steps.includes(era) || !steps.includes(title) || !steps.includes(caption)) {
      throw new Error(`reference sample is missing its canonical step: ${title}`)
    }
    const titlePosition = steps.indexOf(title)
    if (titlePosition <= previousTitle) throw new Error(`reference sample is not in canonical order at: ${title}`)
    previousTitle = titlePosition
  }
}

function runBuild() {
  console.log('VERIFY: building application')
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit' })
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) return } catch { /* preview is starting */ }
    await delay(100)
  }
  throw new Error(`preview did not become ready at ${baseUrl}`)
}

async function waitForStep(root, expectedIndex) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (Number(await root.getAttribute('data-step-index')) === expectedIndex) return
    await delay(50)
  }
  throw new Error(`step ${expectedIndex} did not become active`)
}

async function verify() {
  assertReferenceSample()
  runBuild()
  const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  let browser
  let activeStep = 0
  const errors = []

  try {
    await waitForPreview()
    browser = await chromium.launch()
    const page = await browser.newPage()
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${activeStep}: console error: ${message.text()}`) })
    page.on('pageerror', (error) => errors.push(`step ${activeStep}: page error: ${error.message}`))
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    const count = Number(await root.getAttribute('data-step-count'))
    if (count !== canonicalOutline.length) throw new Error(`reference sample exposed ${count} steps, expected ${canonicalOutline.length}`)

    for (activeStep = 0; activeStep < count; activeStep += 1) {
      await waitForStep(root, activeStep)
      await page.waitForTimeout(600)
      if (errors.length) throw new Error(errors[0])
      if (activeStep < count - 1) await page.keyboard.press('ArrowRight')
    }
    console.log(`VERIFY PASSED: built and rendered ${count} reference-sample steps at /${slug}`)
  } finally {
    await browser?.close()
    if (!server.killed) server.kill('SIGTERM')
    await once(server, 'exit').catch(() => undefined)
  }
}

verify().catch((error) => {
  console.error(`VERIFY FAILED: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
