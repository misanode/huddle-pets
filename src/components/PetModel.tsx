import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import type { ModelViewerElement } from '@google/model-viewer'
import type { Activity } from '../schemas/team-members-schema'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': HTMLAttributes<ModelViewerElement> & {
        ref?: Ref<ModelViewerElement>
        src: string
        alt: string
        autoplay?: boolean
        'animation-name'?: string
        'animation-crossfade-duration'?: number
        'camera-orbit'?: string
        'camera-target'?: string
        'field-of-view'?: string
        'interaction-prompt'?: 'auto' | 'none'
        'shadow-intensity'?: number
      }
    }
  }
}

const CLIP_FOR: Partial<Record<Activity, string>> = { editing: 'typing' }
const SIDE_PROP_CLIPS = new Set(['thinking', 'command', 'permission', 'error'])

let modelViewer: Promise<unknown> | undefined
const loadModelViewer = () => (modelViewer ??= import('@google/model-viewer'))

export function PetModel({ activity, label, fallback }: { activity: Activity; label: string; fallback: ReactNode }) {
  const ref = useRef<ModelViewerElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [clips, setClips] = useState<string[]>()
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    loadModelViewer().then(() => setEnabled(true), () => {})
  }, [])

  useEffect(() => {
    const viewer = ref.current
    if (!viewer) return
    const onLoad = () => setClips(viewer.availableAnimations)
    const onError = () => setEnabled(false)
    viewer.addEventListener('load', onLoad)
    viewer.addEventListener('error', onError)
    return () => {
      viewer.removeEventListener('load', onLoad)
      viewer.removeEventListener('error', onError)
    }
  }, [enabled])

  if (!enabled) return fallback
  const wanted = CLIP_FOR[activity] ?? activity
  const clip = !clips || clips.includes(wanted) ? wanted : 'idle'

  return (
    <div className="relative h-32 w-full">
      {!clips && <div className="absolute inset-0 flex items-center justify-center">{fallback}</div>}
      <model-viewer
        ref={ref}
        src="/pets/pet.glb"
        alt={label}
        data-clip={clip}
        autoplay={!reducedMotion}
        animation-name={clip}
        animation-crossfade-duration={250}
        camera-orbit="0deg 80deg 10m"
        camera-target={SIDE_PROP_CLIPS.has(clip) ? '1.6m 2m 0.4m' : '0m 1.3m 0.4m'}
        field-of-view="30deg"
        interaction-prompt="none"
        shadow-intensity={0.6}
        className="block h-32 w-full"
      />
    </div>
  )
}
