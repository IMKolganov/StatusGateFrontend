export type ContactLink = {
  label: string
  value: string
  href: string
}

export const projectContacts: ContactLink[] = [
  { label: 'GitHub', value: 'IMKolganov', href: 'https://github.com/IMKolganov' },
  { label: 'Mail', value: 'IMKolganov@gmail.com', href: 'mailto:IMKolganov@gmail.com' },
  { label: 'Telegram', value: '@KolganovIvan', href: 'https://t.me/KolganovIvan' },
  { label: 'LinkedIn', value: 'IMKolganov', href: 'https://www.linkedin.com/in/IMKolganov' },
  { label: 'Facebook', value: 'IMKolganov', href: 'https://www.facebook.com/IMKolganov' },
]

export const contactIntro =
  'Questions, suggestions, or issues — reach out via:'

export const contactOutro = 'Feedback and contributions are welcome.'
