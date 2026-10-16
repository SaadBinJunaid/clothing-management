// All Cloud Firestore operations for products are kept in this one file.
// Components then just call simple functions like addProduct() or updateProductStock()
// instead of knowing anything about Firestore itself.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db, FIREBASE_SETUP_MESSAGE } from '../firebase'
import { isNonEmptyText, isNumberAtLeastZero, isWholeNumber } from './validation'

// The Firestore collection that stores clothing products.
const PRODUCTS_COLLECTION = 'products'

// Firestore gives us heavy document snapshots. This turns one into a plain
// object we can use in React, with the document id added, e.g.
// { id: 'abc123', name: 'Linen Dress', price: 25, stockQuantity: 4 }
function toProduct(documentSnapshot) {
  return { id: documentSnapshot.id, ...documentSnapshot.data() }
}

// Listen for product changes. Whenever anything changes in Firestore,
// onChange(products) runs and the React state updates on its own.
// It returns an "unsubscribe" function that the component calls when it leaves
// the screen, so the app stops listening and does not leak memory.
export function watchProducts(onChange, onError) {
  // Without a configured .env there is no database to listen to.
  if (!db) return () => {}

  const productsQuery = query(
    collection(db, PRODUCTS_COLLECTION),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    productsQuery,
    (snapshot) => onChange(snapshot.docs.map(toProduct)),
    onError,
  )
}

// Check the fields every product must have. Throws a readable Error when
// something is wrong so the form can show the message to the seller.
function checkProductInput(product) {
  if (!isNonEmptyText(product.name)) {
    throw new Error('Product name is required.')
  }
  if (!isNumberAtLeastZero(product.price)) {
    throw new Error('Price must be a number of 0 or more.')
  }
  if (!isWholeNumber(product.stockQuantity)) {
    throw new Error('Stock must be a whole number of 0 or more.')
  }
}

// Add a brand-new product to the shop.
export async function addProduct(product) {
  checkProductInput(product)
  if (!db) throw new Error(FIREBASE_SETUP_MESSAGE)

  await addDoc(collection(db, PRODUCTS_COLLECTION), {
    name: product.name.trim(),
    price: product.price,
    imageUrl: product.imageUrl || '',
    stockQuantity: product.stockQuantity,
    // serverTimestamp() lets Firestore write the exact server time.
    createdAt: serverTimestamp(),
  })
}

// Save changes to an existing product (name, price, image, stock).
export async function updateProduct(productId, product) {
  checkProductInput(product)
  if (!db) throw new Error(FIREBASE_SETUP_MESSAGE)

  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
    name: product.name.trim(),
    price: product.price,
    imageUrl: product.imageUrl || '',
    stockQuantity: product.stockQuantity,
  })
}

// Change only the stock number. Used by the quick "Update stock" button.
export async function updateProductStock(productId, stockQuantity) {
  if (!isWholeNumber(stockQuantity)) {
    throw new Error('Stock must be a whole number of 0 or more.')
  }
  if (!db) throw new Error(FIREBASE_SETUP_MESSAGE)

  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), { stockQuantity })
}

// Remove a product the seller no longer wants to list.
export async function deleteProduct(productId) {
  if (!db) throw new Error(FIREBASE_SETUP_MESSAGE)
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId))
}
