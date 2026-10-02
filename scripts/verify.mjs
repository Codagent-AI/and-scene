import { setTimeout as delay } from 'node:timers/promises'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import ts from 'typescript'
import { registeredSlugs, startPreview } from './preview-utils.mjs'

const slug = 'how-to-make-a-presentation'
const title = 'How to Use This Skill to Make a Presentation'
const beats = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

let server
let browser
try {
  const slugs = await registeredSlugs(new URL('../src/presentations/index.ts', import.meta.url))
  if (!slugs.includes(slug)) throw new Error(`reference sample is missing from the explicit registry: ${slug}`)
  const [registry, steps] = await Promise.all([
    readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/index.ts', import.meta.url), 'utf8'),
  ])
  if (!registry.includes(`title: '${title}'`) || !registry.includes(`import('./how-to-make-a-presentation/Talk')`)) throw new Error('reference sample registry title or loader is malformed')
  const stepSource = ts.createSourceFile('steps/index.ts', steps, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let actualBeats
  const findBeats = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'beats' && node.initializer) {
      let initializer = node.initializer
      while (ts.isAsExpression(initializer) || ts.isTypeAssertionExpression(initializer) || ts.isParenthesizedExpression(initializer)) initializer = initializer.expression
      if (ts.isArrayLiteralExpression(initializer)) actualBeats = initializer.elements.map((entry) => ts.isArrayLiteralExpression(entry) ? entry.elements.map((item) => ts.isStringLiteral(item) || ts.isNoSubstitutionTemplateLiteral(item) ? item.text : null) : null)
    }
    ts.forEachChild(node, findBeats)
  }
  findBeats(stepSource)
  if (JSON.stringify(actualBeats) !== JSON.stringify(beats)) throw new Error('reference era, title, caption, or order does not match the canonical nine-step outline')

  server = await startPreview()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  let currentStep = 1
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto(`http://${server.host}:${server.port}/${slug}`)
  if (!response?.ok()) throw new Error(`sample route returned HTTP ${response?.status() ?? 'no response'} at step 1`)
  await page.locator('[data-presentation]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (count !== 9) throw new Error(`sample route reported ${count} steps; expected 9 (step 1)`)
  for (let index = 0; index < count; index++) {
    currentStep = index + 1
    try {
      await page.waitForFunction((expected) => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(expected), index, { timeout: 10_000 })
      await delay(720)
      if (errors.length) throw new Error(errors.splice(0).join('; '))
      if (index < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((expected) => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(expected), index + 1, { timeout: 3_000 })
      }
    } catch (error) { throw new Error(`browser render/transition failed at step ${currentStep}: ${error.message}`) }
  }
  console.log(`PASS: ${title} rendered all 9 steps at http://${server.host}:${server.port}/${slug}`)
} catch (error) {
  console.error(`FAIL: verification: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await server?.close()
}
