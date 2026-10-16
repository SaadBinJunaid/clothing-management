// One product on the shop page.
// Props:
//   product   the product object from Firestore
//   showStock true when the seller allows customers to see stock numbers
function ProductCard({ product, showStock }) {
  const isSoldOut = product.stockQuantity === 0

  return (
    <article className="product-card">
      {product.imageUrl !== '' && (
        <img
          className="product-image"
          src={product.imageUrl}
          alt={product.name}
        />
      )}

      {/* Products may have no picture; show a simple placeholder instead. */}
      {product.imageUrl === '' && (
        <div className="product-image product-image-missing">No image</div>
      )}

      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">${product.price.toFixed(2)}</p>

      {/* The stock line only appears when the seller turned visibility on. */}
      {showStock && (
        <p className="product-stock">
          {isSoldOut ? 'Out of stock' : `${product.stockQuantity} in stock`}
        </p>
      )}
    </article>
  )
}

export default ProductCard
