const BASE = '/api/v1/payments'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.errors || body.description || 'Request failed')
  return body.data
}

export const initiatePayment = (payload) =>
  request('', { method: 'POST', body: JSON.stringify(payload) })

export const getTransactions = () => request('')

export const getTransaction = (id) => request(`/${id}`)
