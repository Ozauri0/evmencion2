const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory store for demo purposes
const products = new Map();

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(12).toString('hex');
}

// Simple requireBearer middleware for POST only
const EXPECTED = 'secreto123';
function requireBearer(req, res, next) {
  const header = req.header('Authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing Authorization header' });
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token || token !== EXPECTED) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid bearer token' });
  }
  return next();
}

// Validation helpers
function validateProductPayload(payload, requireName = true) {
  if (!payload || typeof payload !== 'object') return { valid: false, error: { error: 'VALIDATION_ERROR', message: 'Body must be a JSON object' } };
  const name = payload.name && String(payload.name).trim();
  if (requireName && !name) return { valid: false, error: { error: 'NAME_REQUIRED', message: 'name is required' } };
  if (payload.price === undefined) return { valid: false, error: { error: 'PRICE_INVALID', message: 'price is required' } };
  const price = Number(payload.price);
  if (Number.isNaN(price) || price < 0) return { valid: false, error: { error: 'PRICE_INVALID', message: 'price must be a number >= 0' } };
  if (payload.stock !== undefined) {
    const stock = Number(payload.stock);
    if (Number.isNaN(stock) || stock < 0) return { valid: false, error: { error: 'STOCK_INVALID', message: 'stock must be a number >= 0' } };
  }
  return { valid: true };
}

// GET /products - list all
router.get('/products', (req, res) => {
  const all = Array.from(products.values());
  res.status(200).json(all);
});

// GET /products/:id - get by id
router.get('/products/:id', (req, res) => {
  const { id } = req.params;
  const p = products.get(id);
  if (!p) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
  res.status(200).json(p);
});

// POST /products - create (protected)
router.post('/products', requireBearer, (req, res) => {
  const payload = req.body;
  const v = validateProductPayload(payload, true);
  if (!v.valid) return res.status(400).json(v.error);

  const id = generateId();
  const product = {
    id,
    name: String(payload.name).trim(),
    price: Number(payload.price),
    stock: payload.stock !== undefined ? Number(payload.stock) : 0,
    description: payload.description ? String(payload.description) : undefined,
  };
  products.set(id, product);
  res.status(201).json(product);
});

// PUT /products/:id - replace
router.put('/products/:id', (req, res) => {
  const { id } = req.params;
  if (!products.has(id)) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
  const payload = req.body;
  const v = validateProductPayload(payload, true);
  if (!v.valid) return res.status(400).json(v.error);

  const product = {
    id,
    name: String(payload.name).trim(),
    price: Number(payload.price),
    stock: payload.stock !== undefined ? Number(payload.stock) : 0,
    description: payload.description ? String(payload.description) : undefined,
  };
  products.set(id, product);
  res.status(200).json(product);
});

// PATCH /products/:id - partial update
router.patch('/products/:id', (req, res) => {
  const { id } = req.params;
  const existing = products.get(id);
  if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
  const payload = req.body;
  // validate partial
  const v = validateProductPayload(payload, false);
  if (!v.valid) return res.status(400).json(v.error);

  const updated = { ...existing };
  if (payload.name !== undefined) updated.name = String(payload.name).trim();
  if (payload.price !== undefined) updated.price = Number(payload.price);
  if (payload.stock !== undefined) updated.stock = Number(payload.stock);
  if (payload.description !== undefined) updated.description = payload.description ? String(payload.description) : undefined;

  products.set(id, updated);
  res.status(200).json(updated);
});

// DELETE /products/:id - remove
router.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  const existed = products.delete(id);
  if (!existed) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
  res.status(200).json({ ok: true });
});

module.exports = router;
