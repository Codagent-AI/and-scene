import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { preview, browser, stop } from './browser-utils.mjs'
import { registeredSlugs } from './registry.mjs'
// `--require-sample` (set by this repository's root `npm run verify`) additionally requires the canonical nine-step
// reference sample. Scaffolded projects omit it and verify whichever presentations they have registered.
const requireSample = process.argv.includes('--require-sample')
const expected = [
 ['You have a topic','It starts with you, a topic, and mild overconfidence.'],
 ['The skill interviews you','One question at a time: the topic, the look, then each beat of the story.'],
 ['Answers become steps','Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
 ['The deck grows','Same shapes, new beats. Every answer extends the story without redrawing it.'],
 ['You set the depth','Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
 ['It assembles the scene','Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
 ['It checks its own work','Before saying done, it builds and renders every step — and fixes what breaks.'],
 ['Changed your mind? Loop it.','Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
 ["You're looking at one",'This presentation was built exactly this way. Thanks for watching.']
]
let server, instance, step = 0, phase = 'build'
async function verifyRegistered(page, errors, base) {
 phase = 'presentations'; let slugs = []
 try { slugs = registeredSlugs(readFileSync('src/presentations/index.ts', 'utf8')) } catch { /* reported below */ }
 if (!slugs.length) throw Error('no presentation is registered in src/presentations/index.ts; create and register one')
 let steps = 0
 for (const slug of slugs) {
  phase = `presentation ${slug}`; await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]'); try { await root.waitFor({ state: 'attached', timeout: 10000 }) } catch (error) { if (errors.length) { phase = `${slug} step 1`; throw Error(errors.join('; ')) } throw Error(`registered presentation "${slug}" did not render: ${error.message}`) }
  const count = Number(await root.getAttribute('data-step-count')); if (!Number.isInteger(count) || count < 1) throw Error(`presentation "${slug}" reports no steps`)
  for (step = 0; step < count; step++) { phase = `${slug} step ${step + 1}`; if (step) await page.keyboard.press('ArrowRight'); await page.waitForTimeout(700); if (errors.length) throw Error(errors.join('; ')); const index = await root.getAttribute('data-step-index'); if (index !== String(step)) throw Error(`transition failed: index ${index}`); if (!(await page.locator('[data-presentation-footer] h1').textContent())?.trim()) throw Error('step has no title'); steps++ }
 }
 console.log(`PASS: build and ${steps} steps across ${slugs.length} registered presentation(s)`)
}
try {
 const build = spawnSync('npm', ['run','build'], { stdio: 'inherit' }); if (build.status !== 0) throw Error('build failed')
 phase = 'preview'; const p = await preview(); server = p.server; instance = await browser(); const page = await instance.newPage(); const errors = []
 page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) }); page.on('pageerror', error => errors.push(error.message))
 if (!requireSample) await verifyRegistered(page, errors, p.base)
 else {
 phase = 'sample'; await page.goto(`${p.base}/how-to-make-a-presentation`, { waitUntil: 'networkidle' })
 const root = page.locator('[data-presentation]'); try { await root.waitFor({ state: 'attached', timeout: 10000 }) } catch (error) { if (errors.length) { phase = 'step 1'; throw Error(errors.join('; ')) } throw error } if (await root.count() !== 1 || await root.getAttribute('data-step-count') !== '9') throw Error('reference sample missing or malformed')
 for (step=0;step<expected.length;step++) { phase = `step ${step+1}`; if (step) await page.keyboard.press('ArrowRight'); await page.waitForTimeout(700); if (errors.length) throw Error(errors.join('; ')); const index = await root.getAttribute('data-step-index'); const title = await page.locator('[data-presentation-footer] h1').textContent(); const caption = await page.locator('[data-presentation-caption]').textContent(); if (index !== String(step)) throw Error(`transition failed: index ${index}`); if (title !== expected[step][0] || caption !== expected[step][1]) throw Error('sample title or caption mismatch'); if (errors.length) throw Error(errors.join('; ')) }
 console.log('PASS: build and all nine sample steps')
 }
} catch(error) { console.error(`FAIL: ${phase}: ${error.message}`); process.exitCode = 1 } finally { await stop(server, instance) }
