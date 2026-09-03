import { spawn } from 'child_process'
import http from 'http'

let serverProcess

export async function setup() {
  const port = process.env.PORT || 8787
  console.log(`🚀 Starting dev server on port ${port} in globalSetup...`)
  serverProcess = spawn('npm', ['run', 'run', '--', '--port', String(port)], {
    shell: true,
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  })

  const start = Date.now()
  const timeout = 30000 // 30 seconds

  while (true) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for dev server to start')
    }

    if (serverProcess && serverProcess.exitCode !== null) {
      throw new Error('Dev server process exited prematurely with code ' + serverProcess.exitCode)
    }

    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
          res.resume()
          resolve()
        })
        req.on('error', reject)
        req.end()
      })
      console.log('✅ Dev server is ready!')
      break
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }
}

export async function teardown() {
  console.log('🛑 Stopping dev server...')
  if (serverProcess) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t'], { shell: true })
    } else {
      try {
        process.kill(-serverProcess.pid, 'SIGTERM')
      } catch (e) {
        serverProcess.kill()
      }
    }
  }
}
