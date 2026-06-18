const BASE = '/api/v1'

let authToken = null

export const setAuthToken = (token) => { authToken = token }
export const clearAuthToken = () => { authToken = null }

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const body = await res.json()
  if (!res.ok) throw new Error(body.errors || body.description || 'Request failed')
  return body.data
}

export const login = (credentials) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) })

export const initiatePayment = (payload, idempotencyKey) =>
  request('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  })

export const getTransactions = () => request('/payments')

export const getTransaction = (id) => request(`/payments/${id}`)
