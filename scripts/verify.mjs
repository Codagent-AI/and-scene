import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import {
  REFERENCE_SLUG,
  checkSampleRegistered,
  readRegistrySource,
} from './verify-lib.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_PATH = join(ROOT, 'src/presentations/index.ts')

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

/** @param {number} port */
async function waitForPreview(port, deadlineMs = 30_000) {
  const started = Date.now()
  while (Date.now() - started < deadlineMs) {
    try {
      const res = await fetch(`http://localhost:${port}/`)
      if (res.ok || res.status === 404) return
    } catch {
      // server not listening yet
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('vite preview did not become ready within 30s')
}

/** @param {number} port */
function startPreview(port) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'preview', '--', '--port', String(port), '--strictPort'], {
      cwd: ROOT,
      stdio: 'ignore',
      shell: true,
    })
    child.on('error', reject)
    waitForPreview(port)
      .then(() => resolve({ child, port }))
      .catch((err) => {
        child.kill()
        reject(err)
      })
  })
}

/** @param {number} port */
async function renderCheck(port) {
  const browser = await chromium.launch()
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
    await browser.close()
    throw new Error(`invalid data-step-count: ${stepCount}`)
  }

  for (let i = 0; i < stepCount; i++) {
    failingStep = i
    const index = Number(await progress.getAttribute('data-step-index'))
    if (index !== i) {
      await browser.close()
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

  await browser.close()

  if (errors.length > 0) {
    const first = errors[0]
    throw new Error(`step ${first.step}: ${first.msg}`)
  }
}

async function main() {
  try {
    await runBuild()
    pass('build')

    const registry = readRegistrySource(REGISTRY_PATH)
    if (!checkSampleRegistered(registry)) {
      fail('registry', `reference sample "${REFERENCE_SLUG}" is not registered`)
    }
    pass('registry')

    const port = 4173
    const { child } = await startPreview(port)
    try {
      await renderCheck(port)
      pass('render')
    } finally {
      child.kill('SIGTERM')
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
