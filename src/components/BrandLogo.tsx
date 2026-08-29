import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { brandConfig, resolveBrandLogoUrl } from '../brand/config'
import { useTheme } from '../brand/useTheme'

const FAVICON_FALLBACK = '/favicon.svg'

type BrandLogoProps = {
  to?: string
  className?: string
}

export function BrandLogo({ to = '/', className = '' }: BrandLogoProps) {
  const { theme } = useTheme()
  const configuredUrl = resolveBrandLogoUrl(theme).trim()
  const [src, setSrc] = useState(configuredUrl || FAVICON_FALLBACK)
  const showLabel = Boolean(brandConfig.headerLabel)

  useEffect(() => {
    setSrc(configuredUrl || FAVICON_FALLBACK)
  }, [configuredUrl])

  return (
    <Link to={to} className={`brand-logo ${className}`.trim()}>
      {src ? (
        <img
          src={src}
          alt=""
          className="brand-logo__img"
          onError={() => {
            setSrc((current) => (current !== FAVICON_FALLBACK ? FAVICON_FALLBACK : ''))
          }}
        />
      ) : null}
      {showLabel && <span className="brand-logo__text">{brandConfig.headerLabel}</span>}
      {!src && !showLabel && (
        <span className="brand-logo__text">{brandConfig.name}</span>
      )}
    </Link>
  )
}
