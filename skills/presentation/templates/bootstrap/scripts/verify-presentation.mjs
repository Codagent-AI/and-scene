import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { validateRegistration } from './sample-outline.mjs'

const root = path.resolve(process.env.AND_SCENE_ROOT || process.cwd())
const args = process.argv.slice(2)
const smoke = args.includes('--smoke')
const pick = (name) => { const at = args.indexOf(name); return at < 0 ? undefined : args[at + 1] }
const unknown = args.filter((arg, index) => !['--smoke', '--presentation'].includes(arg) && args[index - 1] !== '--presentation' && args[index - 1] !== '--smoke')
if (unknown.length || (args.includes('--presentation') && !pick('--presentation'))) throw new Error('Usage: verify-presentation.mjs [--presentation <slug>] [--smoke [slug]]')
const requestedSlug = pick('--presentation') || (smoke ? pick('--smoke') : undefined)
function fail(phase, message) { throw new Error(`[${phase}] ${message}`) }
async function run(command, commandArgs) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: root, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code ?? signal}`)))
  })
}
async function registeredSlugs() {
  const registryPath = path.join(root, 'src/presentations/index.ts')
  const sourceText = await readFile(registryPath, 'utf8').catch(() => fail('registry', 'src/presentations/index.ts is missing'))
  const ts = createRequire(path.join(root, 'package.json'))('typescript')
  const source = ts.createSourceFile(registryPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const declaration = source.statements.find((statement) => ts.isVariableStatement(statement) && statement.declarationList.declarations.some((item) => ts.isIdentifier(item.name) && item.name.text === 'presentations'))
  const initializer = declaration?.declarationList.declarations.find((item) => ts.isIdentifier(item.name) && item.name.text === 'presentations')?.initializer
  if (source.parseDiagnostics.length || !initializer || !ts.isArrayLiteralExpression(initializer)) fail('registry', 'presentation registry is malformed')
  const slugs = initializer.elements.flatMap((entry) => {
    if (!ts.isObjectLiteralExpression(entry)) return []
    const slugProp = entry.properties.find((property) => ts.isPropertyAssignment(property) && property.name.getText(source).replaceAll(/["']/g, '') === 'slug')
    return slugProp && ts.isStringLiteral(slugProp.initializer) ? [slugProp.initializer.text] : []
  })
  if (!slugs.length) fail('registry', 'presentation registry has no registered routes')
  return slugs
}
async function render(slugs) {
  const require = createRequire(path.join(root, 'package.json'))
  const { chromium } = require('playwright')
  const port = await import('node:net').then(({ createServer }) => new Promise((resolve, reject) => {
    const server = createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const value = server.address().port; server.close(() => resolve(value)) })
  }))
  const base = `http://127.0.0.1:${port}`
  let preview, browser
  const errors = []
  try {
    preview = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
    for (let attempt = 0; attempt < 100; attempt++) {
      if (preview.exitCode !== null) fail('render', 'vite preview exited before readiness')
      try { if ((await fetch(`${base}/`)).ok) break } catch {}
      if (attempt === 99) fail('render', 'preview readiness timed out')
      await delay(100)
    }
    browser = await chromium.launch({ headless: true })
    for (const slug of slugs) {
      const page = await browser.newPage()
      page.on('console', (message) => { if (message.type() === 'error' && !/favicon/i.test(message.text())) errors.push(message.text()) })
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
      const chrome = page.locator('[data-presentation-chrome]')
      await chrome.waitFor({ state: 'visible' })
      const count = Number(await chrome.getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) fail('render', `${slug}: invalid step count ${count}`)
      const stepsToCheck = smoke ? 1 : count
      for (let index = 0; index < stepsToCheck; index++) {
        const actual = Number(await chrome.getAttribute('data-step-index'))
        if (actual !== index) fail('render', `${slug}, step ${index + 1}: expected index ${index}, got ${actual}`)
        if (await chrome.getAttribute('data-presentation-mode') === 'present') {
          await page.keyboard.press('p')
          await page.waitForFunction(() => document.querySelector('[data-presentation-chrome]')?.getAttribute('data-presentation-mode') === 'browse')
        }
        const caption = (await page.locator('[data-presentation-caption]').innerText().catch(() => '')).trim()
        if (!caption) fail('render', `${slug}, step ${index + 1}: caption is missing in browse mode`)
        const title = (await page.locator('[data-presentation-title]').innerText().catch(() => '')).trim()
        if (!title) fail('render', `${slug}, step ${index + 1}: title is missing`)
        if (errors.length) fail('render', `${slug}, step ${index + 1}: ${errors.shift()}`)
        if (index + 1 < stepsToCheck) {
          if (index === 0) await page.locator('[data-presentation-next]').click()
          else await page.keyboard.press('ArrowRight')
          await page.waitForFunction((next) => Number(document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index')) === next, index + 1, { timeout: 5000 }).catch((error) => fail('render', `${slug}, step ${index + 2}: navigation did not advance (${error.message.split('\n')[0]})`))
        }
      }
      if (errors.length) fail('render', `${slug}: ${errors[0]}`)
      if (!smoke && count > 1) {
        await page.locator('[data-presentation-prev]').click()
        await page.waitForFunction((previous) => Number(document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index')) === previous, count - 2, { timeout: 5000 }).catch((error) => fail('render', `${slug}: Previous did not return to step ${count - 1} (${error.message.split('\n')[0]})`))
      }
      console.log(`[render] PASS ${slug} (${smoke ? 'first-step smoke' : `${count} steps`})`)
      await page.close()
    }
  } finally {
    await browser?.close().catch(() => {})
    if (preview && preview.exitCode === null) { preview.kill('SIGTERM'); await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)]); if (preview.exitCode === null) preview.kill('SIGKILL') }
  }
}
try {
  console.log('[build] running npm run build')
  await run('npm', ['run', 'build'])
  const registered = await registeredSlugs()
  const slugs = requestedSlug ? [requestedSlug] : registered
  for (const slug of slugs) await validateRegistration(root, slug)
  if (requestedSlug && !registered.includes(requestedSlug)) fail('registry', `${requestedSlug} is not registered`)
  console.log(`[registry] PASS (${slugs.join(', ')})`)
  await render(slugs)
  console.log('VERIFY PASS: build, registered routes, render')
} catch (error) {
  console.error(`VERIFY FAIL: ${error.message}`)
  process.exitCode = 1
}
