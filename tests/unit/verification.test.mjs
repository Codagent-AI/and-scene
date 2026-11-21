import { EventEmitter } from 'node:events'
import { describe, expect, test } from 'vitest'
import { recordPageErrors, validateSlug } from '../../scripts/presentation-page.mjs'
import { referenceOutline, validateOutlineCount, validateOutlineStep } from '../../scripts/reference-outline.mjs'
import { diagnoseVisualEvidence } from '../../scripts/visual-diagnostics.mjs'

const [era, title, caption] = referenceOutline[0]
const firstStep = { era, title, caption }

describe('reference outline validation', () => {
  test('accepts every normative entry and refuses missing or unexpected counts', () => {
    expect(() => validateOutlineCount(9)).not.toThrow()
    for (const [index, [era, title, caption]] of referenceOutline.entries()) {
      expect(() => validateOutlineStep(index, { era, title, caption })).not.toThrow()
    }
    expect(() => validateOutlineCount(8)).toThrow('requires 9 steps, received 8')
    expect(() => validateOutlineCount(10)).toThrow('requires 9 steps, received 10')
    expect(() => validateOutlineStep(9, firstStep)).toThrow('unexpected outline entry')
  })

  test('rejects out-of-order entries and missing or changed fields', () => {
    const [nextEra, nextTitle, nextCaption] = referenceOutline[1]
    expect(() => validateOutlineStep(0, {
      era: nextEra, title: nextTitle, caption: nextCaption,
    })).toThrow('mismatch for title')
    for (const field of ['era', 'title', 'caption']) {
      expect(() => validateOutlineStep(0, { ...firstStep, [field]: null }))
        .toThrow(`mismatch for ${field}`)
    }
  })

  test('a route slug cannot escape the local route or artifact directory', () => {
    expect(validateSlug('how-to-make-a-presentation')).toBe('how-to-make-a-presentation')
    for (const value of ['../private', 'https://outside.invalid/', 'nested/route', '', '--width']) {
      expect(() => validateSlug(value)).toThrow('presentation slug')
    }
  })
})

test('collects both uncaught page errors and console errors while ignoring other console events', () => {
  const page = new EventEmitter()
  const messages = recordPageErrors(page)
  page.emit('console', { type: () => 'warning', text: () => 'advisory only' })
  page.emit('pageerror', new Error('uncaught fixture'))
  page.emit('console', { type: () => 'error', text: () => 'console fixture' })
  expect(messages).toEqual(['page error: uncaught fixture', 'console error: console fixture'])
})

describe('visual diagnostics', () => {
  test('warns for indistinct table-of-contents selection and a missing attribution', () => {
    expect(diagnoseVisualEvidence({
      elements: [],
      navigation: [{ label: 'table-of-contents entry', active: 'plain', inactive: ['plain'] }],
      attribution: null,
    })).toEqual([
      'indistinct active table-of-contents entry',
      'missing attribution; check [data-presentation-attribution]',
    ])
  })

  test('a distinct current style and legible local attribution emit no warnings', () => {
    expect(diagnoseVisualEvidence({
      elements: [],
      navigation: [{ label: 'progress indicator', active: 'bold', inactive: ['plain'] }],
      attribution: { fontSize: 14, color: 'rgb(60, 40, 20)', decoration: 'underline' },
    })).toEqual([])
  })

  test('warns about a browser-default visited attribution even when large enough', () => {
    expect(diagnoseVisualEvidence({
      elements: [],
      navigation: [],
      attribution: { fontSize: 16, color: 'rgb(85, 26, 139)', decoration: 'underline' },
    })).toEqual(['browser-default attribution; style [data-presentation-attribution]'])
  })
})
