import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setScenePalette, setSceneScrollProgress } from './scene.js'

gsap.registerPlugin(ScrollTrigger)

export const lenis = new Lenis({
  duration: 1.2,
  easing: (progress) => Math.min(1, 1.001 - 2 ** (-10 * progress)),
  smoothWheel: true,
  anchors: true,
})

lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)

ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: () => ScrollTrigger.maxScroll(window),
  invalidateOnRefresh: true,
  onUpdate: (self) => setSceneScrollProgress(self.progress),
})

const sectionPalettes = {
  hero: ['#70a7ff', '#a885ff'],
  about: ['#72c6ff', '#829dff'],
  skills: ['#8e91ff', '#d18bff'],
  projects: ['#68a8ff', '#8b79ff'],
  services: ['#6bd2d0', '#70a7ff'],
  contact: ['#a885ff', '#70a7ff'],
}

document.querySelectorAll('.site-main > section[id]').forEach((section) => {
  const palette = sectionPalettes[section.id]
  if (!palette) return

  ScrollTrigger.create({
    trigger: section,
    start: 'top center',
    end: 'bottom center',
    onEnter: () => setScenePalette(...palette),
    onEnterBack: () => setScenePalette(...palette),
  })
})

let refreshTimeout
window.addEventListener(
  'resize',
  () => {
    window.clearTimeout(refreshTimeout)
    refreshTimeout = window.setTimeout(() => ScrollTrigger.refresh(), 150)
  },
  { passive: true },
)
