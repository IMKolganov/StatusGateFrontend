import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../../api/client'
import { GoogleIcon } from './GoogleIcon'

type GoogleCredentialResponse = { credential?: string }

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            auto_select?: boolean
          }) => void
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
        }
      }
    }
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-script'
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_BUTTON_MIN_WIDTH = 200

function resolveGoogleButtonWidth(container: HTMLElement): number {
  const measured = Math.floor(container.getBoundingClientRect().width)
  return Math.max(GOOGLE_BUTTON_MIN_WIDTH, measured)
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve()
        return
      }
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity script.')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity script.'))
    document.body.appendChild(script)
  })
}

type GoogleLoginFormProps = {
  clientId: string
  onSuccess: () => void | Promise<void>
  onMfaRequired: (mfaToken: string) => void
}

export function GoogleLoginForm({ clientId, onSuccess, onMfaRequired }: GoogleLoginFormProps) {
  const [error, setError] = useState('')
  const [scriptReady, setScriptReady] = useState(false)
  const [pending, setPending] = useState(false)
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const lastRenderedWidthRef = useRef<number | null>(null)
  const isRenderingButtonRef = useRef(false)

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setError('')
      setPending(true)
      try {
        const result = await api.googleLogin(idToken)
        if ('mfa_required' in result) {
          onMfaRequired(result.mfa_token)
          return
        }
        await onSuccess()
      } catch (err) {
        let message = 'We could not log you in with Google. Please try again.'
        if (err instanceof ApiError) {
          message = err.message || message
        } else if (err instanceof Error) {
          message = `${message} ${err.message}`
        }
        setError(message)
      } finally {
        setPending(false)
      }
    },
    [onMfaRequired, onSuccess],
  )

  const renderGoogleButton = useCallback(() => {
    const buttonContainer = buttonContainerRef.current
    if (!buttonContainer || !window.google?.accounts?.id || isRenderingButtonRef.current) {
      return
    }

    const width = resolveGoogleButtonWidth(buttonContainer)
    if (lastRenderedWidthRef.current === width && buttonContainer.childElementCount > 0) {
      return
    }

    isRenderingButtonRef.current = true
    try {
      buttonContainer.replaceChildren()
      window.google.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width,
      })
      lastRenderedWidthRef.current = width
    } finally {
      isRenderingButtonRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const initGoogle = async () => {
      setScriptReady(false)
      setError('')

      if (!clientId) {
        setError('Google client ID is not configured.')
        return
      }

      try {
        await loadGoogleScript()
        if (cancelled) return

        if (!window.google?.accounts?.id) {
          throw new Error('Google Identity API is not available on window.')
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: (response: GoogleCredentialResponse) => {
            if (response.credential) {
              void handleGoogleCredential(response.credential)
            } else {
              setError('Google did not return a valid credential.')
            }
          },
        })

        setScriptReady(true)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to initialize Google Identity Services. Please try again later.',
          )
        }
      }
    }

    void initGoogle()

    return () => {
      cancelled = true
    }
  }, [clientId, handleGoogleCredential])

  useEffect(() => {
    if (!scriptReady) return

    let frame = 0
    const scheduleRender = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        renderGoogleButton()
      })
    }

    scheduleRender()
    window.addEventListener('resize', scheduleRender)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', scheduleRender)
    }
  }, [scriptReady, renderGoogleButton])

  return (
    <>
      {error && <p className="google-login-error">{error}</p>}
      <div className={`google-login-shell${pending ? ' google-login-shell--pending' : ''}`}>
        <div className="google-btn btn-block google-login-visual" aria-hidden="true">
          <GoogleIcon className="google-login-icon" />
          <span>Sign in with Google</span>
        </div>
        <div
          ref={buttonContainerRef}
          className="google-login-overlay"
          role="button"
          aria-label="Sign in with Google"
          aria-busy={pending}
        />
      </div>
      {(!scriptReady || pending) && (
        <span className="google-login-loading muted">Loading...</span>
      )}
    </>
  )
}
