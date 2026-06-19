import { Link } from 'react-router-dom'
import { brandConfig } from '../brand/config'

type BrandLogoProps = {
  to?: string
  className?: string
}

export function BrandLogo({ to = '/', className = '' }: BrandLogoProps) {
  const showLogo = Boolean(brandConfig.logoUrl)
  const showLabel = Boolean(brandConfig.headerLabel)

  return (
    <Link to={to} className={`brand-logo ${className}`.trim()}>
      {showLogo && (
        <img src={brandConfig.logoUrl} alt={brandConfig.name} className="brand-logo__img" />
      )}
      {showLabel && <span className="brand-logo__text">{brandConfig.headerLabel}</span>}
      {!showLogo && !showLabel && (
        <span className="brand-logo__text">{brandConfig.name}</span>
      )}
    </Link>
  )
}
