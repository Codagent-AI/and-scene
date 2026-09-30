import { chromium, type Browser } from 'playwright'
import { createServer, type ViteDevServer } from 'vite'

const narrowViewport = { width: 390, height: 844 }

describe('reference presentation responsive composition', () => {
  let browser: Browser
  let server: ViteDevServer
  let baseUrl: string

  beforeAll(async () => {
    server = await createServer({
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0 },
    })
    await server.listen()
    const resolvedUrl = server.resolvedUrls?.local[0]
    if (!resolvedUrl) throw new Error('Vite did not expose a local test URL.')
    baseUrl = resolvedUrl
    browser = await chromium.launch({ headless: true })
  })

  afterAll(async () => {
    await browser?.close()
    await server?.close()
  })

  it('AT-003 keeps essential dense-scene labels readable without overlap at 390px', async () => {
    const page = await browser.newPage({ viewport: narrowViewport })
    await page.goto(new URL('how-to-make-a-presentation', baseUrl).href, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Step 7: It checks its own work' }).click()
    await page.waitForFunction(
      () => document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index') === '6',
    )
    await page.waitForTimeout(600)

    const result = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')
      if (!canvas) throw new Error('Presentation canvas is missing.')
      const scale = new DOMMatrixReadOnly(getComputedStyle(canvas).transform).a
      const essentialLabels = [
        ...document.querySelectorAll<HTMLElement>(
          '.how-person, .how-skill, .how-prompt, .how-question, .how-card strong, .how-kit, .how-verify, .how-pass',
        ),
      ].map((element) => ({
        renderedFontSize: Number.parseFloat(getComputedStyle(element).fontSize) * scale,
        text: element.textContent?.trim(),
      }))
      const cardDetailsHidden = [...document.querySelectorAll<HTMLElement>('.how-card > span:not(.how-edited)')]
        .every((element) => getComputedStyle(element).display === 'none')
      const question = document.querySelector<HTMLElement>('.how-question')?.getBoundingClientRect()
      const skill = document.querySelector<HTMLElement>('.how-skill')?.getBoundingClientRect()
      const sceneKit = document.querySelector<HTMLElement>('.how-kit')?.getBoundingClientRect()
      const verify = document.querySelector<HTMLElement>('.how-verify')?.getBoundingClientRect()

      return {
        cardDetailsHidden,
        essentialLabels,
        noQuestionSkillOverlap: Boolean(question && skill && question.right <= skill.left),
        noSceneKitVerifyOverlap: Boolean(sceneKit && verify && sceneKit.right <= verify.left),
      }
    })

    expect(result.essentialLabels.length).toBeGreaterThan(0)
    expect(result.essentialLabels).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: '1. topic' }),
      expect.objectContaining({ text: 'verify' }),
      expect.objectContaining({ text: 'build + render ✓' }),
    ]))
    expect(result.essentialLabels.every(({ renderedFontSize }) => renderedFontSize >= 9)).toBe(true)
    expect(result.cardDetailsHidden).toBe(true)
    expect(result.noQuestionSkillOverlap).toBe(true)
    expect(result.noSceneKitVerifyOverlap).toBe(true)

    await page.close()
  }, 30_000)
})
