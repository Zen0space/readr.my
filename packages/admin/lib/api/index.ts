// Re-export the shared `@auror/shared/api` so existing reader code can
// `import { authApi, writingsApi } from '@/lib/api'` without reaching into
// the shared subpath.
export * from '@auror/shared/api'