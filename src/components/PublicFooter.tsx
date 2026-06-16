import { Link } from 'react-router-dom'
import { brandConfig } from '../brand/config'
import { contactIntro, contactOutro, projectContacts } from '../config/contacts'

const currentYear = new Date().getFullYear()

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <div className="public-footer__brand">
          <Link to="/" className="public-footer__name">
            {brandConfig.name}
          </Link>
          <p className="public-footer__tagline">{brandConfig.tagline}</p>
          <p className="public-footer__summary">
            Open-source status pages with health monitoring, incident history, and a team admin dashboard.
          </p>
        </div>

        <div className="public-footer__links">
          <h2 className="public-footer__heading">Explore</h2>
          <ul className="public-footer__nav">
            <li>
              <Link to="/">System status</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
          </ul>
        </div>

        <div className="public-footer__contact">
          <h2 className="public-footer__heading">Contact</h2>
          <p className="public-footer__contact-intro">{contactIntro}</p>
          <ul className="public-footer__contacts">
            {projectContacts.map((contact) => (
              <li key={contact.label}>
                <span className="public-footer__contact-label">{contact.label}:</span>{' '}
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  {contact.value}
                </a>
              </li>
            ))}
          </ul>
          <p className="public-footer__contact-outro">{contactOutro}</p>
        </div>
      </div>

      <div className="public-footer__bottom">
        <p>© {currentYear} {brandConfig.name}</p>
      </div>
    </footer>
  )
}
