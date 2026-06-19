import { PublicLayout } from '../components/PublicLayout'
import { contactIntro, contactOutro, projectContacts } from '../config/contacts'
import './public.css'

export function ContactPage() {
  return (
    <PublicLayout>
      <article className="contact-page">
        <header className="page-header">
          <h1>Contact</h1>
        </header>

        <div className="contact-content">
          <p>{contactIntro}</p>
          <ul className="contact-list">
            {projectContacts.map((contact) => (
              <li key={contact.label}>
                <span className="contact-label">{contact.label}:</span>{' '}
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  {contact.value}
                </a>
              </li>
            ))}
          </ul>
          <p>{contactOutro}</p>
        </div>
      </article>
    </PublicLayout>
  )
}
