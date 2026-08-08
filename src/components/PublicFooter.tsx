import { brandConfig } from '../brand/config'

const currentYear = new Date().getFullYear()

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <p className="public-footer__copy">© {currentYear} {brandConfig.name}</p>
      <p className="public-footer__version">v{__APP_VERSION__}</p>
    </footer>
  )
}
