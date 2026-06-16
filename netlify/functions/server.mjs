// Netlify Functions v2 — wraps the TanStack Start SSR server bundle.
// TanStack Start compiles the server via Vite SSR to dist/server/.
// We try the two most likely output filenames (index.js or server.js).
let _handler

async function resolveHandler() {
  if (_handler) return _handler
  try {
    const mod = await import('../../dist/server/index.js')
    _handler = mod.default ?? mod
  } catch {
    const mod = await import('../../dist/server/server.js')
    _handler = mod.default ?? mod
  }
  return _handler
}

export const config = {
  path: '/*',
}

export default async (request) => {
  const handler = await resolveHandler()
  return handler.fetch(request, {}, {})
}
