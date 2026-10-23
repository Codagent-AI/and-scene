import type { ComponentType } from 'react'
import type { Payload } from './fixtureData'
import { Box, Label } from '../index'

export const LabelScene: ComponentType<{ payload: Payload }> = ({ payload }) => (
  <Box data-testid="scene-root" style={{ left: 0, top: 0, width: 100, height: 40 }}>
    <Label>{payload.label}</Label>
  </Box>
)

