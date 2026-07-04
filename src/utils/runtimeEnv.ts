type EnvWindow = Window & {
  __ENV__?: Record<string, unknown>
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function getRuntimeEnv() {
  const envWindow = window as EnvWindow
  const runtime: Record<string, unknown> = envWindow.__ENV__ ?? {}
  const buildGoogleClientId: unknown = import.meta.env.VITE_GOOGLE_CLIENT_ID

  return {
    googleClientId: readString(runtime.VITE_GOOGLE_CLIENT_ID) || readString(buildGoogleClientId),
  }
}
