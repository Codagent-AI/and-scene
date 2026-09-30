const AND_SCENE_REPO_URL = 'https://github.com/Codagent-AI/and-scene'

/** Default toolkit disclosure. Not part of a presentation's visual style system. */
export function Attribution() {
  return (
    <a
      data-presentation-attribution=""
      href={AND_SCENE_REPO_URL}
      target="_blank"
      rel="noreferrer"
    >
      made by and-scene
    </a>
  )
}
