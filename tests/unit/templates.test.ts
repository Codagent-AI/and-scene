// @vitest-environment node
import { expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { resolveTemplate } from '../../skills/presentation/templates.mjs'
it('I-17 resolves both asset kinds from the installed skill and rejects unknown kinds', () => {
  for (const kind of ['bootstrap', 'presentation']) expect(resolveTemplate(kind)).toBe(fileURLToPath(new URL(`../../skills/presentation/templates/${kind}/`, import.meta.url)))
  expect(() => resolveTemplate('../outside')).toThrow('Expected bootstrap or presentation')
})
