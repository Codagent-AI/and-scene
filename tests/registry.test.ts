import { expect, it } from 'vitest'
import { presentations } from '../src/presentations'
it('registers unique routable presentation slugs', () => { expect(presentations.length).toBeGreaterThan(0); expect(new Set(presentations.map(p=>p.slug)).size).toBe(presentations.length); for (const p of presentations) { expect(p.slug).toMatch(/^[a-z0-9-]+$/); expect(p.title.length).toBeGreaterThan(0); expect(typeof p.load).toBe('function') } expect(presentations.some(p=>p.slug==='how-to-make-a-presentation')).toBe(true) })
