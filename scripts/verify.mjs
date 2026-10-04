import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const referenceSlug = 'how-to-make-a-presentation'
const slug = process.argv[2] ?? referenceSlug
const title = 'How to Use This Skill to Make a Presentation'
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run verify -- <presentation-slug>')
  process.exit(2)
}
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
]

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)))
  })
}
function reservePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') return reject(new Error('Could not reserve an IPv4 preview port'))
      server.close((error) => error ? reject(error) : resolve(address.port))
    })
  })
}

let preview
let browser
let activeStep = 'build and sample contract'
try {
  await run('npm', ['run', 'build'])
  const [registry, talk] = await Promise.all([
    readFile('src/presentations/index.ts', 'utf8'),
    readFile(`src/presentations/${slug}/Talk.tsx`, 'utf8'),
  ])
  const source = await readFile(`src/presentations/${slug}/steps.tsx`, 'utf8').catch(() => '')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`import('./${slug}/Talk')`) || (slug === referenceSlug && !registry.includes(title))) throw new Error(`Sample contract failed: ${slug} is not registered with the expected title`)
  if (slug === referenceSlug && !talk.includes('<Presentation steps={STEPS}')) throw new Error('Sample contract failed: presentation entry does not render STEPS')
  if (slug === referenceSlug) {
    if (!source) throw new Error('Sample contract failed: reference steps file is missing')
    let previous = -1
    for (const [era, stepTitle, caption] of outline) {
      const eraIndex = source.indexOf(era, previous + 1)
      const titleIndex = source.indexOf(stepTitle, eraIndex + 1)
      const captionIndex = source.indexOf(caption, titleIndex + 1)
      if (eraIndex < 0 || titleIndex < 0 || captionIndex < 0) throw new Error(`Sample contract failed: missing or out-of-order step “${stepTitle}” (${era})`)
      previous = captionIndex
    }
  }

  const port = await reservePort()
  const url = `http://127.0.0.1:${port}`
  let startupOutput = ''
  let startupError
  preview = spawn(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'ignore', 'pipe'] })
  preview.on('error', (error) => { startupError = error })
  preview.stderr.setEncoding('utf8').on('data', (chunk) => { startupOutput += chunk })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (startupError || preview.exitCode !== null) throw new Error(`Preview startup failed: ${startupError?.message ?? startupOutput}`)
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`Preview readiness check failed at ${url}: ${startupOutput}`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`[${activeStep}] console error: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`[${activeStep}] page error: ${error.message}`))
  await page.goto(`${url}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-step-count]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`Render check failed: route /${slug} exposed invalid data-step-count ${count}`)
  if (slug === referenceSlug && count !== outline.length) throw new Error(`Render check failed: expected ${outline.length} steps, found ${count}`)
  const waitForIndex = async (expected) => {
    try {
      await page.waitForFunction((value) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === value, expected, { timeout: 5000 })
    } catch (error) {
      if (errors.length) throw new Error(errors.join('\n'))
      throw new Error(`failed to reach ${activeStep}: ${error.message}`)
    }
  }
  for (let index = 0; index < count; index++) {
    activeStep = `step ${index + 1}/${count}`
    await waitForIndex(index)
    if (errors.length) throw new Error(errors.join('\n'))
    if (index < count - 1) {
      activeStep = `step ${index + 2}/${count}`
      await page.keyboard.press('ArrowRight')
      await waitForIndex(index + 1)
    }
  }
  if (errors.length) throw new Error(errors.join('\n'))
  await browser.close()
  browser = undefined
  console.log(`PASS: reference sample registered and rendered all ${count} steps at ${url}/${slug}`)
} catch (error) {
  console.error(`FAIL during ${activeStep}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview && preview.exitCode === null) { preview.kill('SIGTERM'); await delay(200) }
}
