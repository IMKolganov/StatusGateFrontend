import { PublicLayout } from '../components/PublicLayout'
import { brandConfig } from '../brand/config'
import { contactIntro, contactOutro, projectContacts } from '../config/contacts'
import './public.css'

export function AboutPage() {
  return (
    <PublicLayout>
      <article className="about-page">
        <header className="page-header">
          <h1>About {brandConfig.name}</h1>
        </header>

        <div className="about-content">
          <p>
            {brandConfig.name} is an open-source service status platform with public status pages, uptime
            timelines, and incident history. It helps teams publish clear, transparent health information for
            their products and infrastructure.
          </p>
          <p>
            The project includes HTTP, JSON, and XML health checks, a background monitoring worker, grouped
            component views, and an admin dashboard for projects, service types, monitored components, and
            incident updates — similar to what you expect from modern status pages.
          </p>
          <p>
            {brandConfig.name} is built for teams that want control over their status communication: self-host
            it, audit the code, and customize what your users see without relying on opaque third-party tools.
          </p>
        </div>

        <section className="about-contact">
          <h2>Contact</h2>
          <p>{contactIntro}</p>
          <ul className="about-contact-list">
            {projectContacts.map((contact) => (
              <li key={contact.label}>
                <span className="about-contact-label">{contact.label}:</span>{' '}
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  {contact.value}
                </a>
              </li>
            ))}
          </ul>
          <p>{contactOutro}</p>
        </section>
      </article>
    </PublicLayout>
  )
}
