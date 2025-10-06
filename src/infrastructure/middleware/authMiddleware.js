const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Token requerido');
  try {
    jwt.verify(token, 'secreto123');
    next();
  } catch {
    res.status(403).send('Token inválido');
  }
};

module.exports = authenticate;
