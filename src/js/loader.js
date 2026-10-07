import gsap from 'gsap'

const loader = document.querySelector('#loader')
const counter = loader?.querySelector('.loader__counter')
const progress = loader?.querySelector('.loader__progress span')
const hero = document.querySelector('#hero')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!(loader instanceof HTMLElement) || !(counter instanceof HTMLElement) || !(progress instanceof HTMLElement)) {
  throw new Error('The page loader is missing a required element.')
}

if (!(hero instanceof HTMLElement)) {
  throw new Error('The page loader requires the hero section.')
}

if (reducedMotion) {
  loader.hidden = true
} else {
  loader.hidden = false

  const count = { value: 0 }

  gsap.to(count, {
    value: 100,
    duration: 1.15,
    ease: 'power2.inOut',
    onUpdate: () => {
      const value = Math.round(count.value)
      counter.textContent = `${String(value).padStart(2, '0')}%`
      progress.style.transform = `scaleX(${value / 100})`
    },
    onComplete: () => {
      gsap.to(loader, {
        yPercent: -100,
        duration: 0.72,
        delay: 0.12,
        ease: 'power4.inOut',
        onComplete: () => {
          loader.hidden = true

          gsap.fromTo(
            hero.querySelectorAll('.hero__name, .eyebrow, h1, .hero__bottom, .scroll-cue, .hero__index'),
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.08,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
            },
          )
        },
      })
    },
  })
}
