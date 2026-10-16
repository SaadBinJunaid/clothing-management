import { useState } from 'react'
import OrderForm from '../components/admin/OrderForm'
import OrdersTable from '../components/admin/OrdersTable'
import ProductForm from '../components/admin/ProductForm'
import ProductsList from '../components/admin/ProductsList'
import StockVisibilityToggle from '../components/admin/StockVisibilityToggle'

// The seller's home base, with two tabs: orders and products/stock.
// This page can only be reached with a logged-in admin (App checks that).
function AdminDashboardPage({ adminUser }) {
  // Which tab is open right now: 'orders' or 'products'.
  const [activeTab, setActiveTab] = useState('orders')

  // The product currently being edited, or null while adding a new product.
  // It lives here so the form and the product list stay in sync.
  const [editingProduct, setEditingProduct] = useState(null)

  return (
    <section className="page-section">
      <h2>Admin dashboard</h2>
      <p className="page-intro">Signed in as {adminUser.email}</p>

      <div className="tab-buttons">
        <button
          type="button"
          className={activeTab === 'orders' ? 'tab-button tab-button-active' : 'tab-button'}
          onClick={() => setActiveTab('orders')}
        >
          Instagram orders
        </button>
        <button
          type="button"
          className={activeTab === 'products' ? 'tab-button tab-button-active' : 'tab-button'}
          onClick={() => setActiveTab('products')}
        >
          Products and stock
        </button>
      </div>

      {activeTab === 'orders' && (
        <>
          <OrderForm />
          <OrdersTable />
        </>
      )}

      {activeTab === 'products' && (
        <>
          <StockVisibilityToggle />
          <ProductForm
            key={editingProduct === null ? 'new' : editingProduct.id}
            editingProduct={editingProduct}
            onDoneEditing={() => setEditingProduct(null)}
          />
          <ProductsList onEditProduct={setEditingProduct} />
        </>
      )}
    </section>
  )
}

export default AdminDashboardPage
