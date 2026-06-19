import { useState, useEffect } from 'react'
import PaymentTabs from './components/PaymentTabs'
import RecentPayments from './components/RecentPayments'
import LoginScreen from './components/LoginScreen'
import { setAuthToken, clearAuthToken } from './api/payments'

export default function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('auth_token')
    const username = localStorage.getItem('auth_username')
    return token ? { token, username } : null
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (user?.token) setAuthToken(user.token)
  }, [user])

  const handleLogin = (token, username) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_username', username)
    setAuthToken(token)
    setUser({ token, username })
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_username')
    clearAuthToken()
    setUser(null)
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              P
            </div>
            <span className="text-base font-semibold text-slate-800">PayApp</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-sm text-slate-600 hidden sm:block">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors px-2 py-1 rounded hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Renew Your Subscription</h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose a plan and complete your payment to continue enjoying uninterrupted access.
          </p>
        </div>

        <div className="flex gap-6 items-start">
          <div className="w-full max-w-lg shrink-0">
            <PaymentTabs onPaymentSuccess={() => setRefreshTrigger((n) => n + 1)} />
          </div>
          <div className="flex-1 min-w-0">
            <RecentPayments refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  )
}
