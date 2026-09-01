import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { startOwnedPreview, waitForPreviewResponse } from './preview-server.mjs'

const host = '127.0.0.1'
const port = Number(process.env.PRESENTATION_PORT ?? 4173)
const canonicalSlug = 'how-to-make-a-presentation'
const requestedSlug = process.argv[2]
const canonicalSteps = [
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
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`build phase failed: ${command} ${args.join(' ')}`)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function assertReferenceSample() {
  const [registry, steps] = await Promise.all([
    readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/presentations/how-to-make-a-presentation/steps.tsx', import.meta.url), 'utf8').catch(() => ''),
  ])
  if (!registry.includes(`slug: '${canonicalSlug}'`) || !registry.includes("import('./how-to-make-a-presentation/Talk')")) {
    throw new Error('reference sample phase failed: canonical presentation is not registered.')
  }
  let cursor = 0
  for (const [era, title, caption] of canonicalSteps) {
    const fragment = new RegExp(
      `era:\\s*['"]${escapeRegExp(era)}['"][\\s\\S]*?title:\\s*(['"])${escapeRegExp(title)}\\1[\\s\\S]*?caption:\\s*(['"])${escapeRegExp(caption)}\\2`,
    )
    const remaining = steps.slice(cursor)
    const match = fragment.exec(remaining)
    const position = match ? cursor + match.index : -1
    if (position < 0) throw new Error(`reference sample phase failed: missing or out-of-order canonical step “${title}”.`)
    cursor = position + match[0].length
  }
}

async function verify() {
  run('npm', ['run', 'build'])
  await assertReferenceSample()
  const slug = requestedSlug ?? canonicalSlug
  let preview
  let browser
  let failedStep = 0
  try {
    const url = `http://${host}:${port}/${slug}`
    preview = await startOwnedPreview({ host, port })
    await waitForPreviewResponse(url)
    const { chromium } = await import('playwright')
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(url, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-presentation-chrome="true"]')
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('render phase failed: presentation did not expose a valid step count.')
    for (let index = 0; index < count; index += 1) {
      failedStep = index + 1
      const observed = Number(await chrome.getAttribute('data-step-index'))
      if (observed !== index) throw new Error(`render phase failed at step ${failedStep}: expected index ${index}, received ${observed}.`)
      await page.waitForTimeout(600)
      if (errors.length) throw new Error(`render phase failed at step ${failedStep}: browser error: ${errors.join('; ')}`)
      if (index < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          ({ expected }) => document.querySelector('[data-presentation-chrome="true"]')?.getAttribute('data-step-index') === String(expected),
          { expected: index + 1 },
          { timeout: 2_000 },
        )
      }
    }
    if (errors.length) throw new Error(`render phase failed at step ${failedStep}: browser error: ${errors.join('; ')}`)
    console.log(`PASS: built and rendered ${slug} through ${count} steps on ${host}.`)
  } finally {
    await browser?.close()
    await preview?.close()
  }
}

verify().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
