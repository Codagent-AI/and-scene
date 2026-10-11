#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const slug = 'how-to-make-a-presentation'
// Normative expectations copied from the canonical sample table in the OpenSpec.
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
const args = process.argv.slice(2)
const smoke = args.includes('--smoke')
const slugArg = args.indexOf('--slug')
const requestedSlug = slugArg >= 0 ? args[slugArg + 1] : null
const rootIndex = args.indexOf('--root')
const root = path.resolve(rootIndex >= 0 ? args[rootIndex + 1] : process.env.AND_SCENE_ROOT || process.cwd())
let phase = 'arguments'
let preview
let previewError
let browser

function fail(message) { throw new Error(message) }
function run(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32', ...options })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code ?? signal}`)))
  })
}
async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  await new Promise((resolve) => server.close(resolve))
  return port
}
async function waitReady(url) {
  for (let i = 0; i < 100; i++) {
    if (previewError) fail(`preview failed to start: ${previewError.message}`)
    if (preview.exitCode !== null || preview.signalCode !== null) fail(`preview exited early (${preview.exitCode ?? preview.signalCode})`)
    try { const response = await fetch(url); if (response.ok) return } catch {}
    await delay(100)
  }
  fail(`preview did not become ready at ${url}`)
}
function registryEntries(text) {
  return [...text.matchAll(/\{\s*slug:\s*['"]([^'"]+)['"]\s*,\s*title:\s*['"]([^'"]+)['"]\s*,\s*load:\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)\s*\}/g)].map(m => ({ slug: m[1], title: m[2], module: m[3] }))
}
async function checkSample() {
  const registryPath = path.join(root, 'src/presentations/index.ts')
  const registry = await import('node:fs/promises').then(fs => fs.readFile(registryPath, 'utf8').catch(() => ''))
  const entries = registryEntries(registry)
  if (!entries.length) fail('presentation registry is missing or malformed')
  const registration = entries.find(item => item.slug === slug)
  if (!registration) fail(`canonical sample ${slug} is not registered`)
  const sampleDir = path.resolve(root, 'src/presentations', path.dirname(registration.module.replace(/^\.\//, '')))
  const { readFile, access } = await import('node:fs/promises')
  const stepIndex = path.join(sampleDir, 'steps/index.ts')
  await access(stepIndex).catch(() => fail(`canonical sample source is missing: ${stepIndex}`))
  const source = await readFile(stepIndex, 'utf8')
  const names = [...source.matchAll(/import\s+\{\s*(step\d+)\s*\}\s+from\s+['"]\.\/([^'"]+)['"]/g)].map(m => m[2])
  if (names.length !== expected.length || !/export\s+const\s+STEPS\s*=\s*\[([\s\S]*?)\]/.test(source)) fail(`canonical sample must declare exactly ${expected.length} ordered steps`)
  const ordered = source.match(/export\s+const\s+STEPS\s*=\s*\[([\s\S]*?)\]/)[1].match(/step\d+/g) || []
  if (ordered.length !== expected.length || ordered.some((name, i) => name !== `step${String(i + 1).padStart(2, '0')}`)) fail('canonical sample step order is missing or malformed')
  for (let i = 0; i < expected.length; i++) {
    const stepFile = path.join(sampleDir, 'steps', `${String(i + 1).padStart(2, '0')}.tsx`)
    const text = await readFile(stepFile, 'utf8').catch(() => '')
    for (const [label, value] of [['era', expected[i][0]], ['title', expected[i][1]], ['caption', expected[i][2]]]) {
      if (!new RegExp(`${label}\\s*:\\s*(['"\x60])${escapeRegExp(value)}\\1`).test(text)) fail(`step ${i + 1}: ${label} does not match canonical expectation`)
    }
  }
}
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
async function render(targetSlug, entries) {
  const registration = entries.find(item => item.slug === targetSlug)
  if (!registration) fail(`unknown presentation slug "${targetSlug}"`)
  const port = await freePort()
  const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  preview = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'inherit' })
  preview.once('error', error => { previewError = error })
  const base = `http://127.0.0.1:${port}`
  await waitReady(base)
  try { browser = await chromium.launch() } catch (error) { fail(`Chromium unavailable; install it with "npx playwright install chromium" (${error.message})`) }
  const page = await browser.newPage()
  let step = 1
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(`console.error at step ${step}: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`pageerror at step ${step}: ${error.message}`))
  await page.goto(`${base}/${targetSlug}`, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-presentation-step-count]')
  await chrome.waitFor()
  const count = Number(await chrome.getAttribute('data-presentation-step-count'))
  if (!Number.isInteger(count) || count < 1) fail('render: presentation has no readable step count')
  for (step = 1; step <= count; step++) {
    const index = await chrome.getAttribute('data-presentation-step-index')
    if (Number(index) !== step - 1) fail(`step ${step}: expected step index ${step - 1}, got ${index}`)
    if (step < count) {
      await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction((expectedIndex) => Number(document.querySelector('[data-presentation-step-index]')?.getAttribute('data-presentation-step-index')) === expectedIndex, step, { timeout: 5000 }) }
      catch { fail(`step ${step + 1}: step transition did not advance public step index`) }
    }
    if (errors.length) fail(errors[0])
  }
  if (errors.length) fail(errors[0])
  await page.close()
}
let cleanupPromise
async function cleanup() {
  if (cleanupPromise) return cleanupPromise
  cleanupPromise = (async () => {
    if (preview && preview.exitCode === null && preview.signalCode === null) {
      const exited = new Promise(resolve => preview.once('exit', resolve))
      preview.kill('SIGTERM')
      const stopped = await Promise.race([exited.then(() => true), delay(1500).then(() => false)])
      if (!stopped) {
        preview.kill('SIGKILL')
        await Promise.race([exited, delay(1000)])
      }
    }
    await browser?.close().catch(() => {})
  })()
  return cleanupPromise
}
async function main() {
  if (args.some(arg => !['--smoke', '--slug', '--root'].includes(arg)) || (slugArg >= 0 && !requestedSlug) || (rootIndex >= 0 && !args[rootIndex + 1])) fail('usage: node scripts/verify.mjs [--smoke [--slug <slug>]] [--root <project-root>]')
  phase = 'build'
  await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'])
  const registryText = await import('node:fs/promises').then(fs => fs.readFile(path.join(root, 'src/presentations/index.ts'), 'utf8').catch(() => ''))
  const entries = registryEntries(registryText)
  if (!entries.length) { phase = smoke ? 'render' : 'sample'; fail('presentation registry is empty or malformed') }
  if (!smoke) { phase = 'sample'; await checkSample() }
  phase = 'render'
  const target = requestedSlug || (smoke ? entries[0].slug : slug)
  await render(target, entries)
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.once(signal, () => { cleanup().finally(() => process.exit(128 + (signal === 'SIGINT' ? 2 : signal === 'SIGTERM' ? 15 : 1))) })
try { await main(); console.log(smoke ? 'PASS: build and render verification completed' : 'PASS: build, sample, and render verification completed') }
catch (error) { console.error(`FAIL: ${phase}: ${error.message}`); process.exitCode = 1 }
finally { await cleanup() }
