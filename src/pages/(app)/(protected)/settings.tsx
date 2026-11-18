/**
 * Example gated page. Reached at /settings — no auth logic lives here
 * because (protected)/_layout.tsx already wraps the subtree in <AuthGate>.
 */

import { signOut, useUser } from 'deepspace'
import { Button } from '@/components/ui'
import { ProfileForm } from '@/components/ProfileForm'
import { PageHeader } from '@/components/PageHeader'

export default function SettingsPage() {
  const { user } = useUser()

  return (
    // No background on page wrappers — pages render into whatever the app's
    // (app)/_layout provides (a plain background, or a raised panel), so they
    // stay transparent and inherit it.
    <div className="min-h-full text-foreground">
      <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-12">
        <PageHeader title="Settings" subtitle="How you show up in your rooms." />

        <section className="surface rounded-3xl p-6">
          <h2 className="mb-5 text-xl font-semibold">Your account</h2>

          <div className="mb-6">
            <ProfileForm />
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Account name</dt>
              <dd className="text-foreground">{user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{user?.email ?? '—'}</dd>
            </div>
          </dl>

          <Button variant="outline" className="mt-6" onClick={() => signOut()}>
            Sign out
          </Button>
        </section>
      </div>
    </div>
  )
}
