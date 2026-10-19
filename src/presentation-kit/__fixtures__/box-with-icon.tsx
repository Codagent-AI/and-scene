// Box with and without the optional Lucide icon-as-component pattern (X-5). Never bundled.
import { Star } from 'lucide-react'
import { Box } from '../nodes/Box'

export function IconBox() {
  return <Box id="starred" x={10} y={10} w={40} h={40} Icon={Star} />
}

export function PlainBox() {
  return <Box id="plain" x={10} y={10} w={40} h={40} />
}
