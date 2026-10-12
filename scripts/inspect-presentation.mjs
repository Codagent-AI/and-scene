import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { freePort, waitReady } from './verify.mjs'
import { validateSample } from './verification-lib.mjs'
import { spawn } from 'node:child_process'
import { findOverlaps, stylesIndistinguishable, attributionWarnings } from './inspection-lib.mjs'

export { findOverlaps, stylesIndistinguishable, attributionWarnings }
export function parseInspectArgs(args) {
  const result = { slug: null, narrow: false, settle: Number(process.env.AND_SCENE_SETTLE_MS || 900), root: process.cwd() }
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) result.slug = args[i]
    else if (args[i] === '--narrow') result.narrow = true
    else if (args[i] === '--settle') result.settle = Number(args[++i])
    else if (args[i] === '--root') result.root = path.resolve(args[++i])
    else throw new Error(`unknown argument: ${args[i]}`)
  }
  if (!result.slug) throw new Error('usage: npm run inspect -- <slug> [--narrow] [--settle ms]')
  if (!Number.isFinite(result.settle) || result.settle < 0) throw new Error('--settle must be a non-negative number')
  return result
}
export async function inspect({ slug, narrow, settle, root }) {
  let browser, preview
  const cleanup = async () => {
    await browser?.close().catch(() => {})
    if (preview && preview.exitCode === null) { preview.kill('SIGTERM'); await new Promise((resolve) => setTimeout(resolve, 300)); if (preview.exitCode === null) preview.kill('SIGKILL') }
  }
  process.once('SIGINT', () => { process.exitCode = 130; void cleanup() })
  try {
    const { execFileSync } = await import('node:child_process')
    execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
    const sample = slug === 'how-to-make-a-presentation'
    if (sample) await validateSample(root, slug)
    else {
      const registry = await import('node:fs/promises').then(({ readFile }) => readFile(path.join(root, 'src/presentations/index.ts'), 'utf8'))
      if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`./${slug}/Talk`)) throw new Error(`unknown presentation slug: ${slug}`)
    }
    const port = await freePort(), base = `http://127.0.0.1:${port}`
    preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] })
    await waitReady(base, preview)
    try { browser = await chromium.launch({ headless: true }) } catch (error) { throw new Error(`Playwright Chromium unavailable; run "npx playwright install chromium": ${error.message}`) }
    const page = await browser.newPage({ viewport: narrow ? { width: 390, height: 844 } : { width: 1440, height: 900 } })
    await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
    const total = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    if (!total) throw new Error(`no registered presentation found for ${slug}`)
    const output = path.join(root, 'artifacts/inspection', `${slug}${narrow ? '-narrow' : ''}`); await mkdir(output, { recursive: true })
    for (let step = 0; step < total; step++) {
      if (step) { await page.keyboard.press('ArrowRight'); await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, step) }
      const settleStarted = Date.now()
      await page.waitForTimeout(settle)
      if (process.env.AND_SCENE_INSPECT_TRACE === '1') {
        const activeAnimations = await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)
        console.log(`CAPTURE step ${step} settled=${Date.now() - settleStarted}ms activeAnimations=${activeAnimations}`)
      }
      const report = await page.evaluate(() => {
        const allowed = (element) => Boolean(element.closest('[data-presentation-allow-overlap]'))
        const nodes = [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && e.textContent.trim() && getComputedStyle(e).display !== 'none' && !['arrow','frame'].includes(e.getAttribute('data-presentation-node'))).map((e) => { const range=document.createRange(); range.selectNodeContents(e); const r=range.getBoundingClientRect(); return { label: e.getAttribute('data-presentation-label') || e.getAttribute('data-presentation-node') || e.tagName.toLowerCase(), text: e.textContent.trim(), allowed: allowed(e), rect: { left:r.left,right:r.right,top:r.top,bottom:r.bottom } } })
        const active = [...document.querySelectorAll('[data-presentation-progress] [data-presentation-active="true"], [data-presentation-toc] [data-presentation-active="true"]')]
        const controls = active.map((el) => { const inactive = [...el.parentElement.querySelectorAll('button')].find((item) => item !== el); if (!inactive) return false; const a=getComputedStyle(el), b=getComputedStyle(inactive); return ['color','backgroundColor','borderColor','fontWeight','opacity','textDecorationLine'].every((key)=>a[key]===b[key]) })
        const link = document.querySelector('[data-presentation-attribution]'), s = link && getComputedStyle(link)
        return { overlaps: nodes, indistinct: controls.some(Boolean), attribution: link ? { fontSize:parseFloat(s.fontSize), defaultLike:s.textDecorationLine.includes('underline') || s.color==='rgb(0, 0, 238)' } : null }
      })
      for (const warning of findOverlaps(report.overlaps)) console.warn(`WARN step ${step}: overlapping text/chrome "${warning.first}" and "${warning.second}"`)
      if (report.indistinct) console.warn(`WARN step ${step}: active progress/ToC is indistinguishable from inactive controls`)
      for (const warning of attributionWarnings(report.attribution)) console.warn(`WARN step ${step}: ${warning}`)
      await page.screenshot({ path: path.join(output, `step-${String(step + 1).padStart(2, '0')}.png`), fullPage: true })
    }
    console.log(`PASS: captured ${total} settled step screenshots in ${output}`)
  } finally { await cleanup() }
}
if (import.meta.url === pathToFileURL(path.resolve(process.argv[1] || '')).href) inspect(parseInspectArgs(process.argv.slice(2))).catch((error) => { console.error(`FAIL [inspect]: ${error.message}`); process.exitCode = 1 })
