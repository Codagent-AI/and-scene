import { mkdir, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { previewStarted } from './preview.mjs'
import { diagnose } from './diagnose.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const slug = await resolveSlug(process.argv[2])
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

async function resolveSlug(requested) {
  if (requested) return validateSlug(requested)
  const source = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
  const [first] = [...source.matchAll(/slug:\s*['"]([a-z0-9-]+)['"]/g)].map((match) => validateSlug(match[1]))
  if (!first) throw new Error('inspect: no registered presentations found')
  return first
}

function validateSlug(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`inspect: invalid presentation slug "${slug}"`)
  return slug
}

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
  child.stdout.on('data', (chunk) => { output += chunk.toString(); started ||= previewStarted(output) })
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
