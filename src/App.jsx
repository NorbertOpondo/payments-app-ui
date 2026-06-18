import { useState } from 'react'
import PaymentTabs from './components/PaymentTabs'
import RecentPayments from './components/RecentPayments'

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePaymentSuccess = () => {
    setRefreshTrigger((n) => n + 1)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              P
            </div>
            <span className="text-base font-semibold text-slate-800">PayApp</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
              N
            </div>
            <span className="text-sm text-slate-600 hidden sm:block">Norbert</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Make a Payment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose your preferred payment method below
          </p>
        </div>

        {/* Payment form */}
        <div className="max-w-lg">
          <PaymentTabs onPaymentSuccess={handlePaymentSuccess} />
        </div>

        {/* Recent payments table */}
        <RecentPayments refreshTrigger={refreshTrigger} />
      </main>
    </div>
  )
}
