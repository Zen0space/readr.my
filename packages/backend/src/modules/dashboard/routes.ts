import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const dashboardMetrics = z.object({
  total_writings: z.number(),
  total_chapters: z.number(),
  total_followers: z.number(),
  total_reads_30d: z.number(),
  total_chapter_votes: z.number(),
  pending_rm_cents: z.number(),
  // Admin metrics (zero for non-admin responses — kept present to avoid
  // a discriminated-union response schema).
  total_users: z.number(),
  total_active_users_30d: z.number(),
  total_authors: z.number(),
  total_stories_published: z.number(),
  revenue_gross_rm: z.string(),
})

const dashboardResponse = z.object({
  role: z.enum(['reader', 'author', 'admin']),
  metrics: dashboardMetrics,
  stories: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      status: z.enum(['draft', 'ongoing', 'completed']),
      reads_30d: z.number(),
      followers: z.number(),
      votes: z.number(),
    }),
  ),
})

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/me/dashboard', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['dashboard'],
      response: { 200: dashboardResponse },
    },
    handler: async (req) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const role = req.user!.role

      if (role === 'author' || role === 'admin') {
        return buildAuthorDashboard(app, db, req.user!.id)
      }
      return buildReaderDashboard(app, db, req.user!.id)
    },
  })

  app.get('/v1/admin/dashboard', {
    preHandler: app.requireRole('admin'),
    schema: {
      tags: ['dashboard', 'admin'],
      response: { 200: dashboardResponse },
    },
    handler: async (req) => {
      if (!app.supabaseAdmin) {
        return buildAuthorDashboard(app, app.supabaseAnon as never, req.user!.id)
      }
      return buildAdminDashboard(app, req.user!.id)
    },
  })
}

const buildAuthorDashboard = async (
  app: import('fastify').FastifyInstance,
  db: import('@supabase/supabase-js').SupabaseClient,
  authorId: string,
) => {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [{ data: stories }, { count: followerCount }, { data: myChapters }, pendingPayouts] =
    await Promise.all([
      db.from('stories').select('id, title, status').eq('author_id', authorId),
      db
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', authorId),
      db.from('chapters').select('id, story_id').in(
        'story_id',
        (await db.from('stories').select('id').eq('author_id', authorId)).data?.map(
          (s) => (s as { id: string }).id,
        ) ?? [],
      ),
      pendingPayoutsForAuthor(app, authorId),
    ])

  const chapterIds = (myChapters ?? []).map((c) => (c as { id: string }).id)
  const storyIds = (stories ?? []).map((s) => (s as { id: string }).id)

  const [{ count: reads30d }, { count: votes }] = await Promise.all([
    chapterIds.length > 0
      ? db
          .from('reads')
          .select('*', { count: 'exact', head: true })
          .in('chapter_id', chapterIds)
          .gte('read_at', since)
      : Promise.resolve({ count: 0 }),
    chapterIds.length > 0
      ? db
          .from('chapter_votes')
          .select('*', { count: 'exact', head: true })
          .in('chapter_id', chapterIds)
      : Promise.resolve({ count: 0 }),
  ])

  const readsByStory: Record<string, number> = {}
  if (chapterIds.length > 0) {
    const { data: reads } = await db
      .from('reads')
      .select('chapter_id')
      .in('chapter_id', chapterIds)
      .gte('read_at', since)
    const chToStory = new Map<string, string>()
    for (const c of myChapters ?? []) {
      const x = c as { id: string; story_id: string }
      chToStory.set(x.id, x.story_id)
    }
    for (const r of reads ?? []) {
      const x = r as { chapter_id: string }
      const sid = chToStory.get(x.chapter_id)
      if (sid) readsByStory[sid] = (readsByStory[sid] ?? 0) + 1
    }
  }

  const votesByStory: Record<string, number> = {}
  if (chapterIds.length > 0) {
    const { data: votesRows } = await db
      .from('chapter_votes')
      .select('chapter_id')
      .in('chapter_id', chapterIds)
    const chToStory = new Map<string, string>()
    for (const c of myChapters ?? []) {
      const x = c as { id: string; story_id: string }
      chToStory.set(x.id, x.story_id)
    }
    for (const v of votesRows ?? []) {
      const x = v as { chapter_id: string }
      const sid = chToStory.get(x.chapter_id)
      if (sid) votesByStory[sid] = (votesByStory[sid] ?? 0) + 1
    }
  }

  const followersByStory = new Map<string, number>()
  for (const sid of storyIds) followersByStory.set(sid, 0)

  const pendingRmCents = (pendingPayouts ?? []).reduce(
    (acc, p) => acc + Number(p.amount_rm_cents),
    0,
  )

  return {
    role: 'author' as const,
    metrics: {
      total_writings: stories?.length ?? 0,
      total_chapters: chapterIds.length,
      total_followers: followerCount ?? 0,
      total_reads_30d: reads30d ?? 0,
      total_chapter_votes: votes ?? 0,
      pending_rm_cents: pendingRmCents,
      total_users: 0,
      total_active_users_30d: 0,
      total_authors: 0,
      total_stories_published: 0,
      revenue_gross_rm: '0.00',
    },
    stories: (stories ?? []).map((s) => {
      const x = s as { id: string; title: string; status: 'draft' | 'ongoing' | 'completed' }
      return {
        id: x.id,
        title: x.title,
        status: x.status,
        reads_30d: readsByStory[x.id] ?? 0,
        followers: followersByStory.get(x.id) ?? 0,
        votes: votesByStory[x.id] ?? 0,
      }
    }),
  }
}

const pendingPayoutsForAuthor = async (
  app: import('fastify').FastifyInstance,
  authorId: string,
): Promise<{ amount_rm_cents: number; status: string }[]> => {
  if (!app.supabaseAdmin) return []
  const { data, error } = await app.supabaseAdmin
    .from('payouts')
    .select('amount_rm_cents, status')
    .eq('author_id', authorId)
    .eq('status', 'requested')
  if (error) throw error
  return (data ?? []) as { amount_rm_cents: number; status: string }[]
}

const buildReaderDashboard = async (
  _app: import('fastify').FastifyInstance,
  _db: import('@supabase/supabase-js').SupabaseClient,
  _userId: string,
) => {
  // Reader dashboard is intentionally sparse in phase 0; the bulk of the
  // reader surface lives in /v1/me/library, /v1/me/subscriptions, and /v1/wallet.
  return {
    role: 'reader' as const,
    metrics: {
      total_writings: 0,
      total_chapters: 0,
      total_followers: 0,
      total_reads_30d: 0,
      total_chapter_votes: 0,
      pending_rm_cents: 0,
      total_users: 0,
      total_active_users_30d: 0,
      total_authors: 0,
      total_stories_published: 0,
      revenue_gross_rm: '0.00',
    },
    stories: [],
  }
}

const buildAdminDashboard = async (
  app: import('fastify').FastifyInstance,
  adminId: string,
) => {
  const admin = app.supabaseAdmin!
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [
    { count: totalUsers },
    { count: totalAuthors },
    { data: activeUsers },
    { count: totalStories },
    { data: purchases },
  ] = await Promise.all([
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'author'),
    admin
      .from('reads')
      .select('user_id')
      .gte('read_at', since),
    admin.from('stories').select('*', { count: 'exact', head: true }).neq('status', 'draft'),
    admin
      .from('coin_purchases')
      .select('pack_rm_cents, coins, status, created_at')
      .eq('status', 'succeeded'),
  ])

  const activeSet = new Set((activeUsers ?? []).map((r) => (r as { user_id: string }).user_id))
  const grossCents = (purchases ?? []).reduce(
    (acc, p) => acc + Number((p as { pack_rm_cents: number }).pack_rm_cents),
    0,
  )

  return {
    role: 'admin' as const,
    metrics: {
      total_writings: totalStories ?? 0,
      total_chapters: 0,
      total_followers: 0,
      total_reads_30d: 0,
      total_chapter_votes: 0,
      pending_rm_cents: 0,
      total_users: totalUsers ?? 0,
      total_authors: totalAuthors ?? 0,
      total_active_users_30d: activeSet.size,
      total_stories_published: totalStories ?? 0,
      revenue_gross_rm: (grossCents / 100).toFixed(2),
    },
    stories: [],
  }
  void adminId
}