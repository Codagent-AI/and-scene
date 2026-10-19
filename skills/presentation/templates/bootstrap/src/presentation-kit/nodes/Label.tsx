import { Box, type EntityProps } from './Box'

export function Label(props: EntityProps) {
  return <Box kind="label" {...props} />
}
