import React, { useState, useEffect } from 'react';
import { getAllProducts } from '../services/productService';
import { recordSale } from '../services/salesService';
import Card from '../components/card';
import Button from '../components/button';
import Modal from '../components/modal';

export const Storefront = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Shopping Cart state
  const [cart, setCart] = useState([]);
  
  // Checkout States
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading storefront products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by search query and category
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        // Check if adding exceeds inventory
        if (existing.quantity >= product.stock) {
          alert(`Cannot exceed available inventory (${product.stock} units)`);
          return prevCart;
        }
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, newQuantity, maxStock) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > maxStock) {
      alert(`Cannot exceed available inventory (${maxStock} units)`);
      return;
    }
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    
    // Prepare backend payload: { items: [ { product_id: X, quantity: Y } ] }
    const payload = {
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      const saleResult = await recordSale(payload);
      setReceipt(saleResult);
      setIsCheckoutModalOpen(true);
      clearCart();
      // Reload products to get updated stock counts
      await fetchProducts();
    } catch (error) {
      console.error('Checkout failed:', error);
      setCheckoutError(
        error.response?.data?.detail || 
        'An unexpected error occurred during checkout. Please verify stock counts.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="pos-layout-container animate-fade-in">
      
      {/* LEFT COLUMN: Catalog / Product Selection (Flexible Grid) */}
      <div style={{ flex: 1.8, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header and filters */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Register Terminal</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Total items active: <strong>{products.length}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                id="pos-search-input"
                type="text"
                placeholder="Search products by title, details or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              />
              <span style={{ position: 'absolute', left: '16px', top: '13px', fontSize: '1rem', color: 'var(--text-muted)' }}>🔍</span>
            </div>
          </div>

          {/* Category badges */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            {categories.map(category => (
              <button
                key={category}
                id={`category-${category.toLowerCase()}`}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  backgroundColor: selectedCategory === category ? 'var(--primary-color)' : 'var(--glass-card-bg)',
                  color: selectedCategory === category ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dotted rgba(255,255,255,0.08)', borderRadius: '16px' }}>
            <span style={{ fontSize: '3rem', marginBottom: '10px' }}>📦</span>
            <p style={{ color: 'var(--text-muted)' }}>No products match your criteria.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 240px)',
            paddingRight: '6px'
          }}>
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const lowStock = product.stock > 0 && product.stock <= 5;
              
              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => !outOfStock && addToCart(product)}
                  style={{
                    backgroundColor: 'var(--glass-card-bg)',
                    border: '1px solid var(--glass-card-border)',
                    borderRadius: '16px',
                    padding: '16px',
                    cursor: outOfStock ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: outOfStock ? 0.5 : 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!outOfStock) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.backgroundColor = 'var(--input-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--glass-card-border)';
                    e.currentTarget.style.backgroundColor = 'var(--glass-card-bg)';
                  }}
                >
                  {/* Category Pill */}
                  {product.category && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.62rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)'
                    }}>
                      {product.category}
                    </span>
                  )}

                  {/* Thumbnail / Image placeholder */}
                  <div style={{
                    height: '110px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                    ) : (
                      <span style={{ fontSize: '2rem' }}>🍎</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '0.95rem', margin: '0 0 6px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </h3>

                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    margin: '0 0 12px 0',
                    lineHeight: '1.3',
                    flexGrow: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {product.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                      {product.price.toFixed(2)} FCFA
                    </span>
                    
                    {/* Stock status indicator */}
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      color: outOfStock ? 'var(--color-danger)' : lowStock ? 'var(--color-warning)' : 'var(--color-success)',
                    }}>
                      {outOfStock ? 'Out of stock' : lowStock ? `Only ${product.stock} left` : `${product.stock} units`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Interactive Shopping Cart (POS Side Drawer) */}
      <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column' }}>
        <Card
          title="Shopping Cart"
          subtitle="Customer selection ledger"
          style={{ height: '100%', background: 'var(--bg-sidebar)', border: '1px solid var(--border-sidebar)' }}
          actions={
            cart.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Clear Cart
              </button>
            )
          }
        >
          {checkoutError && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: 'var(--color-danger)',
              fontSize: '0.8rem',
              marginBottom: '16px',
              lineHeight: 1.4
            }}>
              ⚠️ {checkoutError}
            </div>
          )}

          {/* Cart item list */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🛒</span>
                <p style={{ fontSize: '0.85rem' }}>Basket is empty. Select products to begin.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      backgroundColor: 'var(--glass-card-bg)',
                      border: '1px solid var(--glass-card-border)',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h4 style={{ fontSize: '0.85rem', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.product.name}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {item.product.price.toFixed(2)} FCFA each
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.product.stock)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: '1px solid var(--glass-card-border)',
                          backgroundColor: 'var(--glass-card-bg)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}
                      >
                        -
                      </button>
                      
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0, item.product.stock)}
                        style={{
                          width: '40px',
                          padding: '2px',
                          textAlign: 'center',
                          backgroundColor: 'var(--glass-card-bg)',
                          border: '1px solid var(--glass-card-border)',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)'
                        }}
                      />

                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.product.stock)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: '1px solid var(--glass-card-border)',
                          backgroundColor: 'var(--glass-card-bg)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '60px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>
                        {(item.product.price * item.quantity).toFixed(2)} FCFA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing breakdowns & Checkout actions */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span>{cartTotal.toFixed(2)} FCFA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tax (0%)</span>
              <span>0.00 FCFA</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.25rem',
              fontWeight: '800',
              borderTop: '1px dotted var(--border-sidebar)',
              paddingTop: '12px',
              marginBottom: '10px'
            }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent-color)' }}>{cartTotal.toFixed(2)} FCFA</span>
            </div>

            <Button
              id="checkout-submit-btn"
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              loading={checkoutLoading}
            >
              Process Transaction
            </Button>
          </div>
        </Card>
      </div>

      {/* RECEIPT POPUP MODAL (Visual Confirmation) */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="🧾 Transaction Successful"
        footer={
          <Button onClick={() => setIsCheckoutModalOpen(false)} variant="primary">
            Done
          </Button>
        }
      >
        {receipt && (
          <div style={{
            fontFamily: 'monospace',
            backgroundColor: 'var(--bg-sidebar)',
            color: 'var(--text-primary)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-sidebar)',
            fontSize: '0.85rem',
            lineHeight: 1.5
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'inherit', margin: '0 0 4px 0' }}>
                SMART RETAIL TERMINAL
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Transaction Receipt
              </p>
            </div>

            <p style={{ margin: '0 0 4px 0' }}><strong>RECEIPT ID:</strong> #{receipt.id}</p>
            <p style={{ margin: '0 0 16px 0' }}><strong>DATE:</strong> {new Date(receipt.created_at).toLocaleString()}</p>
            
            <div style={{ borderBottom: '1px dashed var(--border-sidebar)', marginBottom: '12px' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {receipt.items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.product_name || `Product #${item.product_id}`} (x{item.quantity})</span>
                  <span>{(item.unit_price * item.quantity).toFixed(2)} FCFA</span>
                </div>
              ))}
            </div>

            <div style={{ borderBottom: '1px dashed var(--border-sidebar)', marginBottom: '12px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              <span>TOTAL AMOUNT</span>
              <span>{receipt.total_amount.toFixed(2)} FCFA</span>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Thank you for shopping with us!
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Storefront;