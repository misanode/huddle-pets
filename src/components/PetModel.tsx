import { useEffect, useRef, useState, type HTMLAttributes, type Ref } from 'react'
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
const HEAD_PROP_CLIPS = new Set(['done', 'donehold'])
const cameraTarget = (clip: string) => (SIDE_PROP_CLIPS.has(clip) ? '1.6m 2m 0.4m' : HEAD_PROP_CLIPS.has(clip) ? '0m 2.4m 0.4m' : '0m 1.3m 0.4m')

type Step = [clip: string, seconds: number]

const DONE: Step = ['done', 2.04]
const DONE_HOLD: Step = ['donehold', 27.6]
const MOODS: [clip: string, weight: number, seconds: number][] = [
  ['idle', 2, 0],
  ['curious', 1, 4],
  ['happy', 0.5, 3],
  ['dance', 0.4, 6],
  ['excited', 0.3, 3.5],
  ['sad', 0.2, 8.1],
  ['wave', 0.25, 2.8],
  ['coffee', 0.45, 8.4],
  ['workout', 0.3, 5],
  ['meditate', 0.3, 8],
  ['idea', 0.35, 2.04],
]
const TOTAL_WEIGHT = MOODS.reduce((sum, [, w]) => sum + w, 0)

function wander(): Step[] {
  let r = Math.random() * TOTAL_WEIGHT
  const [mood, , seconds] = MOODS.find(([, w]) => (r -= w) <= 0) ?? MOODS[0]
  const rest: Step = ['idle', 4 + Math.random() * 5]
  return mood === 'idle' ? [rest] : [rest, [mood, seconds]]
}

function useRestingClip(activity: Activity, animate: boolean) {
  const [clip, setClip] = useState('idle')
  const previous = useRef(activity)

  useEffect(() => {
    const finished = activity === 'waiting' && previous.current !== 'waiting'
    previous.current = activity
    if (activity !== 'idle' && activity !== 'waiting') return
    if (!animate) return setClip(activity === 'waiting' ? 'donehold' : 'idle')
    let timer: ReturnType<typeof setTimeout>
    const play = ([[next, seconds], ...rest]: Step[]) => {
      setClip(next)
      timer = setTimeout(() => play(rest.length ? rest : wander()), seconds * 1000)
    }
    play(activity === 'idle' ? wander() : finished ? [DONE, DONE_HOLD] : [DONE_HOLD])
    return () => clearTimeout(timer)
  }, [activity, animate])

  return clip
}

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function usePetClip(activity: Activity) {
  const resting = useRestingClip(activity, !prefersReducedMotion())
  return activity === 'idle' || activity === 'waiting' ? resting : (CLIP_FOR[activity] ?? activity)
}

let modelViewer: Promise<unknown> | undefined
const loadModelViewer = () => (modelViewer ??= import('@google/model-viewer'))

function PetPlaceholder({ loading }: { loading: boolean }) {
  return (
    <img
      src="/brand/pet-icon.svg"
      alt=""
      width={255}
      height={181}
      data-testid="pet-placeholder"
      data-loading={loading}
      className={`h-auto w-16 opacity-25 sm:w-20 ${loading ? 'motion-safe:animate-pulse' : ''}`}
    />
  )
}

export function PetModel({ clip: wanted, label }: { clip: string; label: string }) {
  const ref = useRef<ModelViewerElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [failed, setFailed] = useState(false)
  const [clips, setClips] = useState<string[]>()
  const reducedMotion = prefersReducedMotion()

  useEffect(() => {
    loadModelViewer().then(() => setEnabled(true), () => setFailed(true))
  }, [])

  useEffect(() => {
    const viewer = ref.current
    if (!viewer) return
    const onLoad = () => setClips(viewer.availableAnimations)
    const onError = () => {
      setEnabled(false)
      setFailed(true)
    }
    viewer.addEventListener('load', onLoad)
    viewer.addEventListener('error', onError)
    return () => {
      viewer.removeEventListener('load', onLoad)
      viewer.removeEventListener('error', onError)
    }
  }, [enabled])

  if (!enabled)
    return (
      <div className="flex h-28 w-full items-center justify-center sm:h-32">
        <PetPlaceholder loading={!failed} />
      </div>
    )
  const clip = !clips || clips.includes(wanted) ? wanted : 'idle'

  return (
    <div className="relative h-28 sm:h-32 w-full">
      {!clips && (
        <div className="absolute inset-0 flex items-center justify-center">
          <PetPlaceholder loading />
        </div>
      )}
      <model-viewer
        ref={ref}
        src="/pets/pet.glb"
        alt={label}
        data-clip={clip}
        autoplay={!reducedMotion}
        animation-name={clip}
        animation-crossfade-duration={250}
        camera-orbit="0deg 80deg 10m"
        camera-target={cameraTarget(clip)}
        field-of-view="30deg"
        interaction-prompt="none"
        shadow-intensity={0.6}
        className="block h-28 sm:h-32 w-full"
      />
    </div>
  )
}
