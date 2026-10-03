import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import ts from 'typescript'
import { readPresentationSlugs } from './presentation-registry.mjs'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const sampleSlug = 'how-to-make-a-presentation'
const titles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const captions = [
  'It starts with you, a topic, and mild overconfidence.',
  'One question at a time: the topic, the look, then each beat of the story.',
  'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  'Same shapes, new beats. Every answer extends the story without redrawing it.',
  'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  'Before saying done, it builds and renders every step — and fixes what breaks.',
  'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  'This presentation was built exactly this way. Thanks for watching.',
]

const readSampleSteps = (source) => {
  const file = ts.createSourceFile('steps/index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const text = (node) => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined
  const found = []
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'steps' || !declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) continue
      for (const entry of declaration.initializer.elements) {
        if (!ts.isObjectLiteralExpression(entry)) {
          found.push({ issue: `step ${found.length + 1} is not an object literal` })
          continue
        }
        const fields = {}
        for (const property of entry.properties) {
          if (ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) fields[property.name.text] = text(property.initializer)
        }
        const unreadable = ['id', 'title', 'caption'].filter((field) => fields[field] === undefined)
        found.push(unreadable.length
          ? { issue: `step ${found.length + 1} has non-literal or missing fields: ${unreadable.join(', ')}` }
          : { title: fields.title, caption: fields.caption })
      }
    }
  }
  return found
}
const fail = (phase, message) => { throw new Error(`${phase}: ${message}`) }
const failPreflight = (message) => { console.error(`FAIL: sample: ${message}`); process.exit(1) }
const registeredText = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
const registeredSlugs = readPresentationSlugs(registeredText)
const isReferenceApp = registeredSlugs.includes(sampleSlug)
const requestedSlug = process.argv[2]
if (requestedSlug && !registeredSlugs.includes(requestedSlug)) failPreflight(`unknown presentation slug "${requestedSlug}"; registered: ${registeredSlugs.join(', ') || '(none)'}`)
const slug = requestedSlug ?? (isReferenceApp ? sampleSlug : registeredSlugs[0])
const isReferenceSample = slug === sampleSlug
if (!slug) failPreflight('no presentations are registered')
if (isReferenceApp) {
  if (!registeredText.includes("import('./how-to-make-a-presentation/Talk')")) failPreflight(`reference sample is not registered at /${slug}`)
  let stepText
  try { stepText = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/index.ts', import.meta.url), 'utf8') } catch { failPreflight('reference sample step source is missing') }
  const parsedSteps = readSampleSteps(stepText)
  const malformedStep = parsedSteps.find((step) => step.issue)
  if (malformedStep) failPreflight(malformedStep.issue)
  if (parsedSteps.length !== 9) failPreflight(`expected 9 canonical steps, found ${parsedSteps.length}`)
  for (let i = 0; i < 9; i++) {
    const { title, caption } = parsedSteps[i]
    if (title !== titles[i] || caption !== captions[i]) failPreflight(`step ${i + 1} does not match canonical title/caption order; got "${title}"`)
  }
}

const runBuild = () => new Promise((resolve, reject) => {
  const child = spawn('npm', ['run', 'build'], { cwd: appRoot, stdio: 'inherit', shell: process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`npm run build exited ${code}`)))
})
const availablePort = async () => {
  const probe = createServer()
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve) })
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}

let server
let browser
let phase = 'build'
let currentStep = 1
try {
  await runBuild()
  phase = 'preview'
  const port = await availablePort()
  server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: appRoot, stdio: 'ignore' })
  const url = `http://127.0.0.1:${port}/${slug}`
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) fail('preview', 'vite preview exited before becoming ready')
    try { ready = (await fetch(url)).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) fail('preview', `vite preview did not become ready at ${url}`)
  phase = 'browser'
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(`step ${currentStep}: uncaught page error: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${currentStep}: console error: ${message.text()}`) })
  await page.goto(url, { waitUntil: 'networkidle' })
  const footer = page.locator('[data-presentation-footer]')
  try { await footer.waitFor({ timeout: 5000 }) } catch { fail('browser', `no presentation rendered at /${slug}`) }
  const count = Number(await footer.getAttribute('data-step-count'))
  if (!count || (isReferenceSample && count !== titles.length)) fail('browser', `step count hook reports ${count}${isReferenceSample ? `; expected ${titles.length}` : ''}`)
  for (let index = 0; index < count; index++) {
    currentStep = index + 1
    await footer.waitFor({ state: 'visible' })
    await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation-footer]')?.getAttribute('data-step-index')) === expected, index)
    const actualTitle = await page.locator('[data-presentation-step-title]').textContent()
    if (!actualTitle || (isReferenceSample && actualTitle !== titles[index])) fail('browser', `step ${index + 1} title mismatch: ${actualTitle}`)
    if (errors.length) fail('browser', errors.join('; '))
    if (index + 1 < count) {
      await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation-footer]')?.getAttribute('data-step-index')) === expected, index + 1, { timeout: 5000 }) }
      catch { fail('browser', `step ${index + 2} transition did not advance from step ${index + 1}`) }
    }
  }
  await page.waitForTimeout(650)
  if (errors.length) fail('browser', errors.join('; '))
  console.log(isReferenceSample
    ? `PASS: /${slug} matches the canonical nine-step outline and renders every step in Chromium`
    : `PASS: /${slug} renders every registered starter step in Chromium`)
} catch (error) {
  const message = error.message.startsWith(`${phase}: `) ? error.message : `${phase}: ${error.message}`
  console.error(`FAIL: ${message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && server.exitCode === null) {
    await new Promise((resolve) => { server.once('exit', resolve); if (server.exitCode === null) server.kill('SIGTERM'); else resolve() })
  }
}
