import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const projectsSection = document.querySelector('#projects')
const viewport = projectsSection?.querySelector('.projects-viewport')
const track = projectsSection?.querySelector('.projects-track')
const progressBar = projectsSection?.querySelector('.projects-progress span')

if (
  !(projectsSection instanceof HTMLElement) ||
  !(viewport instanceof HTMLElement) ||
  !(track instanceof HTMLElement) ||
  !(progressBar instanceof HTMLElement)
) {
  throw new Error('The horizontal projects section is missing a required element.')
}

const horizontalMedia = gsap.matchMedia()

horizontalMedia.add(
  '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
  () => {
    const getScrollDistance = () => Math.max(0, track.scrollWidth - viewport.clientWidth)

    gsap.set(progressBar, { scaleX: 0, transformOrigin: 'left center' })

    const horizontalTween = gsap.to(track, {
      x: () => -getScrollDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: projectsSection,
        start: 'top top',
        end: () => `+=${getScrollDistance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => gsap.set(progressBar, { scaleX: self.progress }),
        onRefresh: (self) => gsap.set(progressBar, { scaleX: self.progress }),
      },
    })

    const cards = gsap.utils.toArray('.project-card', projectsSection)

    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        { scale: 0.96, y: index % 2 === 0 ? 8 : -8 },
        {
          scale: 1,
          y: index % 2 === 0 ? -8 : 8,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            containerAnimation: horizontalTween,
            start: 'left 90%',
            end: 'center 50%',
            scrub: 1,
          },
        },
      )
    })
  },
)
