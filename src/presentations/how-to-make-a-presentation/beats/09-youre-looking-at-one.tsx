import { Frame } from '../../../presentation-kit'
import { E } from '../entities'

/** The reveal frame draws around the whole diagram; it holds no entities of its own. */
export function Beat9() {
  return (
    <Frame
      id={E.frame}
      label="An example of the skill's own output"
      className="htp-frame"
      style={{ left: 6, top: 4, width: 868, height: 372 }}
    />
  )
}

