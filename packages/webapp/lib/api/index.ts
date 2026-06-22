// Re-export the shared `@auror/shared/api` so existing webapp imports
// (`import { authApi } from '@/lib/api'`) keep resolving. New code should
// import directly from `@auror/shared/api` and `@auror/shared/api-client`.
export * from '@auror/shared/api'