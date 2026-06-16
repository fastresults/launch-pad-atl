import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type State =
  | { kind: 'loading' }
  | { kind: 'valid' }
  | { kind: 'already' }
  | { kind: 'invalid' }
  | { kind: 'submitting' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? undefined
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!token) { setState({ kind: 'invalid' }); return }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}))
        if (!r.ok) { setState({ kind: 'invalid' }); return }
        if (body.valid) setState({ kind: 'valid' })
        else if (body.reason === 'already_unsubscribed') setState({ kind: 'already' })
        else setState({ kind: 'invalid' })
      })
      .catch(() => setState({ kind: 'invalid' }))
  }, [token])

  async function confirm() {
    if (!token) return
    setState({ kind: 'submitting' })
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const body = await r.json().catch(() => ({}))
      if (r.ok && body.success) setState({ kind: 'done' })
      else if (body.reason === 'already_unsubscribed') setState({ kind: 'already' })
      else setState({ kind: 'error', message: body.error || 'Something went wrong.' })
    } catch (e: any) {
      setState({ kind: 'error', message: e?.message ?? 'Network error' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>Manage emails from Atlanta Startup Sprint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.kind === 'loading' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking your link…
            </div>
          )}
          {state.kind === 'valid' && (
            <>
              <p className="text-sm">Click below to stop receiving emails from us.</p>
              <Button onClick={confirm} className="w-full">Confirm unsubscribe</Button>
            </>
          )}
          {state.kind === 'submitting' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </div>
          )}
          {state.kind === 'done' && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">You're unsubscribed.</p>
                <p className="text-sm text-muted-foreground">We won't email you again.</p>
              </div>
            </div>
          )}
          {state.kind === 'already' && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">Already unsubscribed.</p>
            </div>
          )}
          {state.kind === 'invalid' && (
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-muted-foreground">Invalid or expired link.</p>
            </div>
          )}
          {state.kind === 'error' && (
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-muted-foreground">{state.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
