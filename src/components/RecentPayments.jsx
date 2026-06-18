import { useEffect, useState, useCallback } from 'react'
import { getTransactions } from '../api/payments'

const STATUS_STYLES = {
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  STK_PUSH_SENT: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  INITIATED: 'bg-slate-100 text-slate-600',
}

const METHOD_ICONS = {
  MPESA: '📱',
  CARD: '💳',
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function maskPhone(phone) {
  if (!phone) return '—'
  if (phone.length <= 6) return phone
  return phone.slice(0, 4) + '••••' + phone.slice(-3)
}

export default function RecentPayments({ refreshTrigger }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setError(null)
      const data = await getTransactions()
      setTransactions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions, refreshTrigger])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">Recent Payments</h2>
        <button
          onClick={fetchTransactions}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          Loading transactions…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16 text-red-500 text-sm gap-2">
          <span>⚠️</span> {error}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <p className="text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-500 max-w-[120px] truncate">
                    {tx.id}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <span>{METHOD_ICONS[tx.paymentMethod] ?? '💸'}</span>
                      <span className="font-medium text-slate-700">{tx.paymentMethod}</span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">{maskPhone(tx.phoneNumber)}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800">
                    KES {Number(tx.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        STATUS_STYLES[tx.status] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                    {formatDate(tx.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
