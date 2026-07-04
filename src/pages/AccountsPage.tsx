import { useEffect, useState } from 'react'
import { api, type ApiError, type AccountAdminResponse } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import './admin.css'

const ALL_ROLES = ['admin', 'operator', 'viewer', 'user']

export function AccountsPage() {
  const [items, setItems] = useState<AccountAdminResponse[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = () => void api.listAccounts().then((r) => setItems(r.items))

  useEffect(() => {
    load()
  }, [])

  const toggleRole = (account: AccountAdminResponse, role: string) => {
    const roles = new Set(account.access_roles)
    if (roles.has(role)) roles.delete(role)
    else roles.add(role)
    if (roles.size === 0) {
      setError('Account must have at least one role')
      return
    }
    void api.updateAccountRoles(account.id, [...roles]).then(load).catch((err: ApiError) => setError(err.message))
  }

  return (
    <AdminLayout title="Accounts" subtitle="Manage access roles for admin panel users">
      {error && <div className="alert error">{error}</div>}
      <section className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Active</th>
              {ALL_ROLES.map((role) => <th key={role}>{role}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.email}</td>
                <td>{item.is_active ? 'yes' : 'no'}</td>
                {ALL_ROLES.map((role) => (
                  <td key={role}>
                    <input
                      type="checkbox"
                      checked={item.access_roles.includes(role)}
                      onChange={() => toggleRole(item, role)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminLayout>
  )
}
