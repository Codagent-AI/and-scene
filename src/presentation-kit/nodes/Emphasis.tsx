import { Box, type EntityProps } from './Box'

/** A positioned marker drawn around or beside another entity. */
export function Emphasis(props: EntityProps) {
  return <Box kind="emphasis" {...props} />
}
