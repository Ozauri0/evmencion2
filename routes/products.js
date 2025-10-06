const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // lo uso para verificar tokens JWT

// In-memory store for demo purposes
const products = new Map();

// Generar id simple. Si la versión de node tiene randomUUID lo uso, si no, hago un fallback.
function generateId() {
  //  esto sirve para hacer ids
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(12).toString('hex');
}

// ==================== middleware para proteger POST ====================
// Reglas: aceptar un JWT firmado con 'secreto123' o aceptar simple token 'secreto123'
// Esto lo hice así porque me pareció más fácil para probar desde curl sin crear token.
const SECRET = 'secreto123';
function requireBearer(req, res, next) {
  // leo la cabecera Authorization
  const header = req.header('Authorization') || '';

  // si no empieza con Bearer, rechazo
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing Authorization header' });
  }

  // saco el token
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Empty token' });
  }

  // fallback práctico: si el token es la palabra secreta lo dejo pasar
  if (token === SECRET) {
    console.log('[auth] token literal usado (secreto123)');
    return next();
  }

  // si no, intento verificar como JWT. Si falla, rechazo.
  try {
    const decoded = jwt.verify(token, SECRET);
    // guardo info en req.user por si la quiero usar 
    req.user = decoded;
    console.log('[auth] JWT verificado, payload:', decoded);
    return next();
  } catch (err) {
    // si el token es inválido o expiró
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}

// ==================== validaciones básicas del payload ====================
// Devuelve { valid: true } o { valid: false, error: {...} }
function validateProductPayload(payload, requireName = true) {
  // checar que venga un objeto
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: { error: 'VALIDATION_ERROR', message: 'Body must be a JSON object' } };
  }

  // name: obligatorio (si requireName)
  const name = payload.name !== undefined ? String(payload.name).trim() : '';
  if (requireName && !name) {
    return { valid: false, error: { error: 'NAME_REQUIRED', message: 'name is required' } };
  }

  // price: obligatorio y >= 0
  if (payload.price === undefined) {
    return { valid: false, error: { error: 'PRICE_INVALID', message: 'price is required' } };
  }
  const price = Number(payload.price);
  if (Number.isNaN(price) || price < 0) {
    return { valid: false, error: { error: 'PRICE_INVALID', message: 'price must be a number >= 0' } };
  }

  // stock: opcional pero si viene debe ser >=0
  if (payload.stock !== undefined) {
    const stock = Number(payload.stock);
    if (Number.isNaN(stock) || stock < 0) {
      return { valid: false, error: { error: 'STOCK_INVALID', message: 'stock must be a number >= 0' } };
    }
  }

  // si todo bien
  return { valid: true };
}

// ==================== RUTAS REST ====================

// GET /products -> lista todos los productos
router.get('/products', (req, res) => {
  // convierto el Map a array
  const all = Array.from(products.values());
  return res.status(200).json(all);
});

// GET /products/:id -> ver producto por id
router.get('/products/:id', (req, res) => {
  const { id } = req.params;
  const p = products.get(id);
  if (!p) {
    // no lo encontramos
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
  }
  return res.status(200).json(p);
});

// POST /products -> crear nuevo producto (protegido)
router.post('/products', requireBearer, (req, res) => {
  const payload = req.body;

  // valido payload
  const v = validateProductPayload(payload, true);
  if (!v.valid) {
    return res.status(400).json(v.error);
  }

  // creo id y el objeto producto
  const id = generateId();
  const product = {
    id: id,
    name: String(payload.name).trim(),
    price: Number(payload.price),
    stock: payload.stock !== undefined ? Number(payload.stock) : 0,
    description: payload.description ? String(payload.description) : undefined,
  };

  // lo guardo en el Map
  products.set(id, product);

  // devuelvo 201 created
  return res.status(201).json(product);
});

// PUT /products/:id -> reemplazo completo
router.put('/products/:id', (req, res) => {
  const { id } = req.params;

  // verificar que exista
  if (!products.has(id)) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
  }

  const payload = req.body;
  const v = validateProductPayload(payload, true);
  if (!v.valid) return res.status(400).json(v.error);

  const product = {
    id: id,
    name: String(payload.name).trim(),
    price: Number(payload.price),
    stock: payload.stock !== undefined ? Number(payload.stock) : 0,
    description: payload.description ? String(payload.description) : undefined,
  };

  products.set(id, product);
  return res.status(200).json(product);
});

// PATCH /products/:id -> actualización parcial
router.patch('/products/:id', (req, res) => {
  const { id } = req.params;
  const existing = products.get(id);
  if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });

  const payload = req.body || {};

  // validación parcial: reutilizo la misma función pero con requireName = false
  const v = validateProductPayload(payload, false);
  if (!v.valid) return res.status(400).json(v.error);

  // hago merge simple
  const updated = Object.assign({}, existing);
  if (payload.name !== undefined) updated.name = String(payload.name).trim();
  if (payload.price !== undefined) updated.price = Number(payload.price);
  if (payload.stock !== undefined) updated.stock = Number(payload.stock);
  if (payload.description !== undefined) updated.description = payload.description ? String(payload.description) : undefined;

  products.set(id, updated);
  return res.status(200).json(updated);
});

// DELETE /products/:id -> eliminar
router.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  const existed = products.delete(id);
  if (!existed) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
  return res.status(200).json({ ok: true });
});

// exportar el router para usar en app.js
module.exports = router;
