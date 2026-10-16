import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { auth } from './firebase'
import './App.css'
import SiteHeader from './components/SiteHeader'
import ShopPage from './pages/ShopPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'

// App handles routing and keeps track of the signed-in admin user.
// - Routes give us real URLs like /, /login, /admin (refresh-safe, sharable).
// - We still check Firebase auth on startup so a returning session works.
// - routerWrapper is optional: in browser we use BrowserRouter; in SSR tests
//   we pass StaticRouter so we don't nest routers.
function App({ routerWrapper: RouterWrapper = BrowserRouter }) {
  const [adminUser, setAdminUser] = useState(null)
  // Firebase needs a moment to check for an existing session after a refresh.
  // When Firebase is not configured there is nothing to check, so start false.
  const [isCheckingLogin, setIsCheckingLogin] = useState(auth !== null)

  // onAuthStateChanged tells us who is logged in (or null) as soon as the app
  // starts and again after every login or logout.
  useEffect(() => {
    if (!auth) {
      // No .env file yet, so there is nobody to check for.
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user)
      setIsCheckingLogin(false)
    })

    // Stop listening when this component disappears.
    return unsubscribe
  }, [])

  // Called by the "Log out" button in the header.
  async function handleLogout() {
    if (auth) {
      await signOut(auth)
    }
    // After logging out, go back to the shop page.
  }

  return (
    <RouterWrapper>
      <div className="app">
        {/* Header shows navigation links and login/logout actions. */}
        <SiteHeader adminUser={adminUser} onLogout={handleLogout} />

        <main className="page-content">
          <Routes>
            {/* Shop page — public, always available. */}
            <Route path="/" element={<ShopPage />} />

            {/* Login page — if already logged in, go straight to admin dashboard. */}
            <Route
              path="/login"
              element={
                isCheckingLogin ? (
                  <p className="page-section">Checking your login…</p>
                ) : adminUser ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <AdminLoginPage />
                )
              }
            />

            {/* Admin dashboard — only for signed-in admins. If not logged in, send to login. */}
            <Route
              path="/admin"
              element={
                isCheckingLogin ? (
                  <p className="page-section">Checking your login…</p>
                ) : adminUser ? (
                  <AdminDashboardPage adminUser={adminUser} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Unknown URLs go back to the shop. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </RouterWrapper>
  )
}

export default App
