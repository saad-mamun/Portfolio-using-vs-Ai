import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const dist = resolve(root, 'dist')
const maxBodyLength = 4096
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.glsl': 'text/plain; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

function readRequestBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = ''
    let tooLarge = false

    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      if (tooLarge) return
      body += chunk
      if (Buffer.byteLength(body) > maxBodyLength) {
        tooLarge = true
        rejectBody(new RangeError('Request body is too large.'))
      }
    })
    request.on('end', () => {
      if (!tooLarge) resolveBody(body)
    })
    request.on('error', rejectBody)
  })
}

async function answerQuestion(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Use POST to ask a question.' })
    return
  }

  if (!request.headers['content-type']?.includes('application/json')) {
    sendJson(response, 415, { error: 'Send the question as JSON.' })
    return
  }

  let body
  try {
    body = await readRequestBody(request)
  } catch (error) {
    if (error instanceof RangeError) {
      sendJson(response, 413, { error: 'The question is too long.' })
      return
    }
    throw error
  }

  let payload
  try {
    payload = JSON.parse(body)
  } catch {
    sendJson(response, 400, { error: 'The request body is not valid JSON.' })
    return
  }

  const question = typeof payload === 'object' && payload !== null && !Array.isArray(payload)
    && typeof payload.question === 'string'
    ? payload.question.trim()
    : ''
  if (!question || question.length > 1000) {
    sendJson(response, 400, { error: 'Enter a question up to 1,000 characters long.' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    sendJson(response, 503, { error: 'Search is not configured yet. Add OPENAI_API_KEY to the server environment.' })
    return
  }

  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      tools: [{ type: 'web_search_preview' }],
      input: question,
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!upstream.ok) {
    console.error(`OpenAI search request failed with status ${upstream.status}.`)
    sendJson(response, 502, { error: 'The search service could not answer that just now. Please try again.' })
    return
  }

  const result = await upstream.json()
  const textBlocks = result.output?.flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text')
  const answer = (textBlocks || []).map((item) => item.text || '').join('\n').trim()
  if (!answer) {
    console.error('OpenAI search response did not contain answer text.')
    sendJson(response, 502, { error: 'The search service returned an empty answer. Please try again.' })
    return
  }

  const sourceMap = new Map()
  for (const block of textBlocks || []) {
    for (const annotation of block.annotations || []) {
      if (annotation.type !== 'url_citation' || typeof annotation.url !== 'string') continue
      try {
        const url = new URL(annotation.url)
        if (url.protocol === 'https:') {
          sourceMap.set(url.href, { url: url.href, title: annotation.title || url.hostname })
        }
      } catch {
        continue
      }
    }
  }

  sendJson(response, 200, { answer, sources: [...sourceMap.values()] })
}

async function serveStatic(request, response, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' })
    response.end()
    return
  }

  let requestedPath
  try {
    requestedPath = decodeURIComponent(pathname)
  } catch {
    response.writeHead(400)
    response.end('Invalid URL')
    return
  }

  const filePath = resolve(dist, `.${requestedPath}`)
  const relativePath = relative(dist, filePath)
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  let target = filePath
  try {
    if (!(await stat(target)).isFile()) target = resolve(dist, 'index.html')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    if (extname(requestedPath)) {
      response.writeHead(404)
      response.end('Not found')
      return
    }
    target = resolve(dist, 'index.html')
  }

  const content = await readFile(target)
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(target)] || 'application/octet-stream',
    'Content-Length': content.length,
  })
  response.end(request.method === 'HEAD' ? undefined : content)
}

const apiOnly = process.env.API_ONLY === '1'
const server = createServer((request, response) => {
  let pathname
  try {
    pathname = new URL(request.url, 'http://localhost').pathname
  } catch {
    sendJson(response, 400, { error: 'Invalid request URL.' })
    return
  }

  if (pathname === '/api/answer') {
    void answerQuestion(request, response).catch((error) => {
      console.error('Could not process search request:', error)
      if (!response.headersSent) {
        sendJson(response, 500, { error: 'An unexpected server error occurred. Please try again.' })
      } else {
        response.destroy()
      }
    })
    return
  }

  if (pathname.startsWith('/api/')) {
    sendJson(response, 404, { error: 'API endpoint not found.' })
    return
  }

  if (apiOnly) {
    response.writeHead(404)
    response.end('Not found')
    return
  }

  void serveStatic(request, response, pathname).catch((error) => {
    console.error('Could not serve the requested file:', error)
    if (!response.headersSent) {
      response.writeHead(500)
      response.end('Could not load the requested page.')
    } else {
      response.destroy()
    }
  })
})

const port = Number(process.env.PORT) || (apiOnly ? 3001 : 3000)
server.listen(port, () => {
  console.log(apiOnly ? `Search API listening on http://localhost:${port}` : `Portfolio listening on http://localhost:${port}`)
})
