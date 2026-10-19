const BASE = 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('token') || ''
}

async function request(method, path, body, isStream = false) {
  const headers = { Authorization: 'Bearer ' + getToken() }
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body
      ? body instanceof Blob || body instanceof File
        ? body
        : JSON.stringify(body)
      : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('auth:logout'))
    throw new Error('Session expired. Please sign in again.')
  }

  if (!res.ok) {
    let msg = res.statusText
    try { msg = (await res.json()).detail || msg } catch (_) {}
    throw new Error(msg)
  }

  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!data.ok) {
    let msg = data.statusText
    try { msg = (await data.json()).detail || msg } catch (_) {}
    throw new Error(msg)
  }
  return data.json()
}

export async function logout() {
  return request('POST', '/auth/logout')
}

export async function getMe() {
  return request('GET', '/auth/me')
}

// ── Tech stack ────────────────────────────────────────────────────────────────
export async function getTechStack() {
  return request('GET', '/tech-stack')
}

// ── Workspaces ────────────────────────────────────────────────────────────────
export async function listWorkspaces() {
  return request('GET', '/workspaces')
}

export async function createWorkspace(payload) {
  return request('POST', '/workspaces', payload)
}

export async function uploadFile(wsId, kind, file) {
  const res = await fetch(
    `${BASE}/workspaces/${wsId}/files/${kind}?filename=${encodeURIComponent(file.name)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + getToken(),
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(file.size),
      },
      body: file,
    }
  )
  if (!res.ok) {
    let msg = res.statusText
    try { msg = (await res.json()).detail || msg } catch (_) {}
    throw new Error(msg)
  }
  return res.json()
}

export async function processWorkspace(wsId) {
  return request('POST', `/workspaces/${wsId}/process`)
}

export async function getStatus(wsId, since = 0) {
  return request('GET', `/workspaces/${wsId}/status?since=${since}`)
}

export async function openWorkspace(wsId) {
  return request('POST', `/workspaces/${wsId}/open`)
}
