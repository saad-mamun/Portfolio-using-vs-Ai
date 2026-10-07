import gsap from 'gsap'

const cursorMedia = window.matchMedia(
  '(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
)
let cursor
let interactives = []
let moveX
let moveY
let cursorVisible = false

function moveCursor(event) {
  if (!cursorVisible) {
    cursorVisible = true
    gsap.to(cursor, { autoAlpha: 1, duration: 0.2 })
  }
  moveX(event.clientX)
  moveY(event.clientY)
}

function hideCursor(event) {
  if (event.relatedTarget || !cursorVisible) return
  cursorVisible = false
  gsap.to(cursor, { autoAlpha: 0, duration: 0.2 })
}

function growCursor() {
  gsap.to(cursor, { scale: 1.65, duration: 0.25, ease: 'power2.out' })
  cursor.classList.add('is-active')
}

function resetCursor() {
  gsap.to(cursor, { scale: 1, duration: 0.25, ease: 'power2.out' })
  cursor.classList.remove('is-active')
}

function enableCursor() {
  cursor = document.createElement('div')
  cursor.className = 'custom-cursor'
  cursor.setAttribute('aria-hidden', 'true')
  document.body.append(cursor)
  document.body.classList.add('has-custom-cursor')
  gsap.set(cursor, { xPercent: -50, yPercent: -50 })
  moveX = gsap.quickTo(cursor, 'x', { duration: 0.32, ease: 'power3.out' })
  moveY = gsap.quickTo(cursor, 'y', { duration: 0.32, ease: 'power3.out' })

  interactives = [...document.querySelectorAll('a, button, [role="button"]')]
  window.addEventListener('pointermove', moveCursor, { passive: true })
  document.addEventListener('pointerout', hideCursor)

  interactives.forEach((element) => {
    element.addEventListener('pointerenter', growCursor)
    element.addEventListener('pointerleave', resetCursor)
    element.addEventListener('focus', growCursor)
    element.addEventListener('blur', resetCursor)
  })
}

function disableCursor() {
  if (!cursor) return

  window.removeEventListener('pointermove', moveCursor)
  document.removeEventListener('pointerout', hideCursor)

  interactives.forEach((element) => {
    element.removeEventListener('pointerenter', growCursor)
    element.removeEventListener('pointerleave', resetCursor)
    element.removeEventListener('focus', growCursor)
    element.removeEventListener('blur', resetCursor)
  })

  gsap.killTweensOf(cursor)
  cursor.remove()
  document.body.classList.remove('has-custom-cursor')
  interactives = []
  cursor = undefined
  moveX = undefined
  moveY = undefined
  cursorVisible = false
}

function syncCursor() {
  if (cursorMedia.matches) {
    if (!cursor) enableCursor()
    return
  }

  disableCursor()
}

cursorMedia.addEventListener('change', syncCursor)
syncCursor()
