const form = document.querySelector('#answer-form')

if (form) {
  const questionInput = document.querySelector('#answer-question')
  const output = document.querySelector('#answer-output')
  const status = document.querySelector('#answer-status')
  const content = document.querySelector('#answer-content')
  const sources = document.querySelector('#answer-sources')
  const submitButton = form.querySelector('button[type="submit"]')
  const buttonLabel = submitButton.querySelector('.answer-form__button-label')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const question = questionInput.value.trim()

    if (!question) {
      questionInput.focus()
      return
    }

    output.hidden = false
    status.textContent = 'Searching the web and preparing an answer...'
    content.textContent = ''
    sources.replaceChildren()
    sources.hidden = true
    submitButton.disabled = true
    buttonLabel.textContent = 'Searching'

    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'The search could not be completed.')
      }

      status.textContent = 'Answer'
      content.textContent = data.answer

      for (const source of data.sources) {
        const item = document.createElement('li')
        const link = document.createElement('a')
        link.href = source.url
        link.target = '_blank'
        link.rel = 'noreferrer'
        link.textContent = source.title || new URL(source.url).hostname
        item.append(link)
        sources.append(item)
      }

      sources.hidden = data.sources.length === 0
    } catch (error) {
      status.textContent = 'Could not get an answer'
      content.textContent = error instanceof Error
        ? error.message
        : 'Please try again in a moment.'
    } finally {
      submitButton.disabled = false
      buttonLabel.textContent = 'Search'
    }
  })
}
