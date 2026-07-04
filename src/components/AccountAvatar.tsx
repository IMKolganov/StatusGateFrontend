import { useEffect, useState } from 'react'
import type { Account } from '../api/client'
import { getAccountAvatarUrl } from '../utils/accountDisplay'

type AccountAvatarProps = {
  account: Account
  className?: string
}

export function AccountAvatar({ account, className = '' }: AccountAvatarProps) {
  const avatarUrl = getAccountAvatarUrl(account)
  const [trackedUrl, setTrackedUrl] = useState(avatarUrl)
  const [isValid, setIsValid] = useState(false)

  if (trackedUrl !== avatarUrl) {
    setTrackedUrl(avatarUrl)
    setIsValid(false)
  }

  useEffect(() => {
    if (!avatarUrl) return

    let cancelled = false

    const probe = new Image()
    probe.referrerPolicy = 'no-referrer'
    probe.onload = () => {
      if (!cancelled) {
        setIsValid(true)
      }
    }
    probe.onerror = () => {
      if (!cancelled) {
        setIsValid(false)
      }
    }
    probe.src = avatarUrl

    return () => {
      cancelled = true
    }
  }, [avatarUrl])

  if (!avatarUrl || !isValid) {
    return null
  }

  return (
    <img
      src={avatarUrl}
      alt=""
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setIsValid(false)}
    />
  )
}
