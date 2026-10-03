import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const templates = resolve(import.meta.dirname, '../skills/presentation/templates')

describe('presentation skill templates', () => {
  it.each(['step.ts', 'Scene.tsx'])('keeps the presentation step template %s aligned with the standalone step template', (file) => {
    expect(readFileSync(join(templates, 'presentation/steps', file), 'utf8')).toBe(readFileSync(join(templates, 'step', file), 'utf8'))
  })
})
