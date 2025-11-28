const express = require('express');
const cors = require('cors');
const session = require('express-session');
const ventaRoutes = require('./routes/ventaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const fiadoRoutes = require('./routes/fiadoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Confía en proxy si estás en producción
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS: permite múltiples orígenes
const allowedOrigins = [
  'http://localhost:5173',
  'https://agilefront-lab-gamma.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: 'tu_secreto_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // por ejemplo, 1 día
  }
}));

app.use('/api', ventaRoutes);
app.use('/api', productoRoutes);
app.use('/api', clienteRoutes);
app.use('/api', usuarioRoutes);
app.use('/api', reporteRoutes);
app.use('/api', fiadoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
