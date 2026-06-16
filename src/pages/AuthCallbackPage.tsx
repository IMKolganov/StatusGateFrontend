import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import './admin.css'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { completeLogin } = useAuth()

  useEffect(() => {
    void completeLogin()
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login', { replace: true }))
  }, [navigate, completeLogin])

  return <div className="center-message">Completing sign in...</div>
}
