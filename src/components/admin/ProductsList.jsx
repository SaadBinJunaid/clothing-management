import { useEffect, useState } from 'react'
import {
  deleteProduct,
  updateProductStock,
  watchProducts,
} from '../../services/products'
import { textToNumber } from '../../services/validation'

// The product list in the admin area. Each row can update its own stock number,
// start an edit in the form above, or delete the product.
//
// Prop:
//   onEditProduct called with the product the seller wants to edit
function ProductsList({ onEditProduct }) {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Text typed into each row's stock box, stored by product id so several rows
  // can be edited at the same time. Example: { 'abc123': '7' }
  const [stockDrafts, setStockDrafts] = useState({})

  useEffect(() => {
    const unsubscribe = watchProducts(
      (loadedProducts) => {
        setProducts(loadedProducts)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load products:', error)
        setErrorMessage('Could not load the products. Please refresh the page.')
        setIsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  function handleStockDraftChange(productId, value) {
    setStockDrafts((previousDrafts) => ({
      ...previousDrafts,
      [productId]: value,
    }))
  }

  async function handleSaveStock(product) {
    const draft = stockDrafts[product.id]
    // If the box was never touched, save the number that is already stored.
    const newStock =
      draft === undefined ? product.stockQuantity : textToNumber(draft)

    try {
      await updateProductStock(product.id, newStock)
      setErrorMessage('')
      setSuccessMessage(`Stock updated for "${product.name}".`)

      // Remove the draft so the box shows the saved value again.
      setStockDrafts((previousDrafts) => {
        const remainingDrafts = { ...previousDrafts }
        delete remainingDrafts[product.id]
        return remainingDrafts
      })
    } catch (error) {
      setErrorMessage(error.message || 'Could not update the stock.')
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`,
    )
    if (!confirmed) return

    try {
      await deleteProduct(product.id)
      setSuccessMessage(`Deleted "${product.name}".`)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(`Could not delete the product: ${error.message}`)
    }
  }

  return (
    <section className="panel">
      <h3>Products and stock</h3>
      <p>
        Stock is always tracked here, even when customers cannot see it. New
        orders automatically lower these numbers.
      </p>

      {errorMessage !== '' && <p className="error-message">{errorMessage}</p>}
      {successMessage !== '' && <p className="success-message">{successMessage}</p>}
      {isLoading && <p>Loading products…</p>}
      {!isLoading && products.length === 0 && <p>No products yet. Add one above.</p>}

      {products.length > 0 && (
        <div className="table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="cell-product">
                    {product.imageUrl !== '' && (
                      <img
                        className="thumb"
                        src={product.imageUrl}
                        alt={product.name}
                      />
                    )}
                    {product.name}
                  </td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>
                    {/* The box starts empty so it shows the live saved number. */}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="stock-input"
                      value={
                        stockDrafts[product.id] === undefined
                          ? String(product.stockQuantity)
                          : stockDrafts[product.id]
                      }
                      onChange={(event) =>
                        handleStockDraftChange(product.id, event.target.value)
                      }
                      aria-label={`Stock for ${product.name}`}
                    />
                    <button
                      type="button"
                      className="small-button"
                      onClick={() => handleSaveStock(product)}
                    >
                      Update stock
                    </button>
                  </td>
                  <td className="cell-actions">
                    <button
                      type="button"
                      className="small-button"
                      onClick={() => onEditProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="small-button danger-button"
                      onClick={() => handleDelete(product)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ProductsList
