import { mkdir, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('..', import.meta.url))
const slug = process.argv[2] || 'how-to-make-a-presentation'
const output = join(root, 'artifacts/inspection')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const warnings = []
await run('npm', ['run', 'build'])
const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', shell: process.platform === 'win32' })
const previewMonitor = monitorPreview(preview)
try {
  await waitForPreview(preview, previewMonitor.failure)
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`http://127.0.0.1:4173/${slug}`, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation]').waitFor()
    const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
    await mkdir(output, { recursive: true })
    for (let index = 0; index < count; index += 1) {
      if (preview.exitCode !== null || preview.signalCode !== null) throw new Error(`preview exited during inspection at step ${index + 1}`)
      await page.waitForTimeout(700)
      await page.screenshot({ path: join(output, `${slug}-${index}.png`), fullPage: true })
      warnings.push(...await page.evaluate(diagnose, index))
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    for (const error of errors) warnings.push(`step runtime error: ${error}`)
    console.log(`inspect: captured ${count} settled steps for ${packageJson.name}`)
  } finally { await browser.close() }
} finally {
  previewMonitor.dispose()
  await terminatePreview(preview)
}

if (warnings.length) for (const warning of warnings) console.warn(`inspect warning [${slug}]: ${warning}`)

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)))
  })
}

async function waitForPreview(child, failure) {
  const deadline = Date.now() + 15_000
  let output = ''
  let started = false
  child.stdout.on('data', (chunk) => { output += chunk.toString(); started ||= output.includes('127.0.0.1:4173') })
  child.stderr.on('data', (chunk) => { output += chunk.toString() })
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview exited before startup: ${output.trim()}`)
    if (started) {
      try { const response = await fetch('http://127.0.0.1:4173/'); await response.body?.cancel(); if (response.ok) return } catch {}
    }
    await Promise.race([new Promise((resolve) => setTimeout(resolve, 100)), failure])
  }
  throw new Error(`preview did not start: ${output.trim()}`)
}

function monitorPreview(preview) {
  let onError
  let onExit
  const failure = new Promise((_, reject) => {
    onError = (error) => reject(error)
    onExit = (code, signal) => reject(new Error(`preview exited: ${code ?? signal}`))
    preview.once('error', onError)
    preview.once('exit', onExit)
  })
  return { failure, dispose: () => { preview.off('error', onError); preview.off('exit', onExit) } }
}

async function terminatePreview(preview) {
  const parentExited = preview.exitCode !== null || preview.signalCode !== null
  if (process.platform !== 'win32' && preview.pid) {
    try { process.kill(-preview.pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') throw error }
  }
  if (process.platform === 'win32') {
    if (preview.pid) await run('taskkill', ['/PID', String(preview.pid), '/T', '/F'])
    return
  }
  if (!parentExited) {
    preview.kill('SIGTERM')
    await new Promise((resolve) => preview.once('close', resolve))
  }
}

function diagnose(step) {
  const result = []
  const visible = [...document.querySelectorAll('[data-presentation-caption], [data-presentation-header], [data-presentation-controls], [data-presentation-toc], [data-presentation-node]:not(.how-to-arrow):not(.how-to-arc):not(.how-to-reveal), [data-presentation-attribution]')].filter((element) => {
    const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden'
  })
  const allowed = (element) => element.closest('[data-presentation-overlap-allowed]')
  for (let i = 0; i < visible.length; i += 1) for (let j = i + 1; j < visible.length; j += 1) {
    const a = visible[i].getBoundingClientRect(); const b = visible[j].getBoundingClientRect()
    if (!allowed(visible[i]) && !allowed(visible[j]) && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) result.push(`step ${step + 1}: visible chrome/text overlap between ${visible[i].className} and ${visible[j].className}`)
  }
  const active = document.querySelector('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"]')
  const inactive = document.querySelector('[data-presentation-progress-item]:not([aria-current="step"]), [data-presentation-toc-item]:not([aria-current="step"])')
  if (!active) result.push(`step ${step + 1}: active navigation state is missing`)
  else if (inactive && getComputedStyle(active).color === getComputedStyle(inactive).color && getComputedStyle(active).backgroundColor === getComputedStyle(inactive).backgroundColor) result.push(`step ${step + 1}: active navigation state is visually indistinct`)
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) result.push(`step ${step + 1}: attribution is missing`)
  else if (parseFloat(getComputedStyle(attribution).fontSize) < 11 || getComputedStyle(attribution).color === 'rgb(0, 0, 238)') result.push(`step ${step + 1}: attribution is too small or browser-default; style [data-presentation-attribution]`)
  return result
}
