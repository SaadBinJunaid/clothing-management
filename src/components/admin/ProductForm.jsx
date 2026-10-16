import { useState } from 'react'
import { addProduct, updateProduct } from '../../services/products'
import { textToNumber } from '../../services/validation'

// What an empty product form looks like. Inputs hold text, so numbers are text too.
const EMPTY_FORM = {
  name: '',
  price: '',
  imageUrl: '',
  stockQuantity: '',
}

// Turns a product from Firestore into the text values the form inputs need.
// When nothing is being edited yet, the form starts empty.
function formValuesFromProduct(product) {
  if (product === null) {
    return EMPTY_FORM
  }
  return {
    name: product.name,
    price: String(product.price),
    imageUrl: product.imageUrl || '',
    stockQuantity: String(product.stockQuantity),
  }
}

// One form for both jobs: adding a new product and editing an existing one.
//
// Props:
//   editingProduct the product being edited, or null when adding
//   onDoneEditing  tells the dashboard the edit finished, so the form can go
//                  back to its empty "add product" state
//
// The dashboard gives this form a "key". When the seller clicks Edit on a
// different product, the key changes, so React throws this form away and builds
// a fresh one — which is the simplest way to load different values into inputs.
function ProductForm({ editingProduct, onDoneEditing }) {
  // Passing a function to useState means "work this out once, on first render".
  const [formValues, setFormValues] = useState(() =>
    formValuesFromProduct(editingProduct),
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = editingProduct !== null

  function handleChange(event) {
    const { name, value } = event.target
    setFormValues((previousValues) => ({ ...previousValues, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSaving(true)

    const product = {
      name: formValues.name,
      price: textToNumber(formValues.price),
      imageUrl: formValues.imageUrl.trim(),
      stockQuantity: textToNumber(formValues.stockQuantity),
    }

    try {
      if (isEditing) {
        await updateProduct(editingProduct.id, product)
        // Stay in edit mode so the "Product updated." message stays visible.
        // "Cancel edit" returns the form to its empty state.
        setSuccessMessage('Product updated.')
      } else {
        await addProduct(product)
        setSuccessMessage('Product added.')
        setFormValues(EMPTY_FORM)
      }
    } catch (error) {
      setErrorMessage(error.message || 'Could not save the product.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="panel">
      <h3>{isEditing ? `Edit "${editingProduct.name}"` : 'Add a product'}</h3>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Product name</span>
          <input
            type="text"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-field">
          <span>Price in dollars</span>
          <input
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={formValues.price}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-field">
          <span>Image URL (optional)</span>
          <input
            type="text"
            name="imageUrl"
            value={formValues.imageUrl}
            onChange={handleChange}
            placeholder="https://…"
          />
        </label>

        <label className="form-field">
          <span>Stock quantity</span>
          <input
            type="number"
            name="stockQuantity"
            min="0"
            step="1"
            value={formValues.stockQuantity}
            onChange={handleChange}
            required
          />
        </label>

        {errorMessage !== '' && <p className="error-message">{errorMessage}</p>}
        {successMessage !== '' && <p className="success-message">{successMessage}</p>}

        <div className="button-row">
          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Add product'}
          </button>

          {isEditing && (
            <button
              type="button"
              className="secondary-button"
              onClick={onDoneEditing}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

export default ProductForm
