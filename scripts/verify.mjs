import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { canonicalSteps, findCanonicalStepEnd, sampleSlug } from './reference-sample.mjs'
import { buildApplication, projectRoot, withPreview } from './preview-server.mjs'
import { verifyPresentation } from './render-verification.mjs'

const root = resolve(process.env.AND_SCENE_ROOT || projectRoot)

async function validateReferenceFiles() {
  const [registry, steps] = await Promise.all([
    readFile(resolve(root, 'src/presentations/index.ts'), 'utf8'),
    readFile(resolve(root, `src/presentations/${sampleSlug}/steps/index.tsx`), 'utf8'),
  ])
  if (!registry.includes(`slug: '${sampleSlug}'`) || !registry.includes("title: 'How to Use This Skill to Make a Presentation'")) {
    throw new Error(`reference sample registration is missing or malformed: /${sampleSlug}`)
  }
  let cursor = -1
  for (let index = 0; index < canonicalSteps.length; index += 1) {
    const [era, title, caption] = canonicalSteps[index]
    const nextCursor = findCanonicalStepEnd(steps, [era, title, caption], cursor)
    if (nextCursor < 0) {
      throw new Error(`reference sample step ${index + 1} is missing or out of canonical order`)
    }
    cursor = nextCursor
  }
}

async function main() {
  await buildApplication(root)
  await validateReferenceFiles()
  await withPreview(root, renderReference)
}

async function renderReference(origin) {
  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const count = await verifyPresentation(page, `${origin}/${sampleSlug}`, {
      expectedCount: canonicalSteps.length,
      validateStep: async (page, index) => {
        const rendered = await page.evaluate(() => ['marker', 'title', 'caption'].map((hook) =>
          document.querySelector(`[data-presentation-${hook}]`)?.textContent))
        if (canonicalSteps[index].some((value, field) => value !== rendered[field])) {
          throw new Error(`reference sample step ${index + 1} is missing or out of canonical order in the browser`)
        }
      },
    })
    await page.close()
    console.log(`verify: PASS (${count} reference steps rendered)`)
  } finally {
    await browser?.close()
  }
}

main().catch((error) => {
  console.error(`verify: FAIL ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
