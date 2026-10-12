import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? filesUnder(path) : /\.(ts|tsx)$/.test(path) && !path.endsWith('.test.ts') && !path.endsWith('.test.tsx') ? [path] : []
  })
}

describe('style-neutral kit contract', () => {
  it('has no framework imports or palette/font/border/shadow declarations', () => {
    const source = filesUnder(join(process.cwd(), 'src/presentation-kit')).map((file) => readFileSync(file, 'utf8')).join('\n')
    expect(source).not.toMatch(/from\s+['"](?:tailwind|@tailwind|styled-components|@emotion)/i)
    expect(source).not.toMatch(/tailwind/i)
    expect(source).not.toMatch(/\b(color|backgroundColor|fontFamily|fontSize|border|boxShadow)\s*:/i)
  })
})
