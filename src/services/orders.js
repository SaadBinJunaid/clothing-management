// All Cloud Firestore operations for orders live here.
// Orders are recorded by hand from Instagram DMs, so this file is the heart of
// the seller's "who paid?" tracking.
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db, FIREBASE_SETUP_MESSAGE } from '../firebase'
import { isNonEmptyText, isNumberAtLeastZero } from './validation'

const ORDERS_COLLECTION = 'orders'
const PRODUCTS_COLLECTION = 'products'

// The only values the app accepts for the two status fields.
// Keeping them in one place avoids typos like "paid" vs "Paid".
export const PAYMENT_STATUSES = ['Paid', 'Unpaid']
export const ORDER_STATUSES = ['Pending', 'Processing', 'Completed']

function toOrder(documentSnapshot) {
  return { id: documentSnapshot.id, ...documentSnapshot.data() }
}

// Listen for order changes; newest order first. Returns an unsubscribe function.
export function watchOrders(onChange, onError) {
  if (!db) return () => {}

  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    ordersQuery,
    (snapshot) => onChange(snapshot.docs.map(toOrder)),
    onError,
  )
}

// Make sure the order the seller typed in is complete and sensible.
function checkOrderInput(order) {
  if (!isNonEmptyText(order.customerName)) {
    throw new Error('Customer name is required.')
  }
  if (!isNonEmptyText(order.customerContact)) {
    throw new Error('Customer contact is required.')
  }
  if (!isNonEmptyText(order.productId)) {
    throw new Error('Please choose which product was ordered.')
  }
  if (!Number.isInteger(order.quantity) || order.quantity < 1) {
    throw new Error('Quantity must be a whole number of 1 or more.')
  }
  if (!isNumberAtLeastZero(order.totalAmount)) {
    throw new Error('Total amount must be a number of 0 or more.')
  }
  if (!PAYMENT_STATUSES.includes(order.paymentStatus)) {
    throw new Error('Payment status must be "Paid" or "Unpaid".')
  }
  if (!ORDER_STATUSES.includes(order.orderStatus)) {
    throw new Error('Order status must be Pending, Processing or Completed.')
  }
}

// Save a manually entered Instagram order.
//
// Two things are checked before saving, because the app must not accept an order
// for clothes that are not there: the product must still exist, and the ordered
// quantity must not be greater than the stock on hand.
//
// The save runs inside a Firestore transaction. A transaction reads the stock,
// checks it and writes the order and the new stock number as one indivisible
// step, and it automatically retries if someone else changed the stock at the
// same moment. That makes it impossible for two orders to sell the same item.
export async function addOrder(order) {
  checkOrderInput(order)
  if (!db) throw new Error(FIREBASE_SETUP_MESSAGE)

  const productRef = doc(db, PRODUCTS_COLLECTION, order.productId)
  // A reference with a new id, created locally; the write happens in the transaction.
  const newOrderRef = doc(collection(db, ORDERS_COLLECTION))

  await runTransaction(db, async (transaction) => {
    const productSnapshot = await transaction.get(productRef)

    if (!productSnapshot.exists()) {
      throw new Error('That product no longer exists.')
    }

    const product = productSnapshot.data()
    if (order.quantity > product.stockQuantity) {
      throw new Error(
        `Only ${product.stockQuantity} left in stock for "${product.name}".`,
      )
    }

    transaction.set(newOrderRef, {
      customerName: order.customerName.trim(),
      customerContact: order.customerContact.trim(),
      // Orders arrive from Instagram for now; the field is stored so other
      // sources can be added later without changing the structure.
      source: order.source || 'Instagram',
      // productId is the stable link to the product, productName is a copy taken
      // now so old orders stay readable even if the product is renamed.
      productId: order.productId,
      productName: product.name,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      // The two statuses are stored separately on purpose.
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: serverTimestamp(),
    })

    transaction.update(productRef, {
      stockQuantity: product.stockQuantity - order.quantity,
    })
  })
}

// Mark an order as Paid or Unpaid.
// Only paymentStatus changes here — completing an order must never silently
// change whether it was paid, so this function and the one below stay separate.
export async function updatePaymentStatus(orderId, paymentStatus) {
  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new Error('Unknown payment status.')
  }
  if (!db) throw new Error(FIREBASE_SETUP_MESSAGE)

  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { paymentStatus })
}

// Move an order through Pending -> Processing -> Completed.
export async function updateOrderStatus(orderId, orderStatus) {
  if (!ORDER_STATUSES.includes(orderStatus)) {
    throw new Error('Unknown order status.')
  }
  if (!db) throw new Error(FIREBASE_SETUP_MESSAGE)

  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { orderStatus })
}
