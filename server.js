const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Create tables and insert mock data
db.serialize(() => {
  db.run(`CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT,
    description TEXT
  )`);

  db.run(`CREATE TABLE cart (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    addedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert mock products
  const products = [
    { id: '1', name: 'Wireless Headphones', price: 99.99, image: '/images/headphones.jpg', description: 'High-quality wireless headphones' },
    { id: '2', name: 'Smartphone', price: 699.99, image: '/images/phone.jpg', description: 'Latest smartphone model' },
    { id: '3', name: 'Laptop', price: 1299.99, image: '/images/laptop.jpg', description: 'Powerful gaming laptop' },
    { id: '4', name: 'Smart Watch', price: 249.99, image: '/images/watch.jpg', description: 'Feature-rich smartwatch' },
    { id: '5', name: 'Tablet', price: 449.99, image: '/images/tablet.jpg', description: '10-inch tablet' }
  ];

  const stmt = db.prepare("INSERT INTO products (id, name, price, image, description) VALUES (?, ?, ?, ?, ?)");
  products.forEach(product => {
    stmt.run(product.id, product.name, product.price, product.image, product.description);
  });
  stmt.finalize();
});

// Routes
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/cart', (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!productId || !quantity) {
    return res.status(400).json({ error: 'productId and quantity are required' });
  }

  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.get("SELECT * FROM cart WHERE productId = ?", [productId], (err, existingItem) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        db.run("UPDATE cart SET quantity = ? WHERE productId = ?", [newQuantity, productId], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Cart updated successfully', cartItemId: existingItem.id });
        });
      } else {
        const cartItemId = uuidv4();
        db.run("INSERT INTO cart (id, productId, quantity) VALUES (?, ?, ?)", 
          [cartItemId, productId, quantity], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Item added to cart', cartItemId });
        });
      }
    });
  });
});

app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM cart WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    res.json({ message: 'Item removed from cart' });
  });
});

app.get('/api/cart', (req, res) => {
  db.all(`
    SELECT 
      c.id as cartItemId,
      c.quantity,
      p.id,
      p.name,
      p.price,
      p.image,
      p.description
    FROM cart c
    JOIN products p ON c.productId = p.id
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const total = rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({
      items: rows,
      total: parseFloat(total.toFixed(2)),
      itemCount: rows.reduce((count, item) => count + item.quantity, 0)
    });
  });
});

app.post('/api/checkout', (req, res) => {
  const { cartItems, customerInfo } = req.body;

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart items are required' });
  }

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const receipt = {
    orderId: uuidv4(),
    timestamp: new Date().toISOString(),
    customerInfo: customerInfo || {},
    items: cartItems,
    total: parseFloat(total.toFixed(2)),
    tax: parseFloat((total * 0.08).toFixed(2)),
    grandTotal: parseFloat((total * 1.08).toFixed(2))
  };

  db.run("DELETE FROM cart", (err) => {
    if (err) {
      console.error('Error clearing cart:', err);
    }
  });

  res.json(receipt);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 API available at http://localhost:${PORT}/api`);
});