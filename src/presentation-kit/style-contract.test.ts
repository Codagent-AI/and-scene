import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

describe('style-neutrality contract', () => {
  it('ships no CSS visual defaults or styling framework references', () => {
    const kitFiles = files(join(process.cwd(), 'src/presentation-kit'))
    const sourceFiles = kitFiles.filter((file) => /\.(ts|tsx)$/.test(file) && !file.endsWith('.test.ts'))
    const source = sourceFiles.map((file) => readFileSync(file, 'utf8')).join('\n')
    expect(kitFiles.some((file) => file.endsWith('.css'))).toBe(false)
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b|\b(fontFamily|color|backgroundColor|border|boxShadow)\s*:/i)
  })
})
