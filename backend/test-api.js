const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: '9fb7f9d1-3114-49d4-87cf-fdb9843ce03e', role: 'SITE_MANAGER' }, process.env.JWT_SECRET || 'fallback_secret');

fetch('http://localhost:5001/api/users', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json().then(data => ({ status: r.status, data })))
.then(console.log)
.catch(console.error);
