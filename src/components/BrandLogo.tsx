import { Link } from 'react-router-dom'
import { brandConfig } from '../brand/config'

type BrandLogoProps = {
  to?: string
  className?: string
}

export function BrandLogo({ to = '/', className = '' }: BrandLogoProps) {
  return (
    <Link to={to} className={`brand-logo ${className}`.trim()}>
      {brandConfig.logoUrl ? (
        <img src={brandConfig.logoUrl} alt={brandConfig.name} className="brand-logo__img" />
      ) : (
        <span className="brand-logo__text">{brandConfig.name}</span>
      )}
    </Link>
  )
}
