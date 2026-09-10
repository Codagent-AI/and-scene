import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const referenceSlug = 'how-to-make-a-presentation'
const requestedSlug = process.argv[2]?.replace(/^\/+|\/+$/g, '')
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

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is starting */ }
    await delay(125)
  }
  throw new Error(`preview readiness failed at ${url}`)
}

async function assertReferenceSample() {
  if (process.env.AND_SCENE_REQUIRE_REFERENCE_SAMPLE !== '1') return
  const [registry, steps] = await Promise.all([
    readFile('src/presentations/index.ts', 'utf8'),
    readFile(`src/presentations/${referenceSlug}/steps/index.tsx`, 'utf8'),
  ])
  if (!registry.includes(`slug: '${referenceSlug}'`)) throw new Error(`reference sample is not registered: ${referenceSlug}`)
  const hasValue = (value) => steps.includes(`'${value}'`) || steps.includes(`"${value}"`)
  let previous = -1
  for (const [era, title, caption] of canonicalOutline) {
    const position = Math.max(steps.indexOf(`'${title}'`), steps.indexOf(`"${title}"`))
    if (position < 0 || !hasValue(era) || !hasValue(caption)) throw new Error(`reference sample is malformed near “${title}”`)
    if (position <= previous) throw new Error(`reference sample is out of order near “${title}”`)
    previous = position
  }
}

async function verifyRoute(slug) {
  const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  const previewExited = once(preview, 'exit')
  try {
    const url = `http://${host}:${port}/${slug}`
    await waitForPreview(url)
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      let currentStep = 0
      const browserErrors = []
      page.on('console', (message) => { if (message.type() === 'error') browserErrors.push({ step: currentStep + 1, message: message.text() }) })
      page.on('pageerror', (error) => browserErrors.push({ step: currentStep + 1, message: error.message }))
      await page.goto(url, { waitUntil: 'networkidle' })
      const root = page.locator('[data-presentation-root]')
      const count = Number(await root.getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error(`render phase failed: route /${slug} did not expose a valid data-step-count`)
      if (slug === referenceSlug && process.env.AND_SCENE_REQUIRE_REFERENCE_SAMPLE === '1' && count !== 9) throw new Error(`render phase failed: expected 9 reference steps, received ${count}`)
      for (let index = 0; index < count; index += 1) {
        currentStep = index
        await page.waitForFunction((expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === expected, String(index), { timeout: 2500 })
        if (browserErrors.length) {
          const error = browserErrors[0]
          throw new Error(`render phase failed at step ${error.step}: ${error.message}`)
        }
        if (index + 1 < count) {
          await page.keyboard.press('ArrowRight')
          await page.waitForFunction((expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === expected, String(index + 1), { timeout: 2500 })
        }
      }
      if (browserErrors.length) {
        const error = browserErrors[0]
        throw new Error(`render phase failed at step ${error.step}: ${error.message}`)
      }
      console.log(`Render verification passed for /${slug} (${count} steps).`)
    } finally {
      await browser.close()
    }
  } finally {
    if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')
    await previewExited.catch(() => undefined)
  }
}

async function main() {
  await assertReferenceSample()
  await run('npm', ['run', 'build'])
  await verifyRoute(requestedSlug || referenceSlug)
}

main().then(() => console.log('Presentation verification passed.')).catch((error) => {
  console.error(`Presentation verification failed: ${error.message}`)
  process.exitCode = 1
})
