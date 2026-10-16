import { useState } from 'react'
import { useNavigate } from 'react-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, FIREBASE_SETUP_MESSAGE, isFirebaseConfigured } from '../firebase'

// Turns Firebase's technical error codes into something a shop owner understands.
function readableLoginError(error) {
  const wrongDetails =
    error.code === 'auth/invalid-credential' ||
    error.code === 'auth/wrong-password' ||
    error.code === 'auth/user-not-found' ||
    error.code === 'auth/invalid-email'

  if (wrongDetails) {
    return 'Wrong email or password. Please try again.'
  }
  if (error.code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  return 'Could not log in. Check your internet connection and try again.'
}

// The only way into the admin area. There are no customer accounts in this app.
function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    // Forms reload the page by default, which would lose our React state.
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      // Firebase checks the email/password pair and starts a login session.
      await signInWithEmailAndPassword(auth, email, password)
      // On success, go to the admin dashboard.
      navigate('/admin')
    } catch (error) {
      setErrorMessage(readableLoginError(error))
    } finally {
      // Always allow another attempt, whether it worked or not.
      setIsSubmitting(false)
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <section className="page-section">
        <h2>Admin login</h2>
        <p className="notice">{FIREBASE_SETUP_MESSAGE}</p>
      </section>
    )
  }

  return (
    <section className="page-section">
      <h2>Admin login</h2>
      <p className="page-intro">
        For the shop owner only. Customers do not need an account.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="form-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {errorMessage !== '' && <p className="error-message">{errorMessage}</p>}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </section>
  )
}

export default AdminLoginPage
