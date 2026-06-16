import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/email/transactional/preview')({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({ error: 'Not available' }, { status: 404 })
      },
    },
  },
})
