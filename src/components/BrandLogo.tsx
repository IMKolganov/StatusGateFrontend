import { Link } from 'react-router-dom'
import { useState } from 'react'
import { brandConfig, hasBrandLogo, resolveBrandLogoUrl } from '../brand/config'
import { useTheme } from '../brand/useTheme'

type BrandLogoProps = {
  to?: string
  className?: string
}

export function BrandLogo({ to = '/', className = '' }: BrandLogoProps) {
  const { theme } = useTheme()
  const logoUrl = resolveBrandLogoUrl(theme)
  const [logoOk, setLogoOk] = useState(true)
  const showLogo = hasBrandLogo() && Boolean(logoUrl) && logoOk
  const showLabel = Boolean(brandConfig.headerLabel)

  return (
    <Link to={to} className={`brand-logo ${className}`.trim()}>
      {showLogo && (
        <img
          src={logoUrl}
          alt={brandConfig.name}
          className="brand-logo__img"
          onError={() => setLogoOk(false)}
        />
      )}
      {showLabel && <span className="brand-logo__text">{brandConfig.headerLabel}</span>}
      {!showLogo && !showLabel && (
        <span className="brand-logo__text">{brandConfig.name}</span>
      )}
    </Link>
  )
}
