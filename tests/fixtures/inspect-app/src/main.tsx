import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Deck } from './Deck'
import { VARIANT_SLUGS, type VariantSlug } from './variants'

const requested = window.location.pathname.replace(/^\/+|\/+$/g, '')
const variant: VariantSlug = (VARIANT_SLUGS as readonly string[]).includes(requested)
  ? (requested as VariantSlug)
  : 'clean'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Deck variant={variant} />
  </StrictMode>,
)
