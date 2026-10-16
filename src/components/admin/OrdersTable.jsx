import { useEffect, useState } from 'react'
import {
  ORDER_STATUSES,
  updateOrderStatus,
  updatePaymentStatus,
  watchOrders,
} from '../../services/orders'

// Firestore stores dates as Timestamp objects. toDate() turns one into a normal
// JavaScript Date so we can show it. A brand-new order can briefly have no
// createdAt, because the server timestamp arrives a moment after saving.
function formatDate(createdAt) {
  if (!createdAt || typeof createdAt.toDate !== 'function') {
    return 'Just now'
  }
  return createdAt.toDate().toLocaleDateString()
}

// Gives each payment/order status its own colour in the table.
function paymentBadgeClass(paymentStatus) {
  if (paymentStatus === 'Paid') return 'badge badge-paid'
  return 'badge badge-unpaid'
}

function orderBadgeClass(orderStatus) {
  if (orderStatus === 'Completed') return 'badge badge-completed'
  if (orderStatus === 'Processing') return 'badge badge-processing'
  return 'badge badge-pending'
}

// The list of every saved order, with the two status controls the seller needs.
function OrdersTable() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Keep the table in sync with Firestore, newest order first.
  useEffect(() => {
    const unsubscribe = watchOrders(
      (loadedOrders) => {
        setOrders(loadedOrders)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load orders:', error)
        setErrorMessage('Could not load the orders. Please refresh the page.')
        setIsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  // Flip between Paid and Unpaid. This changes paymentStatus only.
  async function handlePaymentToggle(order) {
    const nextPaymentStatus = order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'

    try {
      await updatePaymentStatus(order.id, nextPaymentStatus)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(`Could not update the payment status: ${error.message}`)
    }
  }

  // Move the order along (Pending, Processing, Completed). This changes
  // orderStatus only, so it never affects whether the customer has paid.
  async function handleOrderStatusChange(order, event) {
    try {
      await updateOrderStatus(order.id, event.target.value)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(`Could not update the order status: ${error.message}`)
    }
  }

  return (
    <section className="panel">
      <h3>Saved orders</h3>

      {errorMessage !== '' && <p className="error-message">{errorMessage}</p>}
      {isLoading && <p>Loading orders…</p>}
      {!isLoading && orders.length === 0 && (
        <p>No orders saved yet. Add the first one above.</p>
      )}

      {orders.length > 0 && (
        <div className="table-scroll">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Order status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.customerName}</td>
                  <td>{order.customerContact}</td>
                  <td>{order.source}</td>
                  <td>{order.productName}</td>
                  <td>{order.quantity}</td>
                  <td>${Number(order.totalAmount).toFixed(2)}</td>
                  <td>
                    <span className={paymentBadgeClass(order.paymentStatus)}>
                      {order.paymentStatus}
                    </span>
                    <button
                      type="button"
                      className="small-button"
                      onClick={() => handlePaymentToggle(order)}
                    >
                      {order.paymentStatus === 'Paid' ? 'Mark unpaid' : 'Mark paid'}
                    </button>
                  </td>
                  <td>
                    <span className={orderBadgeClass(order.orderStatus)}>
                      {order.orderStatus}
                    </span>
                    <select
                      value={order.orderStatus}
                      onChange={(event) => handleOrderStatusChange(order, event)}
                      aria-label="Order status"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
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

export default OrdersTable
