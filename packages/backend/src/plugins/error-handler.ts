import fp from 'fastify-plugin'
import { ZodError } from 'zod'
import { AppError, serializeError } from '@readr/shared/errors'

export default fp(async (app) => {
  app.setErrorHandler((err, req, reply) => {
    // Zod validation errors → 422
    if (err instanceof ZodError || (err as { validation?: unknown }).validation) {
      const fields = err instanceof ZodError ? err.flatten().fieldErrors : (err as { validation?: unknown }).validation
      req.log.info({ err, fields }, 'request.validation_failed')
      return reply.code(422).send({
        error: { code: 'validation_failed', message: 'Validation failed', details: { fields } },
      })
    }

    // Rate limit (set by @fastify/rate-limit)
    if ((err as { statusCode?: number }).statusCode === 429) {
      req.log.info({ err }, 'request.rate_limited')
      return reply.code(429).send({ error: { code: 'rate_limited', message: 'Too many requests' } })
    }

    // Fastify-thrown HTTP errors (FST_ERR_*, 4xx) — preserve their status; don't promote to 500.
    const fastErr = err as { statusCode?: number; code?: string; message?: string }
    if (
      typeof fastErr.statusCode === 'number' &&
      fastErr.statusCode >= 400 &&
      fastErr.statusCode < 500 &&
      !(err instanceof AppError)
    ) {
      req.log.info({ err }, 'request.client_error')
      return reply.code(fastErr.statusCode).send({
        error: {
          code: 'bad_request',
          message: fastErr.message ?? 'Bad request',
          details: fastErr.code ? { fastify_code: fastErr.code } : undefined,
        },
      })
    }

    const { status, body } = serializeError(err instanceof AppError ? err : err)
    req.log[status >= 500 ? 'error' : 'info']({ err, code: body.error.code }, 'request.error')
    return reply.code(status).send(body)
  })

  app.setNotFoundHandler((_req, reply) => {
    return reply.code(404).send({ error: { code: 'internal', message: 'Route not found' } })
  })
})
