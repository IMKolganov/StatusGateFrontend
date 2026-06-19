import { brandConfig } from '../brand/config'

const currentYear = new Date().getFullYear()

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <p className="public-footer__copy">© {currentYear} {brandConfig.name}</p>
    </footer>
  )
}
