import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { buttonVariants } from '@/components/ui'
import { PetCard } from '../../components/PetCard'
import { PageHeader } from '../../components/PageHeader'
import type { DemoPet } from '../../schemas/demo-pets-schema'

const DEMO_PLACES: Record<string, { timeZone: string; city?: string }> = {
  Ana: { timeZone: 'America/Sao_Paulo', city: 'São Paulo' },
  Ben: { timeZone: 'Europe/London' },
  Chen: { timeZone: 'Asia/Shanghai' },
  Dee: { timeZone: 'America/Los_Angeles', city: 'San Francisco' },
}

export default function DemoPage() {
  const { records } = useQuery<DemoPet>('demo_pets', { orderBy: 'name' })

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') fetch('/api/demo/tick', { method: 'POST' }).catch(() => {})
    }
    tick()
    const timer = setInterval(tick, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
      <PageHeader title="Demo room" subtitle="Four simulated teammates. Everyone watching this page sees the same pets change, live.">
        <Link to="/home" className={buttonVariants()}>
          Create a room
        </Link>
      </PageHeader>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {records.map((pet) => (
          <PetCard key={pet.recordId} member={{ ...pet.data, ...DEMO_PLACES[pet.data.name] }} updatedAt={pet.updatedAt} />
        ))}
      </ul>
    </div>
  )
}
