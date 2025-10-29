import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0, itemCount: 0 });
  const [activeView, setActiveView] = useState('products');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId) => {
    try {
      await axios.post(`${API_BASE}/cart`, { productId, quantity: 1 });
      fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await axios.delete(`${API_BASE}/cart/${cartItemId}`);
      fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
      return;
    }

    try {
      const item = cart.items.find(item => item.cartItemId === cartItemId);
      if (item) {
        await axios.delete(`${API_BASE}/cart/${cartItemId}`);
        await axios.post(`${API_BASE}/cart`, { 
          productId: item.id, 
          quantity: newQuantity 
        });
        fetchCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/checkout`, {
        cartItems: cart.items,
        customerInfo
      });
      setReceipt(response.data);
      setShowReceipt(true);
      setShowCheckout(false);
      fetchCart();
    } catch (error) {
      console.error('Error during checkout:', error);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'white',
          fontSize: '1.5rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
            Loading Awesome Products...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <nav className="nav">
          <div className="logo">VibeCommerce</div>
          <div className="cart-icon" onClick={() => setActiveView('cart')}>
            🛒
            {cart.itemCount > 0 && (
              <span className="cart-count">{cart.itemCount}</span>
            )}
          </div>
        </nav>
      </header>

      <main>
        {activeView === 'products' && (
          <div>
            <div className="page-header">
              <h1>🎉 Awesome Products</h1>
              <p>Discover our curated collection of premium items</p>
            </div>
            <div className="products-grid">
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="product-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="product-image">
                    {product.id == '1' && '🎧'}
                    {product.id == '2' && '⌚'}
                    {product.id == '3' && '🎒'}
                    {product.id == '4' && '🔊'}
                    {product.id == '5' && '📱'}
                    {product.id == '6' && '🔌'}
                    {product.id == '7' && '🖱️'}
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">${product.price}</div>
                  <p className="product-description">{product.description}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => addToCart(product.id)}
                  >
                    🛒 Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'cart' && (
          <div>
            <div className="page-header">
              <h1>🛍️ Your Shopping Cart</h1>
              <p>Review your items and proceed to checkout</p>
            </div>
            
            {cart.items.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">🛒</div>
                <h2>Your cart is empty</h2>
                <p>Add some awesome products to get started!</p>
                <button 
                  className="btn btn-continue"
                  onClick={() => setActiveView('products')}
                  style={{ marginTop: '1rem' }}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div>
                {cart.items.map((item, index) => (
                  <div 
                    key={item.cartItemId} 
                    className="cart-item"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      <p>${item.price} each</p>
                    </div>
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.1rem' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button 
                      className="btn btn-danger"
                      onClick={() => removeFromCart(item.cartItemId)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '3rem',
                  padding: '2rem',
                  background: 'white',
                  borderRadius: '20px',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  <h2 style={{ 
                    fontSize: '2.5rem', 
                    color: 'var(--primary)',
                    marginBottom: '1rem'
                  }}>
                    Total: ${cart.total.toFixed(2)}
                  </h2>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCheckout(true)}
                    style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
                  >
                    🚀 Proceed to Checkout
                  </button>
                  <button 
                    className="btn btn-continue"
                    onClick={() => setActiveView('products')}
                    style={{ 
                      marginLeft: '1rem',
                      background: 'transparent',
                      border: '2px solid var(--primary)',
                      color: 'var(--primary)'
                    }}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {showCheckout && (
          <div className="modal">
            <div className="modal-content">
              <h2 style={{ 
                textAlign: 'center', 
                marginBottom: '2rem',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🎊 Complete Your Order
              </h2>
              <form onSubmit={handleCheckout}>
                <div className="form-group">
                  <label>👤 Your Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter your full name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>📧 Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="Enter your email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  />
                </div>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    ✅ Place Order
                  </button>
                  <button 
                    type="button" 
                    className="btn"
                    onClick={() => setShowCheckout(false)}
                    style={{ 
                      background: 'transparent',
                      border: '2px solid var(--text-light)',
                      color: 'var(--text-light)'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showReceipt && receipt && (
          <div className="modal">
            <div className="modal-content">
              <div className="receipt">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                  <h2>Order Confirmed!</h2>
                  <p style={{ color: 'var(--success)' }}>Thank you for your purchase!</p>
                </div>
                
                <div style={{ background: 'var(--light)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                  <p><strong>Order ID:</strong> {receipt.orderId}</p>
                  <p><strong>Date:</strong> {new Date(receipt.timestamp).toLocaleString()}</p>
                </div>
                
                <h3 style={{ marginBottom: '1rem' }}>Items:</h3>
                {receipt.items.map(item => (
                  <div key={item.id} className="receipt-item">
                    <span>{item.name} x {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="receipt-item">
                  <span>Subtotal:</span>
                  <span>${receipt.total.toFixed(2)}</span>
                </div>
                <div className="receipt-item">
                  <span>Tax (8%):</span>
                  <span>${receipt.tax.toFixed(2)}</span>
                </div>
                <div className="receipt-item receipt-total">
                  <span>Grand Total:</span>
                  <span>${receipt.grandTotal.toFixed(2)}</span>
                </div>
                
                <button 
                  className="btn btn-primary"
                  style={{ marginTop: '2rem', width: '100%' }}
                  onClick={() => {
                    setShowReceipt(false);
                    setActiveView('products');
                  }}
                >
                  🛍️ Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;