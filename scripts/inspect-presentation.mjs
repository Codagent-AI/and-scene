import { once } from 'node:events'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const host = '127.0.0.1'
const settleMs = 750

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

function getAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Could not allocate an IPv4 preview port.'))
        return
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port))
    })
  })
}

function watchPreview(preview) {
  let failure
  const recordFailure = (error) => { failure = error instanceof Error ? error : new Error(String(error)) }
  preview.once('error', recordFailure)
  preview.once('exit', (code, signal) => recordFailure(new Error(`Preview exited before readiness (${code ?? signal ?? 'unknown'}).`)))
  return () => failure
}

async function waitForPreview(url, getPreviewFailure) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const failure = getPreviewFailure()
    if (failure) throw failure
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // The preview process is still starting.
    }
    await delay(250)
  }
  throw getPreviewFailure() ?? new Error(`Preview did not become ready at ${url}`)
}

function inspectionWarnings(index) {
  const visible = (element) => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
  }
  const description = (element) => element.getAttribute('data-presentation-node') || element.getAttribute('data-presentation-header') || element.getAttribute('data-presentation-footer') || element.getAttribute('data-presentation-toc') || element.getAttribute('data-presentation-attribution') || element.textContent?.trim().slice(0, 36) || element.tagName.toLowerCase()
  const intersects = (first, second) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
  const text = Array.from(document.querySelectorAll('[data-presentation] *')).filter((element) => element.children.length === 0 && element.textContent?.trim() && visible(element))
  const warnings = []
  for (let firstIndex = 0; firstIndex < text.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < text.length; secondIndex += 1) {
      const first = text[firstIndex]
      const second = text[secondIndex]
      if (first.closest('[data-presentation-allow-overlap]') || second.closest('[data-presentation-allow-overlap]')) continue
      if (intersects(first.getBoundingClientRect(), second.getBoundingClientRect())) warnings.push(`step ${index + 1}: visible overlap between ${description(first)} and ${description(second)}`)
    }
  }
  const active = document.querySelector('[data-presentation-progress-active="true"], [data-presentation-toc-active="true"]')
  const inactive = document.querySelector('[data-presentation-progress] button:not([data-presentation-progress-active]), [data-presentation-toc] button:not([data-presentation-toc-active])')
  if (active && inactive) {
    const activeStyle = getComputedStyle(active)
    const inactiveStyle = getComputedStyle(inactive)
    const properties = ['backgroundColor', 'color', 'borderColor', 'fontWeight', 'opacity', 'transform']
    if (properties.every((property) => activeStyle[property] === inactiveStyle[property])) warnings.push(`step ${index + 1}: active navigation is visually indistinct`)
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) warnings.push(`step ${index + 1}: attribution is missing`)
  else {
    const style = getComputedStyle(attribution)
    if (Number.parseFloat(style.fontSize) < 10 || (style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline'))) warnings.push(`step ${index + 1}: attribution needs presentation-owned styling`)
  }
  return [...new Set(warnings)]
}

if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid presentation slug.')

let preview
let previewExited
let browser
try {
  await run('npm', ['run', 'build'])
  const port = await getAvailablePort()
  preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  previewExited = once(preview, 'exit')
  const getPreviewFailure = watchPreview(preview)
  const previewUrl = `http://${host}:${port}`
  await waitForPreview(`${previewUrl}/`, getPreviewFailure)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${previewUrl}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor({ timeout: 5_000 })
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('Presentation did not expose a valid data-step-count.')
  const artifactDirectory = resolve('artifacts', 'presentation-inspection', slug)
  await mkdir(artifactDirectory, { recursive: true })

  for (let index = 0; index < count; index += 1) {
    await delay(settleMs)
    await page.screenshot({ path: resolve(artifactDirectory, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    for (const warning of await page.evaluate(inspectionWarnings, index)) console.warn(`INSPECT WARN: ${warning}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((nextIndex) => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(nextIndex), index + 1, { timeout: 3_000 })
    }
  }
  console.log(`INSPECT PASS: screenshots written to ${artifactDirectory}`)
} finally {
  await browser?.close()
  if (preview) {
    if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')
    await previewExited?.catch(() => undefined)
  }
}
