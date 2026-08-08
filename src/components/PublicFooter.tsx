import { brandConfig } from '../brand/config'

const currentYear = new Date().getFullYear()

const versionLabel = [
  `v${__APP_VERSION__}`,
  __GIT_SHA__ ? `build ${__GIT_SHA__}` : '',
  __BUILD_DATE__,
]
  .filter(Boolean)
  .join(' · ')

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <p className="public-footer__copy">© {currentYear} {brandConfig.name}</p>
      <p className="public-footer__version">{versionLabel}</p>
    </footer>
  )
}
