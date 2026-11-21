import { execFileSync, fork } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

export const STEP_TIMEOUT = 4000
export const SETTLE_MS = 720
export const DESKTOP = { width: 1440, height: 900 }

export function build() {
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' })
}

async function start(portProcess) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error('Preview startup timed out')), 12000)
  const options = { signal: controller.signal }
  try {
    const port = await Promise.race([
      once(portProcess, 'message', options).then(([message]) => message.port),
      once(portProcess, 'exit', options).then(([code]) => {
        throw new Error(`Preview exited before startup (code ${code})`)
      }),
    ])
    const url = new URL(`http://127.0.0.1:${port}/`)
    const response = await fetch(url, options)
    if (!response.ok) throw new Error(`Preview readiness failed (HTTP ${response.status})`)
    await response.body?.cancel()
    return url
  } finally {
    clearTimeout(timeout)
    controller.abort()
  }
}

async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return
  const exited = once(child, 'exit')
  if (child.connected) child.disconnect()
  const timeout = setTimeout(() => child.kill('SIGKILL'), 3000)
  try {
    await exited
  } finally {
    clearTimeout(timeout)
  }
}

export async function withPreview(run) {
  const child = fork(fileURLToPath(new URL('./preview.mjs', import.meta.url)))
  try {
    const url = await start(child)
    console.log(`Preview ready at ${url.href}`)
    return await run(url)
  } finally {
    await stop(child)
  }
}

export async function withPage(viewport, run) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport })
    page.setDefaultTimeout(STEP_TIMEOUT)
    return await run(page)
  } finally {
    await browser.close()
  }
}

export function scene(page) {
  return page.locator('[data-presentation]')
}

export async function openPresentation(page, url, slug) {
  const route = new URL(encodeURIComponent(slug), url)
  const response = await page.goto(route.href, { waitUntil: 'domcontentloaded' })
  if (!response?.ok()) throw new Error(`Could not open presentation route ${route.pathname}`)
  const root = scene(page)
  await root.waitFor()
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('Invalid presentation step count')
  return count
}

export async function advance(page, index) {
  await page.keyboard.press('ArrowRight')
  await page.locator(`[data-presentation][data-step-index="${index}"]`).waitFor()
}

export function collectErrors(page) {
  const errors = []
  page.on('pageerror', error => errors.push(`page error: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console error: ${message.text()}`)
  })
  return errors
}
