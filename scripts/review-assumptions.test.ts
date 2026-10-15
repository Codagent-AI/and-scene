import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file: string) => readFile(path.join(root, file), 'utf8')

describe('console error filtering', () => {
  it.each(['scripts/verify.mjs', 'scripts/verify-presentation.mjs'])('%s ignores only the browser favicon request failure', async (file) => {
    const source = await read(file)
    expect(source).not.toMatch(/favicon\/i\.test\(message\.text\(\)\)/)
    expect(source).toContain('/\\/favicon\\.ico(?:[?#]|$)/.test(message.location().url')
  })
})

describe('reference scene exits', () => {
  it('animates the departing ghost card out instead of unmounting it immediately', async () => {
    const source = await read('src/presentations/how-to-make-a-presentation/ReferenceScene.tsx')
    expect(source).toMatch(/<AnimatePresence[^>]*>\s*\{beat === 5 && <motion\.div key=\{E\.ghost\} exit=\{\{ opacity: 0 \}\}><Box id=\{E\.ghost\}/)
  })
})
