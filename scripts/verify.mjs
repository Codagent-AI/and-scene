import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const route = '/how-to-make-a-presentation'
const outline = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]
const sayFail = (phase, message) => { throw new Error(`${phase}: ${message}`) }
const waitForExit = (child) => new Promise((resolve) => child.once('exit', resolve))

async function availablePort() {
  const server = createServer()
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, host, resolve))
  const port = server.address().port
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

async function main() {
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })
  const buildCode = await waitForExit(build)
  if (buildCode !== 0) sayFail('BUILD', `npm run build exited ${buildCode}`)

  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const source = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps.tsx', import.meta.url), 'utf8')
  if (!registry.includes(`slug: '${route.slice(1)}'`) || !registry.includes("import('./how-to-make-a-presentation/Talk.js')")) sayFail('SAMPLE CONTRACT', 'reference sample is missing or not registered')
  let cursor = -1
  for (const [title, caption] of outline) {
    const titleSingle = source.indexOf(`title: '${title}'`, cursor + 1)
    const titleDouble = source.indexOf(`title: "${title}"`, cursor + 1)
    const titleAt = titleSingle < 0 ? titleDouble : titleDouble < 0 ? titleSingle : Math.min(titleSingle, titleDouble)
    const captionAt = source.indexOf(`caption: '${caption}'`, titleAt + 1)
    if (titleAt < 0 || captionAt < 0) sayFail('SAMPLE CONTRACT', `missing or out-of-order step: ${title}`)
    cursor = captionAt
  }
  if ((source.match(/id: '[-a-z]+'/g) ?? []).length < outline.length) sayFail('SAMPLE CONTRACT', 'reference sample does not define nine ordered steps')

  const port = await availablePort()
  const origin = `http://${host}:${port}`
  const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
  const server = spawn(process.execPath, [vite, 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  let serverOutput = ''
  let serverFailure
  server.stdout.on('data', (chunk) => { serverOutput += chunk })
  server.stderr.on('data', (chunk) => { serverOutput += chunk })
  server.once('error', (error) => { serverFailure = error })
  let browser
  try {
    let ready = false
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (serverFailure || server.exitCode !== null) sayFail('PREVIEW', `${serverFailure?.message ?? `server exited ${server.exitCode}`}\n${serverOutput}`)
      try {
        const response = await fetch(origin)
        if (response.ok) { ready = true; break }
      } catch { /* retry while Vite starts */ }
      await delay(200)
    }
    if (!ready) sayFail('PREVIEW', `did not become ready at ${origin}\n${serverOutput}`)

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    let currentStep = 1
    const errors = []
    page.on('pageerror', (error) => errors.push(`step ${currentStep}: ${error.message}`))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${currentStep}: ${message.text()}`) })
    await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    try { await root.waitFor({ timeout: 5000 }) }
    catch { sayFail('RENDER', `step ${currentStep} did not mount the presentation root`) }
    const count = Number(await root.getAttribute('data-step-count'))
    if (count !== outline.length) sayFail('RENDER', `expected ${outline.length} steps, got ${count}`)
    for (let index = 0; index < count; index += 1) {
      currentStep = index + 1
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        try { await root.waitFor({ state: 'attached', timeout: 1000 }); await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')) === expected, index, { timeout: 2500 }) }
        catch { sayFail('TRANSITION', `step ${index + 1} did not advance to index ${index}`) }
      }
      await page.waitForTimeout(150)
      if (errors.length) sayFail('RENDER', `step ${currentStep}: ${errors.join('; ')}`)
      const [expectedTitle, expectedCaption] = outline[index]
      const footer = page.locator('[data-presentation-footer]')
      const renderedTitle = (await footer.locator('.presentation-step-title').textContent())?.trim()
      const renderedCaption = (await footer.locator('.presentation-caption').textContent())?.trim()
      if (renderedTitle !== expectedTitle) sayFail('SAMPLE CONTRACT', `step ${currentStep} rendered "${renderedTitle}", expected "${expectedTitle}"`)
      if (renderedCaption !== expectedCaption) sayFail('SAMPLE CONTRACT', `step ${currentStep} rendered caption "${renderedCaption}", expected "${expectedCaption}"`)
      console.log(`PASS: reference step ${currentStep}/${count} rendered`)
    }
    console.log(`PASS: npm run verify completed on ${origin}${route}`)
  } finally {
    await browser?.close()
    server.kill('SIGTERM')
    await Promise.race([waitForExit(server), delay(1500)]).catch(() => {})
    if (server.exitCode === null) server.kill('SIGKILL')
  }
}

main().catch((error) => { console.error(`FAIL: ${error.message}`); process.exitCode = 1 })
