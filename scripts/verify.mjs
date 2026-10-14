import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import ts from 'typescript'
import { chromium } from 'playwright'

// Reference requirements are project data, never baked into this distributable driver.
let phase = 'build'
let step
let slug
let preview
let browser
let build
let previewOutput = ''

function fail(message) { throw new Error(message) }
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  const exited = once(child, 'exit')
  child.kill('SIGTERM')
  const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
  try { await exited } finally { clearTimeout(timer) }
}
async function cleanup() {
  try { await browser?.close() } finally { await stop(preview); await stop(build) }
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  console.error(`FAIL phase=${phase}${step === undefined ? '' : ` step=${step}`} interrupted by ${signal}`)
  await cleanup()
  process.exit(1)
})

async function availablePort() {
  const server = createServer()
  const requested = process.env.VERIFY_PORT === undefined ? 0 : Number(process.env.VERIFY_PORT)
  if (!Number.isInteger(requested) || requested < 0 || requested > 65535) fail('Invalid VERIFY_PORT')
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(requested, '127.0.0.1', resolve) })
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}

function registeredSlugs(source) {
  const file = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true)
  const slugs = []
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(file) !== 'presentations') continue
      let value = declaration.initializer
      while (value && (ts.isAsExpression(value) || ts.isSatisfiesExpression(value) || ts.isParenthesizedExpression(value))) value = value.expression
      if (!value || !ts.isArrayLiteralExpression(value)) fail('Registry must be an explicit presentations array')
      for (const entry of value.elements) {
        if (!ts.isObjectLiteralExpression(entry)) fail('Registry entries must be explicit objects')
        const prop = entry.properties.find(prop => ts.isPropertyAssignment(prop) && prop.name.getText(file).replace(/['"]/g, '') === 'slug')
        if (!prop || !ts.isStringLiteral(prop.initializer)) fail('Registry entries need literal slugs')
        slugs.push(prop.initializer.text)
      }
    }
  }
  return slugs
}

try {
  build = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } })
  const [code] = await once(build, 'exit')
  if (code !== 0) fail(`npm run build exited ${code}`)

  phase = 'sample'
  const config = JSON.parse(await readFile('verify.config.json', 'utf8'))
  if (!Array.isArray(config.referencePresentations)) fail('referencePresentations must be an array')
  const references = config.referencePresentations
  const registry = registeredSlugs(await readFile('src/presentations/index.ts', 'utf8'))
  for (const reference of references) {
    if (!reference || typeof reference.slug !== 'string' || !Array.isArray(reference.steps) || !reference.steps.length || reference.steps.some(item => !item || typeof item.title !== 'string' || typeof item.caption !== 'string')) fail('Malformed reference presentation config')
    if (!registry.includes(reference.slug)) fail(`Reference ${reference.slug} is absent from the registry`)
  }

  phase = 'render'
  const port = await availablePort()
  const origin = `http://127.0.0.1:${port}`
  console.log(`Preview ${origin}`)
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_ENV: 'production' } })
  preview.stdout.on('data', data => { previewOutput += data })
  preview.stderr.on('data', data => { previewOutput += data })
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (preview.exitCode !== null) fail(`Preview exited: ${previewOutput}`)
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(500) })).ok } catch { /* not ready yet */ }
    if (ready) break
    await delay(150)
  }
  if (!ready) fail(`Preview did not become ready: ${previewOutput}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(5000)
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  function checkErrors() {
    if (errors.length) { phase = 'render'; fail(errors.join('\n')) }
  }
  await page.goto(origin)
  await page.waitForTimeout(900)
  checkErrors()
  const routes = [...new Set(await page.locator('[data-presentation-link]').evaluateAll(links => links.map(link => new URL(link.getAttribute('href'), location.href).pathname.replace(/^\//, '').replace(/\/$/, ''))))]
  phase = 'sample'
  for (const reference of references) if (!routes.includes(reference.slug)) fail(`Reference ${reference.slug} is absent from landing links`)
  for (const registered of registry) if (!routes.includes(registered)) fail(`Registered presentation ${registered} is absent from landing links`)
  for (slug of routes) {
    phase = 'render'
    step = 0
    const reference = references.find(item => item.slug === slug)
    await page.goto(`${origin}/${slug}`)
    const chrome = page.locator('[data-presentation-chrome]')
    try { await chrome.waitFor() } catch (error) { checkErrors(); throw error }
    if (await chrome.getAttribute('data-presentation-mode') === 'present') await page.keyboard.press('p')
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isSafeInteger(count) || count < 1) fail(`Invalid step count: ${count}`)
    if (reference && count !== reference.steps.length) { phase = 'sample'; fail(`Expected ${reference.steps.length} steps, got ${count}`) }
    for (step = 0; step < count; step++) {
      if (step > 0) {
        phase = 'transition'
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(expected => document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index') === String(expected), step, { timeout: 3000 })
        } catch { checkErrors(); fail(`Step failed to advance to ${step}`) }
      }
      // Settle layout + delayed entry animations, and catch effect/asynchronous errors.
      await page.waitForTimeout(900)
      checkErrors()
      phase = 'transition'
      const actual = await chrome.getAttribute('data-step-index')
      if (actual !== String(step)) fail(`Expected index ${step}, got ${actual}`)
      if (reference) {
        phase = 'sample'
        for (const field of ['title', 'caption']) {
          const actualText = await page.locator(`[data-presentation-${field}]`).textContent()
          if (actualText !== reference.steps[step][field]) fail(`${field} mismatch: expected ${JSON.stringify(reference.steps[step][field])}, got ${JSON.stringify(actualText)}`)
        }
      }
      console.log(`${slug} step ${step} OK`)
    }
  }
  console.log(`PASS build, sample, render, transition (${routes.length} presentations)`)
} catch (error) {
  console.error(`FAIL phase=${phase}${slug ? ` route=${slug}` : ''}${step === undefined ? '' : ` step=${step}`}: ${error.message}`)
  process.exitCode = 1
} finally {
  await cleanup()
}
