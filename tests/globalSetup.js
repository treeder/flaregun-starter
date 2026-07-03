import { spawn } from 'child_process'
import http from 'http'

let serverProcess

export async function setup() {
  console.log('🚀 Starting dev server in globalSetup...')
  serverProcess = spawn('npm', ['run', 'run'], {
    shell: true,
    stdio: 'inherit',
  })

  const start = Date.now()
  const timeout = 30000 // 30 seconds
  
  while (true) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for dev server to start')
    }
    
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8787/', (res) => {
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
      serverProcess.kill()
    }
  }
}
