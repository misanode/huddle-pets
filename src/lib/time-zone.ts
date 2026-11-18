import { useEffect, useState } from 'react'

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(new Date())
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    }
    timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    return () => clearTimeout(timer)
  }, [])
  return now
}

export function zoneClock(timeZone: string | undefined, now: Date) {
  if (!timeZone) return undefined
  try {
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone, timeZoneName: 'short' })
    const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(now))
    return { time, night: hour < 7 || hour >= 19 }
  } catch {
    return undefined
  }
}
