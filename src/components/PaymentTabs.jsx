import { useState } from 'react'
import { initiatePayment } from '../api/payments'

const SAVED_CARDS = [
  { id: 'card_1', last4: '4242', brand: 'Visa', expiry: '08/27' },
  { id: 'card_2', last4: '5893', brand: 'Mastercard', expiry: '03/26' },
]

const STATUS_COLORS = {
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  STK_PUSH_SENT: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  INITIATED: 'bg-slate-100 text-slate-600',
}

export default function PaymentTabs({ onPaymentSuccess }) {
  const [activeTab, setActiveTab] = useState('mpesa')
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCard, setSelectedCard] = useState(SAVED_CARDS[0].id)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const resetState = () => {
    setResult(null)
    setError(null)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    resetState()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const card = SAVED_CARDS.find((c) => c.id === selectedCard)
      const payload = {
        amount: parseFloat(amount),
        phoneNumber: activeTab === 'mpesa' ? phone : `+254${card.last4.padStart(9, '0')}`,
        paymentMethod: activeTab === 'mpesa' ? 'MPESA' : 'CARD',
      }
      const data = await initiatePayment(payload)
      setResult(data)
      setAmount('')
      setPhone('')
      onPaymentSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => handleTabChange('mpesa')}
          className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors ${
            activeTab === 'mpesa'
              ? 'text-green-700 border-b-2 border-green-600 bg-green-50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="mr-2">📱</span>M-Pesa
        </button>
        <button
          onClick={() => handleTabChange('card')}
          className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors ${
            activeTab === 'card'
              ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="mr-2">💳</span>Card
        </button>
      </div>

      {/* Tab body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {activeTab === 'mpesa' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254712345678"
              required
              pattern="^\+?[1-9]\d{6,14}$"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400"
            />
            <p className="mt-1 text-xs text-slate-400">Enter your Safaricom M-Pesa number</p>
          </div>
        )}

        {activeTab === 'card' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Saved Cards
            </label>
            <div className="space-y-2">
              {SAVED_CARDS.map((card) => (
                <label
                  key={card.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedCard === card.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="card"
                    value={card.id}
                    checked={selectedCard === card.id}
                    onChange={() => setSelectedCard(card.id)}
                    className="accent-blue-600"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg">
                      {card.brand === 'Visa' ? '🔵' : '🟠'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {card.brand} •••• •••• •••• {card.last4}
                      </p>
                      <p className="text-xs text-slate-400">Expires {card.expiry}</p>
                    </div>
                  </div>
                  {selectedCard === card.id && (
                    <span className="text-blue-600 text-sm font-medium">Selected</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Amount input shared across tabs */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Amount (KES)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              KES
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              min="1"
              step="0.01"
              className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400"
            />
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
            <p className="font-semibold mb-1">Payment initiated</p>
            <p className="text-xs text-green-600">
              ID: {result.id} &nbsp;|&nbsp;
              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[result.status] ?? ''}`}>
                {result.status}
              </span>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-sm font-semibold text-white transition-all ${
            activeTab === 'mpesa'
              ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? 'Processing…' : activeTab === 'mpesa' ? 'Pay with M-Pesa' : 'Pay with Card'}
        </button>
      </form>
    </div>
  )
}
