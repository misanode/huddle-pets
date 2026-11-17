import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { buttonVariants } from '@/components/ui'
import { PetCard } from '../../components/PetCard'
import type { DemoPet } from '../../schemas/demo-pets-schema'

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
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Demo room</h1>
          <p className="text-sm text-muted-foreground">
            Four simulated teammates. Everyone watching this page sees the same pets change, live.
          </p>
        </div>
        <Link to="/home" className={buttonVariants()}>
          Make your own room
        </Link>
      </header>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {records.map((pet) => (
          <PetCard key={pet.recordId} member={pet.data} updatedAt={pet.updatedAt} />
        ))}
      </ul>
    </div>
  )
}
