const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`

let authToken = null
let onUnauthorized = null

export const setAuthToken = (token) => { authToken = token }
export const clearAuthToken = () => { authToken = null }
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    onUnauthorized?.()
    throw new Error('Session expired. Please log in again.')
  }
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
