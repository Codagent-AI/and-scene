import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const expected = [
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
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)))
})
async function freePort() {
  const probe = createServer()
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve) })
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}
async function stop(server) {
  if (server.exitCode !== null || server.signalCode !== null) return
  const closed = new Promise((resolve) => server.once('close', resolve))
  server.kill('SIGTERM')
  const timeout = setTimeout(() => server.kill('SIGKILL'), 3000)
  await closed
  clearTimeout(timeout)
}
async function main() {
  await run('npm', ['run', 'build'])
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const canonical = registry.includes("slug: 'how-to-make-a-presentation'")
  const slug = canonical ? 'how-to-make-a-presentation' : 'example'
  const outline = canonical
    ? (await Promise.all(expected.map((_, index) => readFile(new URL(`../src/presentations/${slug}/steps/step-${String(index + 1).padStart(2, '0')}.tsx`, import.meta.url), 'utf8')))).join('\n')
    : await readFile(new URL(`../src/presentations/${slug}/steps.tsx`, import.meta.url), 'utf8')
  const folder = new URL(`../src/presentations/${slug}/`, import.meta.url)
  if (canonical) {
    for (const file of ['Talk.tsx', 'Scene.tsx', 'entities.ts', 'style.css', 'steps.ts']) await readFile(new URL(file, folder))
    let cursor = 0
    for (let i = 0; i < expected.length; i += 1) {
      for (const value of expected[i]) {
        const found = outline.indexOf(value, cursor)
        if (found < 0) throw new Error(`sample check failed at step ${i + 1}: missing or out-of-order “${value}”`)
        cursor = found + value.length
      }
    }
  }
  const port = await freePort()
  const base = `http://127.0.0.1:${port}`
  const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
  const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
  let startup = ''
  server.stderr.setEncoding('utf8'); server.stderr.on('data', (chunk) => { startup += chunk })
  let browser
  try {
    let ready = false
    for (let i = 0; i < 60; i += 1) {
      if (server.exitCode !== null || server.signalCode !== null) throw new Error(`preview failed: ${startup.trim()}`)
      try { ready = (await fetch(base)).ok; if (ready) break } catch { /* wait for preview */ }
      await delay(250)
    }
    if (!ready) throw new Error(`preview readiness failed at ${base}: ${startup.trim()}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    let currentStep = 1
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${currentStep}: console error: ${message.text()}`) })
    page.on('pageerror', (error) => errors.push(`step ${currentStep}: uncaught page error: ${error.message}`))
    await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
    const footer = page.locator('[data-step-count]')
    await footer.waitFor()
    const count = Number(await footer.getAttribute('data-step-count'))
    if (canonical && count !== expected.length) throw new Error(`render check failed: expected ${expected.length} steps, found ${count}`)
    for (let index = 0; index < count; index += 1) {
      currentStep = index + 1
      await page.waitForTimeout(650)
      const actualIndex = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
      if (actualIndex !== index) throw new Error(`step ${index + 1}: expected data-step-index ${index}, found ${actualIndex}`)
      if (canonical) {
        const title = await page.locator('[data-presentation-progress][aria-current="step"]').getAttribute('aria-label')
        if (!title?.includes(expected[index][1])) throw new Error(`step ${index + 1}: expected active title “${expected[index][1]}”, found “${title ?? 'none'}”`)
      }
      if (errors.length) throw new Error(errors[0])
      if (index < count - 1) {
        await page.keyboard.press('ArrowRight')
        try { await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, index + 1, { timeout: 2500 }) }
        catch { throw new Error(`step ${index + 2}: transition did not advance data-step-index`) }
      }
    }
    if (errors.length) throw new Error(errors[0])
    console.log(`PASS: built app and rendered all ${count} ${canonical ? 'reference' : 'bootstrap example'} steps on ${base}`)
  } finally {
    await browser?.close()
    await stop(server)
  }
}
main().catch((error) => { console.error(`FAIL: ${error instanceof Error ? error.message : error}`); process.exitCode = 1 })
