import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { access, mkdir, readdir, stat } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { chromium } from 'playwright'

export function parseArgs(argv) {
  const args = { slug: undefined, port: undefined, viewport: { width: 1440, height: 900 }, settle: 1200, noBuild: false, fullPage: false }
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i]
    if (!value.startsWith('--')) {
      if (args.slug) throw new Error(`Unexpected argument: ${value}`)
      args.slug = value
    } else if (value === '--no-build') args.noBuild = true
    else if (value === '--full-page') args.fullPage = true
    else if (value === '--port' || value === '--settle' || value === '--viewport') {
      const option = value.slice(2)
      const next = argv[++i]
      if (!next) throw new Error(`Missing value for ${value}`)
      if (option === 'viewport') {
        const match = /^(\d+)x(\d+)$/i.exec(next)
        if (!match || Number(match[1]) < 1 || Number(match[2]) < 1) throw new Error('Invalid --viewport; expected WxH')
        args.viewport = { width: Number(match[1]), height: Number(match[2]) }
      } else {
        const number = Number(next)
        if (!Number.isInteger(number) || number < (option === 'port' ? 1 : 0) || (option === 'port' && number > 65535)) throw new Error(`Invalid --${option}`)
        args[option] = number
      }
    } else throw new Error(`Unknown argument: ${value}`)
  }
  if (!args.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) throw new Error('Usage: npm run inspect -- <slug> [--viewport WxH] [--settle ms] [--port port] [--no-build] [--full-page]')
  return args
}

export function formatWarning(step, message) { return `WARN [inspect] step ${step}: ${message}` }

export function evaluateDiagnostics() {
  const intersectsBoxes = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  const attributionNeedsWarning = ({ fontSize, height, color, textDecoration, authorStyle }) => fontSize < 11 || height < 24 || (!authorStyle && (color === 'rgb(0, 0, 238)' || textDecoration.includes('underline')))
  const rectCache = new WeakMap()
  const rectFor = element => {
    if (!rectCache.has(element)) rectCache.set(element, element.getBoundingClientRect())
    return rectCache.get(element)
  }
  const visible = element => {
    const style = getComputedStyle(element), rect = rectFor(element)
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
  }
  const describe = element => {
    const hook = [...element.attributes].find(attribute => attribute.name.startsWith('data-presentation-'))
    const snippet = (element.innerText || element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 48)
    return `${element.tagName.toLowerCase()}${hook ? `[${hook.name}]` : ''}${snippet ? ` “${snippet}”` : ''}`
  }
  const candidates = [...document.querySelectorAll('body *')].filter(element => {
    if (!visible(element) || element.closest('[data-presentation-allow-overlap]')) return false
    // Region wrappers (header/footer/stage/tray/root) have deliberately broad boxes.
    // Compare actual text nodes and individually interactive chrome instead.
    if (element.children.length > 0 && !['BUTTON', 'A'].includes(element.tagName)) return false
    return Boolean((element.innerText || element.textContent || '').trim())
  })
  const positioned = candidates.map(element => ({ element, rect: rectFor(element) })).sort((a, b) => a.rect.left - b.rect.left)
  const overlaps = []
  for (let i = 0; i < positioned.length; i += 1) for (let j = i + 1; j < positioned.length && positioned[j].rect.left < positioned[i].rect.right; j += 1) {
    const { element: a, rect: ar } = positioned[i], { element: b, rect: br } = positioned[j]
    if (a.contains(b) || b.contains(a)) continue
    if (intersectsBoxes(ar, br)) overlaps.push(`${describe(a)} overlaps ${describe(b)}`)
  }
  const warnings = overlaps.map(message => `overlap: ${message}`)
  for (const container of document.querySelectorAll('[data-presentation-progress], [data-presentation-toc]')) {
    const active = container.querySelector('[aria-current="step"], [data-presentation-active]')
    if (!active || !visible(active)) continue
    const siblings = [...container.querySelectorAll('button')].filter(item => item !== active && visible(item))
    const signature = element => {
      const style = getComputedStyle(element)
      return ['color','backgroundColor','borderColor','borderWidth','opacity','fontWeight','fontSize','outline','boxShadow','transform'].map(key => style[key]).join('|')
    }
    if (siblings.length && siblings.every(item => signature(item) === signature(active))) warnings.push(`active ${container.hasAttribute('data-presentation-progress') ? 'progress indicator' : 'table of contents'} is visually indistinguishable from inactive controls`)
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) warnings.push('missing [data-presentation-attribution] link; style the data-presentation-attribution hook')
  else {
    const style = getComputedStyle(attribution), rect = rectFor(attribution)
    const authorStyle = style.fontFamily !== 'serif' || style.fontSize !== '16px' || style.color !== 'rgb(0, 0, 238)' || style.textDecorationLine !== 'underline'
    if (attributionNeedsWarning({ fontSize: Number.parseFloat(style.fontSize), height: rect.height, color: style.color, textDecoration: style.textDecorationLine, authorStyle })) warnings.push('attribution is too small or browser-default; style the data-presentation-attribution hook (minimum 11px and 24px hit area)')
  }
  return warnings
}

async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  await new Promise(resolve => server.close(resolve))
  return port
}
async function latestMtime(directory) {
  let latest = 0
  const entries = await (await import('node:fs/promises')).readdir(directory, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    const location = path.join(directory, entry.name)
    if (entry.isDirectory()) latest = Math.max(latest, await latestMtime(location))
    else if (entry.isFile()) latest = Math.max(latest, (await stat(location)).mtimeMs)
  }
  return latest
}
const root = process.cwd()
let preview
async function stopPreview() {
  if (!preview) return
  try { preview.kill('SIGTERM'); await Promise.race([new Promise(resolve => preview.once('exit', resolve)), delay(2000)]); if (preview.exitCode === null) preview.kill('SIGKILL') } finally { preview = undefined }
}
async function run() {
  let browser
  try {
    const args = parseArgs(process.argv.slice(2))
    const dist = path.join(root, 'dist/index.html')
    let shouldBuild = false
    try {
      const build = await stat(dist)
      const sourceTimes = await Promise.all(['src', 'public'].map(directory => latestMtime(path.join(root, directory))))
      sourceTimes.push((await stat(path.join(root, 'index.html')).catch(() => ({ mtimeMs: 0 }))).mtimeMs)
      shouldBuild = Math.max(...sourceTimes) > build.mtimeMs
    } catch { shouldBuild = true }
    if (args.noBuild && shouldBuild) throw new Error('dist is missing or stale; remove --no-build or build first')
    if (shouldBuild) {
      const result = await new Promise((resolve, reject) => { const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' }); child.once('error', reject); child.once('exit', (code, signal) => resolve({ code, signal })) })
      if (result.code !== 0) throw new Error(`npm run build exited ${result.signal ?? result.code}`)
    }
    const port = args.port ?? await freePort()
    preview = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore', detached: process.platform !== 'win32' })
    const base = `http://127.0.0.1:${port}`
    let ready = false
    for (let attempt = 0; attempt < 100; attempt += 1) { if (preview.exitCode !== null) throw new Error('Preview process exited before becoming ready'); try { const response = await fetch(`${base}/`, { signal: AbortSignal.timeout(500) }); if (response.ok && preview.exitCode === null) { ready = true; break } } catch {} await delay(100) }
    if (!ready) throw new Error('Preview did not start on 127.0.0.1')
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: args.viewport })
    let pageError
    const consoleErrors = []
    page.on('pageerror', error => { pageError = error })
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    await page.goto(`${base}/${args.slug}`, { waitUntil: 'networkidle' })
    const rootElement = page.locator('[data-presentation-root]')
    try { await rootElement.waitFor({ state: 'visible', timeout: 5000 }) } catch { throw new Error(`Unknown presentation slug or page failed to render: ${args.slug}`) }
    const count = Number(await rootElement.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`${args.slug} rendered no presentation steps`)
    const outDir = path.join(root, '.presentation-inspection', args.slug)
    await mkdir(outDir, { recursive: true })
    for (const entry of await readdir(outDir)) if (/^step-\d+\.png$/.test(entry)) await (await import('node:fs/promises')).unlink(path.join(outDir, entry))
    for (let index = 0; index < count; index += 1) {
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(expected => Number(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')) === expected, index, { timeout: 5000 })
        await page.waitForTimeout(args.settle)
        await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => undefined))))
      } else await page.waitForTimeout(args.settle)
      const warnings = await page.evaluate(source => (new Function(`return (${source})`))()(), evaluateDiagnostics.toString())
      if (pageError) throw new Error(`page error at step ${index + 1}: ${pageError.message}`)
      for (const warning of warnings) console.warn(formatWarning(index + 1, warning))
      const filename = `step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: path.join(outDir, filename), fullPage: args.fullPage })
      if (pageError) throw new Error(`page error at step ${index + 1}: ${pageError.message}`)
      if (consoleErrors.length) throw new Error(`browser console error at step ${index + 1}: ${consoleErrors[0]}`)
      console.log(`[inspect] settled step ${index + 1}`)
      console.log(`[inspect] captured ${args.slug}/${filename}`)
    }
    if (pageError) throw new Error(`page error during inspection: ${pageError.message}`)
    if (consoleErrors.length) throw new Error(`browser console error during inspection: ${consoleErrors[0]}`)
    console.log(`[inspect] wrote ${count} screenshots to ${path.relative(root, outDir)}`)
    return 0
  } catch (error) { console.error(`FAIL [inspect] ${error instanceof Error ? error.message : String(error)}`); return 1 }
  finally { await browser?.close(); await stopPreview() }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await run()
