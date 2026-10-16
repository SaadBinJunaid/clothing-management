import { useEffect, useState } from 'react'
import { setStockVisibility, watchStockVisibility } from '../../services/settings'

// The seller's "show stock, but only sometimes" switch.
// It reads and writes the single Firestore document settings/stockVisibility.
function StockVisibilityToggle() {
  const [stockVisible, setStockVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const unsubscribe = watchStockVisibility(
      (visible) => {
        setStockVisible(visible)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load the stock visibility setting:', error)
        setErrorMessage('Could not load the stock visibility setting.')
        setIsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  // The checkbox tells us the new value; Firestore then tells every listener,
  // including the shop page, so the change appears for customers right away.
  async function handleToggle(event) {
    const newValue = event.target.checked

    try {
      await setStockVisibility(newValue)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message || 'Could not change the stock visibility.')
    }
  }

  return (
    <section className="panel">
      <h3>Customer stock visibility</h3>
      <p>
        When this is on, customers see how many items are left. Stock is still
        tracked when it is off, so hiding it never stops order checks.
      </p>

      {isLoading && <p>Loading setting…</p>}

      {!isLoading && (
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={stockVisible}
            onChange={handleToggle}
          />
          <span>
            {stockVisible
              ? 'Stock is visible to customers'
              : 'Stock is hidden from customers'}
          </span>
        </label>
      )}

      {errorMessage !== '' && <p className="error-message">{errorMessage}</p>}
    </section>
  )
}

export default StockVisibilityToggle
