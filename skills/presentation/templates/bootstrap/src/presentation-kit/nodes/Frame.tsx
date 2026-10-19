import { Box, type EntityProps } from './Box'

/** A positioned region that groups other entities visually. */
export function Frame(props: EntityProps & { label?: string }) {
  return <Box kind="frame" {...props} />
}
