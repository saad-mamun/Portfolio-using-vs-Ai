import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const revealTargets = document.querySelectorAll(
  '.section-heading h2, .projects-intro h2, .service-item h3, .contact-section h2',
)

function splitWords(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const textNodes = []

  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.trim()) textNodes.push(walker.currentNode)
  }

  textNodes.forEach((textNode) => {
    const parts = textNode.nodeValue.split(/(\s+)/)
    const fragment = document.createDocumentFragment()

    parts.forEach((part) => {
      if (!part || /^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part))
        return
      }

      const word = document.createElement('span')
      word.className = 'reveal-word'
      word.textContent = part
      fragment.append(word)
    })

    textNode.replaceWith(fragment)
  })

  return element.querySelectorAll('.reveal-word')
}

revealTargets.forEach((element) => {
  const words = splitWords(element)

  if (!words.length) return

  gsap.fromTo(
    words,
    {
      yPercent: reducedMotionQuery.matches ? 0 : 110,
      opacity: 0,
    },
    {
      yPercent: 0,
      opacity: 1,
      duration: reducedMotionQuery.matches ? 0.25 : 0.8,
      stagger: reducedMotionQuery.matches ? 0 : 0.035,
      ease: reducedMotionQuery.matches ? 'power1.out' : 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 86%',
        once: true,
      },
    },
  )
})

document.fonts.ready.then(() => ScrollTrigger.refresh())
