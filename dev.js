import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const api = spawn(process.execPath, ['server.js'], {
  cwd: root,
  env: { ...process.env, API_ONLY: '1', PORT: '3001' },
  stdio: 'inherit',
})
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
})

let stopping = false

function stop(code = 0) {
  if (stopping) return
  stopping = true
  api.kill()
  vite.kill()
  process.exitCode = code
}

api.on('error', (error) => {
  console.error('Could not start the API server:', error)
  stop(1)
})
vite.on('error', (error) => {
  console.error('Could not start the Vite server:', error)
  stop(1)
})
api.on('exit', (code) => {
  if (!stopping) stop(code || 0)
})
vite.on('exit', (code) => {
  if (!stopping) stop(code || 0)
})

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
