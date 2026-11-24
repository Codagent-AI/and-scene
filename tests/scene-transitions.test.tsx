import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { AnimatePresence } from 'motion/react'
import { Appear, Box } from '../src/presentation-kit/nodes'
afterEach(cleanup)
function Scene({ show }: { show: boolean }) { return <><Box id="continuing">Continuing</Box><AnimatePresence>{show && <Appear key="new"><Box id="new">New entity</Box></Appear>}</AnimatePresence></> }
it('keeps a continuing entity while a newcomer enters and exits', async () => {
 const view=render(<Scene show={false}/>); const continuing=screen.getByText('Continuing')
 view.rerender(<Scene show />); const newcomer=screen.getByText('New entity'); expect(screen.getByText('Continuing')).toBe(continuing); expect(newcomer.parentElement?.style.opacity).toBe('0')
 await waitFor(() => expect(Number(newcomer.parentElement?.style.opacity)).toBeGreaterThan(0), {timeout:3000})
 view.rerender(<Scene show={false}/>); expect(screen.getByText('Continuing')).toBe(continuing); expect(screen.getByText('New entity')).toBeTruthy()
 await waitFor(() => expect(screen.queryByText('New entity')).toBeNull(),{timeout:3000})
})
