import { useEffect, useState } from 'react'
import { addOrder, ORDER_STATUSES, PAYMENT_STATUSES } from '../../services/orders'
import { watchProducts } from '../../services/products'
import { textToNumber } from '../../services/validation'

// The starting values of a fresh, empty order form.
// Quantities are kept as text because that is what input boxes give us.
const EMPTY_FORM = {
  customerName: '',
  customerContact: '',
  productId: '',
  quantity: '1',
  totalAmount: '',
  paymentStatus: 'Unpaid',
  orderStatus: 'Pending',
}

// Suggests a total of price x quantity so the seller does not have to do the
// maths in their head. Returns '' (empty) while the product or quantity is missing.
function suggestTotal(productId, quantityText, products) {
  const product = products.find((item) => item.id === productId)
  const quantity = Number(quantityText)

  if (!product || !Number.isInteger(quantity) || quantity < 1) {
    return ''
  }
  return String(product.price * quantity)
}

// The form where the seller types in an order that arrived through Instagram.
function OrderForm() {
  const [products, setProducts] = useState([])
  const [formValues, setFormValues] = useState(EMPTY_FORM)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // The "which product?" dropdown needs the product list.
  useEffect(() => {
    const unsubscribe = watchProducts(setProducts, (error) => {
      console.error('Could not load products for the order form:', error)
    })
    return unsubscribe
  }, [])

  // One handler for every field, because each input has a name="..." attribute
  // that matches its key in formValues (for example name="customerName").
  function handleChange(event) {
    const { name, value } = event.target

    setFormValues((previousValues) => {
      const updatedValues = { ...previousValues, [name]: value }

      // When the product or quantity changes, offer a fresh suggested total.
      // The seller can still overwrite it, for example after agreeing a discount.
      if (name === 'productId' || name === 'quantity') {
        updatedValues.totalAmount = suggestTotal(
          updatedValues.productId,
          updatedValues.quantity,
          products,
        )
      }
      return updatedValues
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      await addOrder({
        customerName: formValues.customerName,
        customerContact: formValues.customerContact,
        source: 'Instagram',
        productId: formValues.productId,
        quantity: textToNumber(formValues.quantity),
        // A blank total is allowed and stored as 0.
        totalAmount:
          formValues.totalAmount.trim() === ''
            ? 0
            : textToNumber(formValues.totalAmount),
        paymentStatus: formValues.paymentStatus,
        orderStatus: formValues.orderStatus,
      })

      setSuccessMessage('Order saved.')
      setFormValues(EMPTY_FORM)
    } catch (error) {
      // The service explains what went wrong, for example "not enough stock".
      setErrorMessage(error.message || 'Could not save the order.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="panel">
      <h3>Add an Instagram order</h3>
      <p>Record an order the customer sent you in a DM.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Customer name</span>
          <input
            type="text"
            name="customerName"
            value={formValues.customerName}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-field">
          <span>Customer contact (Instagram handle, phone or email)</span>
          <input
            type="text"
            name="customerContact"
            value={formValues.customerContact}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-field">
          <span>Product</span>
          <select
            name="productId"
            value={formValues.productId}
            onChange={handleChange}
            required
          >
            <option value="">-- choose a product --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.stockQuantity} in stock)
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Quantity</span>
          <input
            type="number"
            name="quantity"
            min="1"
            step="1"
            value={formValues.quantity}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-field">
          <span>Total amount (suggested, you can change it)</span>
          <input
            type="number"
            name="totalAmount"
            min="0"
            step="0.01"
            value={formValues.totalAmount}
            onChange={handleChange}
          />
        </label>

        <label className="form-field">
          <span>Payment status</span>
          <select
            name="paymentStatus"
            value={formValues.paymentStatus}
            onChange={handleChange}
          >
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Order status</span>
          <select
            name="orderStatus"
            value={formValues.orderStatus}
            onChange={handleChange}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <p className="form-hint">
          Order source: Instagram. Payment and order status are kept separate, so
          finishing an order never marks it as paid.
        </p>

        {errorMessage !== '' && <p className="error-message">{errorMessage}</p>}
        {successMessage !== '' && <p className="success-message">{successMessage}</p>}

        <button type="submit" className="primary-button" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save order'}
        </button>
      </form>
    </section>
  )
}

export default OrderForm
