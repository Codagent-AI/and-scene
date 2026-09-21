import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { previewStarted } from './preview.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
if (!pkg.scripts?.build) throw new Error('verify: missing build script')

const requestedSlug = process.argv[2]
const slugs = requestedSlug ? [validateSlug(requestedSlug)] : await registeredSlugs()
if (slugs.length === 0) throw new Error('verify: no registered presentations found')

const build = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
const buildStatus = await new Promise((resolve) => build.on('close', resolve))
if (buildStatus !== 0) process.exit(buildStatus ?? 1)

const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32', detached: process.platform !== 'win32' })
const previewMonitor = monitorPreview(preview)
try {
  await waitForPreview(preview, previewMonitor.failure)
  const browser = await chromium.launch({ headless: true })
  try {
    for (const slug of slugs) await Promise.race([verifyRoute(browser, slug), previewMonitor.failure])
    if (preview.exitCode !== null || preview.signalCode !== null) throw new Error('verify: preview exited during browser verification')
  } finally {
    await browser.close()
  }
  console.log(`verify: build and browser render passed for ${slugs.join(', ')}`)
} finally {
  previewMonitor.dispose()
  await terminatePreview(preview)
}

function validateSlug(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`verify: invalid presentation slug "${slug}"`)
  return slug
}

async function registeredSlugs() {
  const source = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
  return [...source.matchAll(/slug:\s*['"]([a-z0-9-]+)['"]/g)].map((match) => validateSlug(match[1]))
}

async function waitForPreview(child, failure) {
  const deadline = Date.now() + 15_000
  let started = false
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk.toString(); started ||= previewStarted(output) })
  child.stderr.on('data', (chunk) => { output += chunk.toString() })
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`verify: preview exited before startup${output ? `: ${output.trim()}` : ''}`)
    if (started) {
      try {
        const response = await fetch('http://127.0.0.1:4173/', { signal: AbortSignal.timeout(1000) })
        await response.body?.cancel()
        if (response.ok) return
      } catch {}
    }
    await Promise.race([new Promise((resolve) => setTimeout(resolve, 100)), failure])
  }
  throw new Error(`verify: preview did not start${output ? `: ${output.trim()}` : ''}`)
}

async function verifyRoute(browser, slug) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto(`http://127.0.0.1:4173/${slug}`, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation]').waitFor()
    if (errors.length) throw new Error(`verify: browser errors on ${slug}: ${errors.join('; ')}`)
  } finally {
    await page.close()
  }
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

function run(command, args) { return new Promise((resolve, reject) => { const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }); child.on('error', reject); child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))) }) }
