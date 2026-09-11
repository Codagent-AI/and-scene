import { createServer } from 'node:net'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const slug = 'how-to-make-a-presentation'
const expectedSteps = [
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

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: process.platform === 'win32' })
    let output = ''
    child.stdout?.on('data', (chunk) => { output += chunk })
    child.stderr?.on('data', (chunk) => { output += chunk })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}\n${output}`))
    })
  })
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close((error) => error ? reject(error) : resolve(address.port))
    })
  })
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // The preview process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

function stopProcess(child) {
  if (!child?.pid || child.exitCode !== null) return
  try {
    child.kill('SIGTERM')
  } catch {
    child.kill()
  }
}

async function assertReferenceSource() {
  let registry
  let steps
  try {
    const source = await Promise.all([
      readFile('src/presentations/index.ts', 'utf8'),
      readFile('src/presentations/how-to-make-a-presentation/steps/index.tsx', 'utf8'),
    ])
    registry = source[0]
    steps = source[1]
  } catch (error) {
    throw new Error(`reference sample is missing or malformed: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (!registry.includes(`slug: '${slug}'`)) throw new Error('reference sample is not registered')
  const hasProperty = (property, value, from = 0) => {
    return steps.indexOf(`${property}: '${value}'`, from) >= 0 || steps.indexOf(`${property}: "${value}"`, from) >= 0
  }
  let previousPosition = -1
  for (const [era, title, caption] of expectedSteps) {
    const singleQuotedTitle = `title: '${title}'`
    const doubleQuotedTitle = `title: "${title}"`
    const singlePosition = steps.indexOf(singleQuotedTitle, previousPosition + 1)
    const doublePosition = steps.indexOf(doubleQuotedTitle, previousPosition + 1)
    const position = singlePosition >= 0 && (doublePosition < 0 || singlePosition < doublePosition) ? singlePosition : doublePosition
    if (position < 0) throw new Error(`reference sample is missing title: ${title}`)
    if (!hasProperty('caption', caption, position)) throw new Error(`reference sample is missing caption for: ${title}`)
    if (!hasProperty('era', era, previousPosition + 1)) throw new Error(`reference sample is missing era for: ${title}`)
    previousPosition = position
  }
}

async function verifyBrowser() {
  const port = await availablePort()
  const origin = `http://${host}:${port}`
  const preview = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], {
    stdio: 'ignore',
  })
  let browser
  try {
    await waitFor(`${origin}/`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const browserErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(`console error: ${message.text()}`)
    })
    page.on('pageerror', (error) => browserErrors.push(`page error: ${error.message}`))

    await page.goto(`${origin}/${slug}`, { waitUntil: 'networkidle' })
    const presentation = page.locator('[data-presentation]')
    if (await presentation.count() !== 1) throw new Error(`route /${slug} did not render a presentation`)
    const chrome = page.locator('[data-step-count][data-step-index]')
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (count !== expectedSteps.length) throw new Error(`reference sample exposes ${count} steps, expected ${expectedSteps.length}`)

    for (let index = 0; index < count; index += 1) {
      const observed = Number(await chrome.getAttribute('data-step-index'))
      if (observed !== index) throw new Error(`step ${index + 1}: expected index ${index}, got ${observed}`)
      if (browserErrors.length) throw new Error(`step ${index + 1}: ${browserErrors.join('; ')}`)
      const title = await page.locator('[data-presentation-step-title]').textContent()
      const caption = await page.locator('[data-presentation-caption]').textContent()
      if (title?.trim() !== expectedSteps[index][1]) throw new Error(`step ${index + 1}: unexpected title ${JSON.stringify(title)}`)
      if (caption?.trim() !== expectedSteps[index][2]) throw new Error(`step ${index + 1}: unexpected caption ${JSON.stringify(caption)}`)
      if (index < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(750)
        const nextIndex = Number(await chrome.getAttribute('data-step-index'))
        if (nextIndex !== index + 1) throw new Error(`step ${index + 1}: transition stopped at ${nextIndex}`)
      }
    }
    if (browserErrors.length) throw new Error(`step ${count}: ${browserErrors.join('; ')}`)
  } finally {
    await browser?.close()
    stopProcess(preview)
  }
}

async function main() {
  await assertReferenceSource()
  try {
    await run('npm', ['run', 'build'])
  } catch (error) {
    throw new Error(`build verification failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  try {
    await verifyBrowser()
  } catch (error) {
    throw new Error(`browser verification failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  console.log(`verify: PASS (${expectedSteps.length} steps on ${host})`)
}

try {
  await main()
} catch (error) {
  console.error(`verify: FAIL ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
