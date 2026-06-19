import { useState, useRef, useEffect } from 'react'
import { initiatePayment, getTransaction } from '../api/payments'

const MANUAL_PAYMENT = {
  paybill: '400200',
  account: 'PAYAPP001',
}

const PLANS = [
  { id: 'basic', name: 'Basic', price: 500, description: 'Essential features for individuals' },
  { id: 'premium', name: 'Premium', price: 1500, description: 'Advanced tools for power users' },
  { id: 'enterprise', name: 'Enterprise', price: 5000, description: 'Full access for teams' },
]

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

const TERMINAL = new Set(['COMPLETED', 'FAILED'])
const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 15

export default function PaymentTabs({ onPaymentSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]) // default: Premium
  const [activeTab, setActiveTab] = useState('mpesa')
  const [phone, setPhone] = useState('')
  const [selectedCard, setSelectedCard] = useState(SAVED_CARDS[0].id)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  const idempotencyKeyRef = useRef(null)

  useEffect(() => {
    return () => clearPollInterval()
  }, [])

  const clearPollInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startPolling = (id) => {
    setPolling(true)
    setPollCount(0)
    let count = 0
    intervalRef.current = setInterval(async () => {
      count++
      setPollCount(count)
      try {
        const data = await getTransaction(id)
        setResult(data)
        if (TERMINAL.has(data.status) || count >= MAX_POLLS) {
          clearPollInterval()
          setPolling(false)
          onPaymentSuccess()
          if (!TERMINAL.has(data.status)) {
            setError('Payment confirmation timed out. Please check your transaction history.')
          }
        }
      } catch (err) {
        clearPollInterval()
        setPolling(false)
        setError(err.message)
      }
    }, POLL_INTERVAL_MS)
  }

  const resetForm = () => {
    clearPollInterval()
    idempotencyKeyRef.current = null
    setPolling(false)
    setPollCount(0)
    setResult(null)
    setError(null)
    setPhone('')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const card = SAVED_CARDS.find((c) => c.id === selectedCard)
      const payload = {
        amount: selectedPlan.price,
        phoneNumber: activeTab === 'mpesa' ? phone : `+254${card.last4.padStart(9, '0')}`,
        paymentMethod: activeTab === 'mpesa' ? 'MPESA' : 'CARD',
      }
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID()
      }
      const data = await initiatePayment(payload, idempotencyKeyRef.current)
      setResult(data)
      setPhone('')
      onPaymentSuccess()

      if (activeTab === 'mpesa' && !TERMINAL.has(data.status)) {
        startPolling(data.id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const planSelector = (
    <div className="p-5 border-b border-slate-100 space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Plan</p>
      <div className="space-y-2">
        {PLANS.map((plan) => (
          <label
            key={plan.id}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
              selectedPlan.id === plan.id
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="plan"
                checked={selectedPlan.id === plan.id}
                onChange={() => setSelectedPlan(plan)}
                className="accent-green-600"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{plan.name}</p>
                <p className="text-xs text-slate-400">{plan.description}</p>
              </div>
            </div>
            <span className={`text-sm font-bold ${selectedPlan.id === plan.id ? 'text-green-600' : 'text-slate-700'}`}>
              KES {plan.price.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )

  const tabHeaders = (
    <div className="flex border-b border-slate-200">
      <button
        onClick={() => handleTabChange('mpesa')}
        className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors ${
          activeTab === 'mpesa'
            ? 'text-green-700 border-b-2 border-green-600 bg-green-50'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
      >
        <span className="mr-2"></span>M-Pesa
      </button>
      <button
        onClick={() => handleTabChange('card')}
        className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors ${
          activeTab === 'card'
            ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
      >
        <span className="mr-2"></span>Card
      </button>
    </div>
  )

  // Waiting for PIN screen
  if (polling) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {planSelector}
        {tabHeaders}
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Waiting for M-Pesa PIN</h3>
          <p className="text-sm text-slate-500 mb-1">
            An STK push was sent to{' '}
            <span className="font-medium text-slate-700">{result?.phoneNumber}</span>
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Enter your PIN to confirm your <span className="font-medium">{selectedPlan.name}</span> subscription renewal.
          </p>
          <div className="flex justify-center gap-1.5 mb-5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-green-400 animate-bounce"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mb-6">Checking status ({pollCount}/{MAX_POLLS})</p>
          <button
            onClick={resetForm}
            className="text-sm text-slate-400 hover:text-slate-600 underline transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Done screen (terminal state after polling)
  if (result && TERMINAL.has(result.status)) {
    const success = result.status === 'COMPLETED'
    const receiptNumber = result.receiptNumber ?? null
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {planSelector}
        {tabHeaders}
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${success ? 'bg-green-100' : 'bg-red-100'}`}>
            <span className="text-3xl">{success ? '✅' : '❌'}</span>
          </div>
          <h3 className={`text-base font-semibold mb-1 ${success ? 'text-green-700' : 'text-red-600'}`}>
            {success ? `${selectedPlan.name} Plan Renewed!` : 'M-Pesa Payment Failed'}
          </h3>
          {success && (
            <p className="text-sm text-slate-500 mb-2">
              Your <span className="font-medium">{selectedPlan.name}</span> subscription is now active.
            </p>
          )}
          {receiptNumber && (
            <p className="text-xs text-slate-500 mb-1">
              Receipt: <span className="font-mono font-medium text-slate-700">{receiptNumber}</span>
            </p>
          )}
          <p className="text-xs text-slate-400 mb-1">
            Transaction ID: <span className="font-mono">{result.id}</span>
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Amount: <span className="font-medium">KES {Number(result.amount).toFixed(2)}</span>
          </p>

          {!success && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-3">Pay manually via M-Pesa</p>
              <ol className="text-xs text-amber-700 space-y-1 mb-4 list-decimal list-inside">
                <li>Go to M-Pesa &rarr; Lipa na M-Pesa &rarr; Pay Bill</li>
                <li>Enter the business number and account below</li>
                <li>Enter the exact amount and your PIN</li>
              </ol>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600 font-medium mb-1">Paybill</p>
                  <p className="text-base font-bold text-slate-800 font-mono">{MANUAL_PAYMENT.paybill}</p>
                </div>
                <div className="bg-white border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600 font-medium mb-1">Account</p>
                  <p className="text-base font-bold text-slate-800 font-mono">{MANUAL_PAYMENT.account}</p>
                </div>
                <div className="bg-white border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600 font-medium mb-1">Amount</p>
                  <p className="text-base font-bold text-slate-800 font-mono">KES {Number(result.amount).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={resetForm}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              success
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500'
            }`}
          >
            {success ? 'Done' : 'Try Again'}
          </button>
        </div>
      </div>
    )
  }

  // Default: plan + payment form
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {planSelector}
      {tabHeaders}

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Selected plan summary */}
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs text-indigo-500 font-medium">Renewing</p>
            <p className="text-sm font-semibold text-indigo-800">{selectedPlan.name} Plan</p>
          </div>
          <p className="text-lg font-bold text-indigo-700">
            KES {selectedPlan.price.toLocaleString()}
            <span className="text-xs font-normal text-indigo-400">/mo</span>
          </p>
        </div>

        {activeTab === 'mpesa' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              M-Pesa Phone Number
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Saved Cards</label>
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
                    <span className="text-lg">{card.brand === 'Visa' ? '🔵' : '🟠'}</span>
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

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {result && !TERMINAL.has(result.status) && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
            <p className="font-semibold mb-1">Renewal initiated</p>
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
          {loading
            ? 'Processing…'
            : activeTab === 'mpesa'
            ? `Renew with M-Pesa · KES ${selectedPlan.price.toLocaleString()}`
            : `Renew with Card · KES ${selectedPlan.price.toLocaleString()}`}
        </button>
      </form>
    </div>
  )
}
