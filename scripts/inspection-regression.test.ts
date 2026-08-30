import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test, vi } from 'vitest'
import { waitForPreview } from './preview-server.mjs'

const root = resolve(import.meta.dirname, '..')
const read = (file: string) => readFileSync(resolve(root, file), 'utf8')

test('verification and inspection share the preview lifecycle helper', () => {
  const helper = 'scripts/preview-server.mjs'
  const templateHelper = 'skills/presentation/templates/bootstrap/scripts/preview-server.mjs'

  expect(existsSync(resolve(root, helper))).toBe(true)
  expect(existsSync(resolve(root, templateHelper))).toBe(true)
  expect(read(templateHelper)).toBe(read(helper))

  for (const script of [
    'scripts/inspect-presentation.mjs',
    'scripts/verify.mjs',
    'skills/presentation/templates/bootstrap/scripts/inspect-presentation.mjs',
    'skills/presentation/templates/bootstrap/scripts/verify.mjs',
  ]) {
    const source = read(script)
    expect(source).toContain("from './preview-server.mjs'")
    expect(source).not.toContain('function getAvailablePort')
    expect(source).not.toContain('function watchPreview')
    expect(source).not.toContain('function waitForPreview')
  }
})

test('readiness polling bounds stalled HTTP responses and the overall wait', async () => {
  const fetchMock = vi.fn((_url: string, options?: { signal?: AbortSignal }) => new Promise<Response>((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true })
  }))
  vi.stubGlobal('fetch', fetchMock)

  try {
    const polling = waitForPreview('http://127.0.0.1:1/', () => undefined, {
      overallTimeoutMs: 40,
      pollIntervalMs: 1,
      requestTimeoutMs: 10,
    }).then(() => 'ready', () => 'timed-out')
    const outcome = await Promise.race([
      polling,
      new Promise<'hung'>((resolveHung) => setTimeout(() => resolveHung('hung'), 100)),
    ])

    expect(outcome).toBe('timed-out')
    expect(fetchMock).toHaveBeenCalled()
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
  } finally {
    vi.unstubAllGlobals()
  }
})

test('overlap diagnostics include direct text nodes and use spatial buckets', async () => {
  const helper = resolve(root, 'scripts/inspection-diagnostics.mjs')
  const templateHelper = resolve(root, 'skills/presentation/templates/bootstrap/scripts/inspection-diagnostics.mjs')

  expect(existsSync(helper)).toBe(true)
  expect(existsSync(templateHelper)).toBe(true)
  if (!existsSync(helper) || !existsSync(templateHelper)) return

  const source = readFileSync(helper, 'utf8')
  expect(readFileSync(templateHelper, 'utf8')).toBe(source)
  expect(source).toContain('document.createTreeWalker')
  expect(source).toContain('const buckets = new Map()')

  const { textOverlapWarnings } = await import(pathToFileURL(helper).href) as {
    textOverlapWarnings: (index: number) => string[]
  }
  document.body.innerHTML = '<main data-presentation><p>Start <strong>important</strong> end</p><span>collision</span></main>'
  const rectangles = new Map([
    ['Start', { bottom: 10, height: 10, left: 0, right: 50, top: 0, width: 50 }],
    ['important', { bottom: 10, height: 10, left: 60, right: 100, top: 0, width: 40 }],
    ['end', { bottom: 10, height: 10, left: 110, right: 140, top: 0, width: 30 }],
    ['collision', { bottom: 10, height: 10, left: 0, right: 50, top: 0, width: 50 }],
  ])
  const originalGetClientRects = Range.prototype.getClientRects
  Object.defineProperty(Range.prototype, 'getClientRects', {
    configurable: true,
    value(this: Range) {
      const label = this.startContainer.textContent?.trim() ?? ''
      const rectangle = rectangles.get(label)
      return rectangle ? [rectangle] : []
    },
  })
  vi.stubGlobal('getComputedStyle', () => ({ display: 'block', opacity: '1', visibility: 'visible' }))

  try {
    expect(textOverlapWarnings(0)).toContain('step 1: visible overlap between Start and collision')
  } finally {
    document.body.innerHTML = ''
    if (originalGetClientRects) {
      Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: originalGetClientRects })
    } else {
      delete (Range.prototype as Range & { getClientRects?: () => DOMRectList }).getClientRects
    }
    vi.unstubAllGlobals()
  }
})

test('inspection builds fresh assets, rejects unsafe slugs, and retains preview exit state', () => {
  const source = read('scripts/inspect-presentation.mjs')

  expect(source).toContain("await run('npm', ['run', 'build'])")
  expect(source).toContain("if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))")
  expect(source).toContain("previewExited = once(preview, 'exit').catch(() => undefined)")
  expect(source).toContain("if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')")
})

test('verification cleanup waits for the exit event captured at preview startup', () => {
  const source = read('scripts/verify.mjs')

  expect(source).toContain("previewExited = once(preview, 'exit').catch(() => undefined)")
  expect(source).toContain("if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')")
})

test('the narrow layout removes the table of contents instead of overlapping the mode toggle', () => {
  const stylesheet = read('src/presentations/how-to-make-a-presentation/presentation.css')

  expect(stylesheet).toMatch(/\[data-presentation-toc\]\s*\{\s*display:\s*none;/)
})
