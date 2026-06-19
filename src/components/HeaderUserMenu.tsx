import { Link } from 'react-router-dom'
import type { Account } from '../api/client'
import { getAccountDisplayName } from '../utils/accountDisplay'
import { AccountAvatar } from './AccountAvatar'

type HeaderUserMenuProps = {
  account: Account
}

export function HeaderUserMenu({ account }: HeaderUserMenuProps) {
  const displayName = getAccountDisplayName(account)

  return (
    <Link to="/account" className="header-user nav-text" title={account.email}>
      <AccountAvatar account={account} className="header-user__avatar" />
      <span className="header-user__name">{displayName}</span>
    </Link>
  )
}
