const test = require('node:test')
const assert = require('node:assert/strict')
const apiHandler = require('../api/index')

async function mockRequest(headers = {}, method = 'GET') {
  const req = {
    method,
    url: '/manifest.json',
    headers
  }
  const resHeaders = {}
  let body = ''
  const res = {
    statusCode: 0,
    setHeader(name, value) {
      resHeaders[name.toLowerCase()] = value
    },
    end(chunk = '') {
      body += chunk
    }
  }
  await apiHandler(req, res)
  return { statusCode: res.statusCode, headers: resHeaders, body }
}

test('CORS: defaults to * when no CORS_ALLOWED_ORIGINS is set', async () => {
  const original = process.env.CORS_ALLOWED_ORIGINS
  delete process.env.CORS_ALLOWED_ORIGINS
  try {
    const { headers } = await mockRequest({ origin: 'https://evil.com' })
    assert.equal(headers['access-control-allow-origin'], '*')
    assert.equal(headers['access-control-allow-headers'], 'Content-Type, X-App-Base-Path')
  } finally {
    process.env.CORS_ALLOWED_ORIGINS = original
  }
})

test('CORS: allows specific origin from whitelist and sets Vary: Origin', async () => {
  const original = process.env.CORS_ALLOWED_ORIGINS
  process.env.CORS_ALLOWED_ORIGINS = 'https://stremio.com,https://app.strem.io'
  try {
    const { headers } = await mockRequest({ origin: 'https://stremio.com' })
    assert.equal(headers['access-control-allow-origin'], 'https://stremio.com')
    assert.equal(headers['vary'], 'Origin')
  } finally {
    process.env.CORS_ALLOWED_ORIGINS = original
  }
})

test('CORS: defaults to first allowed origin when origin header is missing or mismatch', async () => {
  const original = process.env.CORS_ALLOWED_ORIGINS
  process.env.CORS_ALLOWED_ORIGINS = 'https://stremio.com,https://app.strem.io'
  try {
    // Missing origin
    const { headers: h1 } = await mockRequest({})
    assert.equal(h1['access-control-allow-origin'], 'https://stremio.com')

    // Mismatched origin
    const { headers: h2 } = await mockRequest({ origin: 'https://evil.com' })
    assert.equal(h2['access-control-allow-origin'], 'https://stremio.com')
  } finally {
    process.env.CORS_ALLOWED_ORIGINS = original
  }
})

test('CORS: supports * in whitelist', async () => {
  const original = process.env.CORS_ALLOWED_ORIGINS
  process.env.CORS_ALLOWED_ORIGINS = 'https://stremio.com,*'
  try {
    const { headers } = await mockRequest({ origin: 'https://evil.com' })
    assert.equal(headers['access-control-allow-origin'], '*')
  } finally {
    process.env.CORS_ALLOWED_ORIGINS = original
  }
})

test('CORS: OPTIONS preflight uses same logic', async () => {
  const original = process.env.CORS_ALLOWED_ORIGINS
  process.env.CORS_ALLOWED_ORIGINS = 'https://stremio.com'
  try {
    const { statusCode, headers } = await mockRequest({ origin: 'https://stremio.com' }, 'OPTIONS')
    assert.equal(statusCode, 204)
    assert.equal(headers['access-control-allow-origin'], 'https://stremio.com')
    assert.match(headers['access-control-allow-methods'], /GET,HEAD,OPTIONS/)
  } finally {
    process.env.CORS_ALLOWED_ORIGINS = original
  }
})
