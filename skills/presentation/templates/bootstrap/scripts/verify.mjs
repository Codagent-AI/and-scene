import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

/**
 * Presentation-agnostic verifier for a scaffolded project.
 *
 * Rather than pinning to a single known slug, this reads the project's own
 * registry and renders EVERY registered
 * presentation through all of its steps, failing on any build error, console
 * error, or uncaught page error. A project with no presentations yet still
 * passes (the scaffold builds; there is simply nothing to render).
 *
 * Run via `npm run verify` (which supplies --experimental-strip-types so the
 * TypeScript registry can be imported directly).
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VITE_BIN = join(ROOT, 'node_modules', '.bin', 'vite')

/** @param {string} check @param {string} detail */
function fail(check, detail) {
  console.error(`FAIL [${check}]: ${detail}`)
  process.exit(1)
}

function pass(msg) {
  console.log(`PASS: ${msg}`)
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const child = spawn(npm, ['run', 'build'], { cwd: ROOT, stdio: 'inherit', shell: false })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`build exited ${code}`))))
    child.on('error', reject)
  })
}

/** Read the project's presentation registry. Returns the list of { slug }. */
async function readRegistry() {
  const registryUrl = pathToFileURL(join(ROOT, 'src/presentations/index.ts')).href
  const mod = await import(registryUrl)
  const presentations = mod.presentations
  if (!Array.isArray(presentations)) {
    throw new Error('src/presentations/index.ts does not export a `presentations` array')
  }
  return presentations
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      srv.close((err) => (err ? reject(err) : resolve(port)))
    })
    srv.on('error', reject)
  })
}

/** @param {import('node:child_process').ChildProcess} child */
function childExited(child) {
  return child.exitCode !== null || child.signalCode !== null
}

/** @param {number} port @param {import('node:child_process').ChildProcess} child */
async function waitForPreview(port, child, deadlineMs = 30_000) {
  const started = Date.now()
  while (Date.now() - started < deadlineMs) {
    if (childExited(child)) {
      throw new Error(`vite preview exited before ready (code ${child.exitCode})`)
    }
    try {
      const res = await fetch(`http://localhost:${port}/`)
      const html = await res.text()
      if (res.ok && html.includes('id="root"')) return
    } catch {
      // server not listening yet
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('vite preview did not become ready within 30s')
}

/** @param {import('node:child_process').ChildProcess} child */
function stopPreview(child) {
  return new Promise((resolve) => {
    if (!child.pid) {
      resolve()
      return
    }
    child.once('close', () => resolve())
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
    setTimeout(() => {
      if (!childExited(child)) {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {
          child.kill('SIGKILL')
        }
      }
      resolve()
    }, 3000)
  })
}

/** @param {number} port */
function startPreview(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      VITE_BIN,
      ['preview', '--port', String(port), '--strictPort', '--host', 'localhost'],
      { cwd: ROOT, stdio: 'ignore', detached: true },
    )
    child.unref()
    child.on('error', reject)

    waitForPreview(port, child)
      .then(() => resolve({ child, port }))
      .catch(async (err) => {
        await stopPreview(child)
        reject(err)
      })
  })
}

/** Step a single presentation through every step, capturing render errors. */
async function renderPresentation(page, port, slug) {
  const errors = []
  /** @type {number | null} */
  let failingStep = null

  const onConsole = (msg) => {
    if (msg.type() === 'error') errors.push({ step: failingStep, msg: msg.text() })
  }
  const onPageError = (err) => errors.push({ step: failingStep, msg: err.message })
  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  try {
    await page.goto(`http://localhost:${port}/${slug}`, { waitUntil: 'load', timeout: 30_000 })

    const progress = page.locator('[data-testid="step-progress"]')
    await progress.waitFor({ timeout: 10_000 })

    const stepCount = Number(await progress.getAttribute('data-step-count'))
    if (!Number.isFinite(stepCount) || stepCount < 1) {
      throw new Error(`${slug}: invalid data-step-count: ${stepCount}`)
    }

    for (let i = 0; i < stepCount; i++) {
      failingStep = i
      const index = Number(await progress.getAttribute('data-step-index'))
      if (index !== i) throw new Error(`${slug} step ${i}: expected index ${i}, got ${index}`)

      if (i < stepCount - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (expected) => {
            const el = document.querySelector('[data-testid="step-progress"]')
            return el && Number(el.getAttribute('data-step-index')) === expected
          },
          i + 1,
          { timeout: 5000 },
        )
      }
    }

    if (errors.length > 0) {
      const first = errors[0]
      throw new Error(`${slug} step ${first.step}: ${first.msg}`)
    }
  } finally {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
  }
}

/** @param {number} port @param {Array<{ slug: string }>} presentations */
async function renderCheck(port, presentations) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    for (const { slug } of presentations) {
      await renderPresentation(page, port, slug)
    }
  } finally {
    await browser.close()
  }
}

async function main() {
  try {
    await runBuild()
    pass('build')

    const presentations = await readRegistry()
    pass(`registry (${presentations.length} presentation${presentations.length === 1 ? '' : 's'})`)

    if (presentations.length === 0) {
      console.log('VERIFY: PASS (no presentations registered yet)')
      return
    }

    const port = await getFreePort()
    const { child } = await startPreview(port)
    try {
      await renderCheck(port, presentations)
      pass('render')
    } finally {
      await stopPreview(child)
    }

    console.log('VERIFY: PASS')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    fail(message.includes(' step ') ? 'render' : 'verify', message)
  }
}

main()
