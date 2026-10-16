// Firestore operations for shop-wide settings.
// Right now there is one setting: whether customers may see stock numbers.
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, FIREBASE_SETUP_MESSAGE } from '../firebase'

const SETTINGS_COLLECTION = 'settings'

// The document path is settings/stockVisibility:
//   visible   true  = customers see stock
//             false = customers see no stock information at all
//   updatedAt when the seller last flipped the switch
const STOCK_VISIBILITY_DOCUMENT = 'stockVisibility'

// Listen for the switch being flipped. It calls onChange(true) or onChange(false).
// If the document does not exist yet, stock is simply treated as hidden, which
// matches the seller's wish to show stock "only sometimes".
export function watchStockVisibility(onChange, onError) {
  if (!db) return () => {}

  const settingRef = doc(db, SETTINGS_COLLECTION, STOCK_VISIBILITY_DOCUMENT)

  return onSnapshot(
    settingRef,
    (documentSnapshot) => {
      const setting = documentSnapshot.data()
      onChange(Boolean(setting && setting.visible))
    },
    onError,
  )
}

// Turn customer-facing stock information on or off.
export async function setStockVisibility(visible) {
  if (typeof visible !== 'boolean') {
    throw new Error('Visibility must be either true or false.')
  }
  if (!db) throw new Error(FIREBASE_SETUP_MESSAGE)

  await setDoc(doc(db, SETTINGS_COLLECTION, STOCK_VISIBILITY_DOCUMENT), {
    visible,
    updatedAt: serverTimestamp(),
  })
}
