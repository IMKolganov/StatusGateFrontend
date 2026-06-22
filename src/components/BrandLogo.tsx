import { Link } from 'react-router-dom'
import { brandConfig, hasBrandLogo, resolveBrandLogoUrl } from '../brand/config'
import { useTheme } from '../brand/theme'

type BrandLogoProps = {
  to?: string
  className?: string
}

export function BrandLogo({ to = '/', className = '' }: BrandLogoProps) {
  const { theme } = useTheme()
  const logoUrl = resolveBrandLogoUrl(theme)
  const showLogo = hasBrandLogo() && Boolean(logoUrl)
  const showLabel = Boolean(brandConfig.headerLabel)

  return (
    <Link to={to} className={`brand-logo ${className}`.trim()}>
      {showLogo && (
        <img src={logoUrl} alt={brandConfig.name} className="brand-logo__img" />
      )}
      {showLabel && <span className="brand-logo__text">{brandConfig.headerLabel}</span>}
      {!showLogo && !showLabel && (
        <span className="brand-logo__text">{brandConfig.name}</span>
      )}
    </Link>
  )
}
