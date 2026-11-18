import type { ReactNode } from 'react'

export function Hero({ title, body, children }: { title: ReactNode; body?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <img src="/brand/logo.png" alt="" width={540} height={516} className="mb-3 h-auto w-24 sm:w-28" />
      <h1 className="mb-3 max-w-xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{title}</h1>
      {body && <p className="mb-7 max-w-md text-base font-light leading-relaxed text-muted-foreground">{body}</p>}
      {children && <div className="flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}
