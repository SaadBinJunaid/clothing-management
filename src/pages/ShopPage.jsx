import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { FIREBASE_SETUP_MESSAGE, isFirebaseConfigured } from '../firebase'
import { watchProducts } from '../services/products'
import { watchStockVisibility } from '../services/settings'

// The customer-facing page. Anyone can open it, even without logging in.
function ShopPage() {
  // State = values that change over time. When one of these changes, React
  // draws the page again with the new values.
  const [products, setProducts] = useState([])
  const [stockVisible, setStockVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // useEffect runs the code inside it after the page first appears.
  // Here it starts two Firestore listeners, so the shop updates by itself
  // whenever the seller changes a product or the stock switch.
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined

    const unsubscribeProducts = watchProducts(
      (loadedProducts) => {
        setProducts(loadedProducts)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load products:', error)
        setErrorMessage('Could not load the products. Please try again later.')
        setIsLoading(false)
      },
    )

    const unsubscribeSetting = watchStockVisibility(setStockVisible, (error) => {
      console.error('Could not load the stock visibility setting:', error)
    })

    // This cleanup function runs when the page is closed and stops the listeners.
    return () => {
      unsubscribeProducts()
      unsubscribeSetting()
    }
  }, [])

  // Without Firebase keys there is no shop data to show, so explain what is
  // missing instead of showing a broken page.
  if (!isFirebaseConfigured) {
    return (
      <section className="page-section">
        <h2>Shop</h2>
        <p className="notice">{FIREBASE_SETUP_MESSAGE}</p>
      </section>
    )
  }

  return (
    <section className="page-section">
      {/* A small welcome banner. Purely presentational — no new features. */}
      <div className="shop-hero">
        <h2>New pieces, fresh from Instagram</h2>
        <p>
          Browse what is available below, then send us a message on Instagram to
          order. Prices are shown in dollars.
        </p>
      </div>

      {errorMessage !== '' && <p className="error-message">{errorMessage}</p>}
      {isLoading && <p>Loading products…</p>}

      {!isLoading && products.length === 0 && (
        <p>No products are listed yet. Please check back soon.</p>
      )}

      <div className="product-grid">
        {/* props carry data down into the child component */}
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showStock={stockVisible}
          />
        ))}
      </div>
    </section>
  )
}

export default ShopPage
