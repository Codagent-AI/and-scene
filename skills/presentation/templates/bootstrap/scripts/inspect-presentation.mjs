import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import net from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Invalid presentation slug; use a single lowercase route segment.')
  process.exit(2)
}
const host = '127.0.0.1'
const output = `.presentation-inspection/${slug}`
let preview
let browser

function spawnLogged(command, args, options = {}) {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options })
  let output = ''
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  return { child, get output() { return output } }
}
async function portOnLoopback() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, host, () => { const port = server.address().port; server.close(error => error ? reject(error) : resolve(port)) })
  })
}
try {
  const build = spawnLogged('npm', ['run', 'build'])
  const buildCode = await new Promise((resolve, reject) => { build.child.once('error', reject); build.child.once('exit', resolve) })
  if (buildCode !== 0) throw new Error(`Build failed (${buildCode}):\n${build.output}`)
  const port = await portOnLoopback()
  const base = `http://${host}:${port}`
  preview = spawnLogged('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { detached: true })
  let ready = false
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (preview.child.exitCode !== null) throw new Error(`Preview exited early: ${preview.output}`)
    try { if ((await fetch(base)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`Preview did not become ready at ${base}`)
  await mkdir(output, { recursive: true })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation][data-step-count]').first()
  await root.waitFor({ state: 'visible' })
  const total = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(total) || total < 1) throw new Error(`No registered steps at /${slug}`)
  for (let index = 0; index < total; index += 1) {
    await page.waitForTimeout(950)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const visible = element => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.02
      }
      const elements = [...document.querySelectorAll('main [data-presentation-text], main p, main a, main button, main strong, main span')]
        .filter(visible).filter(element => !element.closest('[data-allow-overlap]'))
        .map(element => ({ element, rect: element.getBoundingClientRect(), label: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 55) }))
      const collisions = []
      for (let a = 0; a < elements.length; a += 1) for (let b = a + 1; b < elements.length; b += 1) {
        const first = elements[a], second = elements[b]
        if (first.element.contains(second.element) || second.element.contains(first.element)) continue
        const width = Math.max(0, Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left))
        const height = Math.max(0, Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top))
        const overlap = width * height
        if (overlap > Math.min(first.rect.width * first.rect.height, second.rect.width * second.rect.height) * 0.12) collisions.push(`${first.label || first.element.tagName} ↔ ${second.label || second.element.tagName}`)
      }
      const active = document.querySelector('[data-presentation-progress-item][data-presentation-active="true"]')
      const inactive = document.querySelector('[data-presentation-progress-item][data-presentation-active="false"]')
      let activeWarning = ''
      if (active && inactive) {
        const a = getComputedStyle(active), i = getComputedStyle(inactive)
        if (a.backgroundColor === i.backgroundColor && a.color === i.color && a.borderColor === i.borderColor && a.transform === i.transform && a.fontWeight === i.fontWeight)
          activeWarning = 'active progress marker is visually indistinct from inactive markers'
      }
      const activeToc = document.querySelector('[data-presentation-toc-item][data-presentation-active="true"]')
      const inactiveToc = document.querySelector('[data-presentation-toc-item][data-presentation-active="false"]')
      if (activeToc && inactiveToc) {
        const a = getComputedStyle(activeToc), i = getComputedStyle(inactiveToc)
        if (a.color === i.color && a.backgroundColor === i.backgroundColor && a.fontWeight === i.fontWeight && a.textDecorationLine === i.textDecorationLine)
          activeWarning += `${activeWarning ? '; ' : ''}active table-of-contents entry is visually indistinct`
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      let attributionWarning = ''
      if (!attribution) attributionWarning = 'attribution is missing'
      else {
        const style = getComputedStyle(attribution)
        const rect = attribution.getBoundingClientRect()
        let effectiveOpacity = 1
        let current = attribution
        let hiddenByAncestor = false
        while (current) {
          const ancestorStyle = getComputedStyle(current)
          effectiveOpacity *= Number.parseFloat(ancestorStyle.opacity || '1')
          if (ancestorStyle.display === 'none') hiddenByAncestor = true
          current = current.parentElement
        }
        const visible = rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden' && style.visibility !== 'collapse' && !hiddenByAncestor && effectiveOpacity > 0.02
        if (!(attribution.textContent || '').trim() || !visible) attributionWarning = 'attribution is empty or not visible; style [data-presentation-attribution]'
        else if (parseFloat(style.fontSize) < 12 || style.color === 'rgb(0, 0, 238)' || style.textDecorationLine === 'underline') attributionWarning = 'attribution appears browser-default or undersized; style [data-presentation-attribution]'
      }
      return { collisions, activeWarning, attributionWarning }
    })
    for (const collision of warnings.collisions) console.warn(`WARN step ${index + 1}: possible text/chrome overlap: ${collision}`)
    if (warnings.activeWarning) console.warn(`WARN step ${index + 1}: ${warnings.activeWarning}`)
    if (warnings.attributionWarning) console.warn(`WARN step ${index + 1}: ${warnings.attributionWarning}`)
    if (index < total - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(next => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === next, index + 1)
    }
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(`Screenshots saved under ${output}`)
} catch (error) {
  console.error(`Inspection failed: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview?.child.pid) { try { process.kill(-preview.child.pid, 'SIGTERM') } catch {} }
}
