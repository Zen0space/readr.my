type EnvShape = {
  apiBaseUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
}

const required = (name: string, value: string | undefined): string => {
  if (!value || value.length === 0) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export const env: EnvShape = {
  apiBaseUrl: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
}
