import * as THREE from 'three'
import gsap from 'gsap'
import vertexShader from '../shaders/vertex.glsl?raw'
import fragmentShader from '../shaders/fragment.glsl?raw'

const canvas = document.querySelector('#webgl')

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('The Three.js scene requires a canvas element with id="webgl".')
}

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const pointer = { x: 0, y: 0 }
const targetPointer = { x: 0, y: 0 }
const basePosition = { x: 0, y: 0 }
const targetColors = {
  blue: new THREE.Color('#70a7ff'),
  violet: new THREE.Color('#a885ff'),
}
let baseCameraZ = 5.4
let elapsedTime = 0
let targetScrollProgress = 0
let scrollProgress = 0
let needsRender = true

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: window.innerWidth >= 768,
  powerPreference: 'low-power',
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight, false)
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
)
camera.position.z = 5.4

const uniforms = {
  uTime: { value: 0 },
  uScrollProgress: { value: 0 },
  uColorBlue: { value: new THREE.Color('#70a7ff') },
  uColorViolet: { value: new THREE.Color('#a885ff') },
  uOpacity: { value: window.innerWidth < 768 ? 0.47 : 0.78 },
}

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  side: THREE.FrontSide,
})
const geometry = new THREE.IcosahedronGeometry(1.55, window.innerWidth < 768 ? 4 : 5)
const blob = new THREE.Mesh(geometry, material)
const group = new THREE.Group()
group.add(blob)
scene.add(group)

function updateLayout() {
  const width = window.innerWidth
  const height = window.innerHeight
  const aspect = width / height

  camera.aspect = aspect
  baseCameraZ = width < 768 ? 5.9 : 5.4
  camera.position.z = baseCameraZ
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height, false)

  basePosition.x = aspect < 0.8 ? 0.55 : Math.min(1.8, aspect * 1.08)
  basePosition.y = aspect < 0.8 ? -0.8 : 0.05
  group.position.set(basePosition.x, basePosition.y, 0)
  group.scale.setScalar(aspect < 0.8 ? 0.78 : 1)
  uniforms.uOpacity.value = width < 768 ? 0.38 : 0.78
  needsRender = true
}

function handlePointerMove(event) {
  if (reducedMotionQuery.matches) return

  targetPointer.x = (event.clientX / window.innerWidth) * 2 - 1
  targetPointer.y = 1 - (event.clientY / window.innerHeight) * 2
}

function renderScene(_time, deltaTime) {
  if (document.hidden) return
  if (reducedMotionQuery.matches && !needsRender) return

  const delta = Math.min(deltaTime / 1000, 0.05)
  const smoothing = 1 - Math.exp(-2.8 * delta)

  if (!reducedMotionQuery.matches) {
    elapsedTime += delta
    pointer.x += (targetPointer.x - pointer.x) * smoothing
    pointer.y += (targetPointer.y - pointer.y) * smoothing
    scrollProgress += (targetScrollProgress - scrollProgress) * smoothing
    group.rotation.x += (pointer.y * 0.08 - group.rotation.x) * smoothing
    group.rotation.y += (pointer.x * 0.11 + elapsedTime * 0.045 + scrollProgress * 0.18 - group.rotation.y) * smoothing
    group.rotation.z += ((scrollProgress - 0.5) * 0.16 - group.rotation.z) * smoothing
    group.position.x += (basePosition.x - pointer.x * 0.12 - group.position.x) * smoothing
    group.position.y += (basePosition.y + pointer.y * 0.08 - group.position.y) * smoothing
    uniforms.uTime.value = elapsedTime
    uniforms.uScrollProgress.value = scrollProgress
    uniforms.uColorBlue.value.lerp(targetColors.blue, smoothing)
    uniforms.uColorViolet.value.lerp(targetColors.violet, smoothing)

    const cameraProgress = scrollProgress - 0.5
    camera.position.x += (cameraProgress * 0.3 - camera.position.x) * smoothing
    camera.position.y += (cameraProgress * 0.12 - camera.position.y) * smoothing
    camera.position.z += (baseCameraZ - Math.abs(cameraProgress) * 0.12 - camera.position.z) * smoothing
    camera.lookAt(0, 0, 0)
  } else {
    scrollProgress = targetScrollProgress
    uniforms.uScrollProgress.value = scrollProgress
  }

  renderer.render(scene, camera)
  needsRender = false
}

function handleMotionPreferenceChange() {
  needsRender = true
}

export function setSceneScrollProgress(progress) {
  targetScrollProgress = THREE.MathUtils.clamp(progress, 0, 1)
  if (reducedMotionQuery.matches) {
    scrollProgress = targetScrollProgress
    uniforms.uScrollProgress.value = scrollProgress
  }
  needsRender = true
}

export function setScenePalette(blue, violet) {
  targetColors.blue.set(blue)
  targetColors.violet.set(violet)
  if (reducedMotionQuery.matches) {
    uniforms.uColorBlue.value.copy(targetColors.blue)
    uniforms.uColorViolet.value.copy(targetColors.violet)
  }
  needsRender = true
}

export function disposeScene() {
  gsap.ticker.remove(renderScene)
  window.removeEventListener('resize', updateLayout)
  window.removeEventListener('pointermove', handlePointerMove)
  document.removeEventListener('visibilitychange', handleMotionPreferenceChange)
  reducedMotionQuery.removeEventListener('change', handleMotionPreferenceChange)
  geometry.dispose()
  material.dispose()
  renderer.dispose()
}

window.addEventListener('resize', updateLayout, { passive: true })
window.addEventListener('pointermove', handlePointerMove, { passive: true })
document.addEventListener('visibilitychange', handleMotionPreferenceChange)
reducedMotionQuery.addEventListener('change', handleMotionPreferenceChange)
updateLayout()
gsap.ticker.add(renderScene)
