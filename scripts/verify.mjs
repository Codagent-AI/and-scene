import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const slug = 'how-to-make-a-presentation'
const title = 'How to Use This Skill to Make a Presentation'
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
const vite = path.join(project, 'node_modules/vite/bin/vite.js')
const runBuild = () => new Promise((resolve, reject) => {
  const child = spawn('npm', ['run', 'build'], { cwd: project, stdio: 'inherit' })
  child.once('error', reject)
  child.once('exit', code => code === 0 ? resolve() : reject(new Error(`build check failed: npm run build exited ${code}`)))
})
function stop(child, exited) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  child.kill('SIGTERM')
  return Promise.race([exited.then(() => true), delay(3000).then(() => false)]).then(async stopped => {
    if (!stopped && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await exited
  })
}
let server, browser, serverExited
try {
  await runBuild()
  const registry = await readFile(path.join(project, 'src/presentations/index.ts'), 'utf8')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`title: '${title}'`) || !registry.includes(`import('./${slug}/Talk')`)) throw new Error('sample check failed: canonical reference route is missing or not registered')
  server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { cwd: project, stdio: 'ignore' })
  serverExited = new Promise(resolve => server.once('exit', (code, signal) => resolve({ code, signal })))
  let serverError
  server.once('error', error => { serverError = error })
  const base = 'http://127.0.0.1:4178'
  let ready = false
  for (let i = 0; i < 60; i++) {
    if (serverError) throw new Error(`preview check failed: ${serverError.message}`)
    if (server.exitCode !== null) throw new Error(`preview check failed: server exited with ${server.exitCode}`)
    try { if ((await fetch(base)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('preview check failed: server did not become ready at 127.0.0.1:4178')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  let expectedIndex = 0
  const errors = []
  page.on('pageerror', error => errors.push({ index: expectedIndex, message: error.message }))
  page.on('console', message => { if (message.type() === 'error') errors.push({ index: expectedIndex, message: message.text() }) })
  const route = `http://127.0.0.1:4178/${slug}`
  await page.goto(route)
  const root = page.locator('[data-presentation]')
  try { await root.waitFor({ timeout: 10000 }) } catch { throw new Error(`render check failed at step 1: sample route ${route} did not mount`) }
  const count = Number(await root.getAttribute('data-step-count'))
  if (count !== outline.length) throw new Error(`sample check failed: expected ${outline.length} steps, found ${count}`)
  for (let index = 0; index < count; index++) {
    expectedIndex = index
    let failureStep = index + 1
    try {
      await page.waitForFunction(i => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === i, index, { timeout: 5000 })
      const actualTitle = await root.getAttribute('data-step-title')
      const actualCaption = await root.getAttribute('data-step-caption')
      if (actualTitle !== outline[index][0] || actualCaption !== outline[index][1]) throw new Error(`outline mismatch (title: ${JSON.stringify(actualTitle)}, caption: ${JSON.stringify(actualCaption)})`)
      await page.waitForTimeout(700)
      const stepErrors = errors.filter(error => error.index === index)
      if (stepErrors.length) throw new Error(stepErrors.map(error => error.message).join('; '))
      console.log(`PASS: step ${index + 1}/${count} — ${actualTitle}`)
      if (index + 1 < count) {
        expectedIndex = index + 1
        failureStep = index + 2
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(i => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === i, index + 1, { timeout: 5000 })
      }
    } catch (error) { throw new Error(`render check failed at step ${failureStep}: ${error.message}`) }
  }
  console.log(`PASS: build, canonical sample, and all ${count} rendered steps on 127.0.0.1`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && serverExited) await stop(server, serverExited)
}
