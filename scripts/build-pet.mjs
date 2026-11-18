import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, quantize, resample } from '@gltf-transform/functions'

const [source, target = 'public/pets/pet.glb'] = process.argv.slice(2)
if (!source) throw new Error('Usage: node scripts/build-pet.mjs <lilagent.glb> [out.glb]')

const FACE_FOR_CLIP = {
  idle: 'prompt',
  typing: 'prompt',
  command: 'prompt',
  thinking: 'closed',
  reading: 'eyes',
  searching: 'eyes',
  permission: 'wide',
  error: 'sad',
  done: 'happy',
  donehold: 'happy',
  curious: 'eyes',
  happy: 'happy',
  dance: 'happy',
  excited: 'happy',
  sad: 'sad',
  wave: 'happy',
  workout: 'squint',
  meditate: 'closed',
  idea: [
    [0, 'wide'],
    [1.2, 'happy'],
  ],
  coffee: [
    [0, 'eyes'],
    [29 / 24, 'asleep'],
    [55 / 24, 'happy'],
    [79 / 24, 'eyes'],
  ],
}
const CURSOR_BLINK_SECONDS = 1.06

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(source)
const root = doc.getRoot()
const buffer = root.listBuffers()[0]

for (const anim of root.listAnimations()) if (!(anim.getName() in FACE_FOR_CLIP)) anim.dispose()
const clips = root.listAnimations()

const maxScale = (channel) => Math.max(...channel.getSampler().getOutput().getArray().filter((_, i) => i % 3 === 0))
const shown = clips.flatMap((anim) =>
  anim.listChannels().filter((ch) => ch.getTargetPath() === 'scale' && ch.getTargetNode()?.getName().startsWith('prop_') && maxScale(ch) > 0.5).map((ch) => ch.getTargetNode()),
)
const keep = new Set()
for (const node of shown) {
  node.traverse((child) => keep.add(child))
  for (let parent = node.getParentNode(); parent; parent = parent.getParentNode()) keep.add(parent)
}
for (const node of root.listNodes()) if (node.getName().startsWith('prop_') && !keep.has(node)) node.dispose()

const faces = new Map(root.listNodes().filter((n) => n.getName().startsWith('face_')).map((n) => [n.getName().slice(5), n]))
const accessor = (type, values) => doc.createAccessor().setType(type).setArray(new Float32Array(values)).setBuffer(buffer)
const track = (anim, node, times, visible) => {
  const rest = node.getScale()
  const sampler = doc
    .createAnimationSampler()
    .setInterpolation('STEP')
    .setInput(accessor('SCALAR', times))
    .setOutput(accessor('VEC3', visible.flatMap((v) => (v ? rest : [0, 0, 0]))))
  for (const ch of anim.listChannels()) if (ch.getTargetNode() === node && ch.getTargetPath() === 'scale') ch.dispose()
  anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath('scale').setSampler(sampler))
}

for (const anim of clips) {
  const face = FACE_FOR_CLIP[anim.getName()]
  const duration = Math.max(...anim.listSamplers().map((s) => s.getInput().getMax([])[0]))
  const steps = typeof face === 'string' ? [[0, face]] : face
  const times = steps.map(([t]) => t)
  for (const [name, node] of faces) if (name !== 'cursor') track(anim, node, times, steps.map(([, f]) => f === name))
  const cursor = faces.get('cursor')
  if (!cursor) continue
  if (face !== 'prompt') track(anim, cursor, [0], [false])
  else if (anim.getName() === 'typing') track(anim, cursor, [0], [true])
  else {
    const times = Array.from({ length: Math.ceil((2 * duration) / CURSOR_BLINK_SECONDS) + 1 }, (_, i) => (i * CURSOR_BLINK_SECONDS) / 2)
    track(anim, cursor, times, times.map((_, i) => i % 2 === 0))
  }
}

await doc.transform(prune(), resample(), dedup(), prune(), quantize())
await io.write(target, doc)
console.log(`${target}: clips ${clips.map((a) => a.getName()).join(', ')}`)
