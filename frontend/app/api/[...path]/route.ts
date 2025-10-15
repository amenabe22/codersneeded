import { NextRequest, NextResponse } from 'next/server'
import http from 'http'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH')
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ''
    // Add trailing slash for FastAPI compatibility (FastAPI redirects without it)
    const pathWithSlash = path.endsWith('/') ? path : `${path}/`
    const url = `${BACKEND_URL}/api/${pathWithSlash}${queryString}`

    console.log(`[Proxy] ${method} ${url}`)

    const headers: Record<string, string> = {
      'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
    }
    
    // Forward relevant headers
    request.headers.forEach((value, key) => {
      if (
        key.toLowerCase() !== 'host' &&
        key.toLowerCase() !== 'connection' &&
        !key.toLowerCase().startsWith('next-')
      ) {
        headers[key] = value
      }
    })

    const options: RequestInit = {
      method,
      headers,
    }

    // Add body for POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        options.body = JSON.stringify(await request.json())
      } else if (contentType.includes('multipart/form-data')) {
        options.body = await request.formData() as any
      } else {
        options.body = await request.text()
      }
    }

    // Use native http module to avoid SSL issues with localhost
    const response = await new Promise<{ statusCode: number; headers: any; data: string }>((resolve, reject) => {
      const urlObj = new URL(url)
      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 8000,
        path: urlObj.pathname + urlObj.search,
        method,
        headers,
      }

      const req = http.request(reqOptions, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => resolve({
          statusCode: res.statusCode || 200,
          headers: res.headers,
          data
        }))
      })

      req.on('error', reject)
      
      if (options.body && typeof options.body === 'string') {
        req.write(options.body)
      }
      
      req.end()
    })

    return new NextResponse(response.data, {
      status: response.statusCode,
      headers: {
        'Content-Type': response.headers['content-type'] || 'application/json',
      },
    })
  } catch (error: any) {
    console.error('[Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Proxy error', message: error.message },
      { status: 500 }
    )
  }
}

