import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { REFERENCE_SLUG, isSampleRegistered } from './verify-lib.mjs'

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
    const child = spawn('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit', shell: true })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`build exited ${code}`))))
    child.on('error', reject)
  })
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
    const done = () => resolve()
    child.once('close', done)
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
    const child = spawn(VITE_BIN, ['preview', '--port', String(port), '--strictPort', '--host', 'localhost'], {
      cwd: ROOT,
      stdio: 'ignore',
      detached: true,
    })
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

/** @param {number} port */
async function renderCheck(port) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const errors = []
    /** @type {number | null} */
    let failingStep = null

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({ step: failingStep, msg: msg.text() })
      }
    })
    page.on('pageerror', (err) => {
      errors.push({ step: failingStep, msg: err.message })
    })

    const url = `http://localhost:${port}/${REFERENCE_SLUG}`
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 })

    const progress = page.locator('[data-testid="step-progress"]')
    await progress.waitFor({ timeout: 10_000 })

    const stepCount = Number(await progress.getAttribute('data-step-count'))
    if (!Number.isFinite(stepCount) || stepCount < 1) {
      throw new Error(`invalid data-step-count: ${stepCount}`)
    }

    for (let i = 0; i < stepCount; i++) {
      failingStep = i
      const index = Number(await progress.getAttribute('data-step-index'))
      if (index !== i) {
        throw new Error(`expected step index ${i}, got ${index}`)
      }

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
      throw new Error(`step ${first.step}: ${first.msg}`)
    }
  } finally {
    await browser.close()
  }
}

async function main() {
  try {
    await runBuild()
    pass('build')

    if (!(await isSampleRegistered(ROOT))) {
      fail('registry', `reference sample "${REFERENCE_SLUG}" is not registered`)
    }
    pass('registry')

    const port = await getFreePort()
    const { child } = await startPreview(port)
    try {
      await renderCheck(port)
      pass('render')
    } finally {
      await stopPreview(child)
    }

    console.log('VERIFY: PASS')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('step ')) {
      fail('render', message)
    }
    fail('verify', message)
  }
}

main()
