type EnvWindow = Window & {
  __ENV__?: Record<string, unknown>
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function getRuntimeEnv() {
  const runtime = ((window as EnvWindow).__ENV__ ?? {}) as Record<string, unknown>
  const buildGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  return {
    googleClientId: readString(runtime.VITE_GOOGLE_CLIENT_ID) || readString(buildGoogleClientId),
  }
}
