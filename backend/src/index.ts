import express from 'express';
import cors from 'cors';
import { initDb } from './db/sqlite';
import bookingsRouter from './routes/bookings';
import configRouter from './routes/config';

const app = express();
const PORT = process.env.PORT || 3001;

// Allowlist: local dev origins + optional FRONTEND_URL set in Render environment
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter((o): o is string => Boolean(o));

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin header (curl, Postman, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" is not allowed`));
      }
    },
  })
);

app.use(express.json());

app.use('/api/bookings', bookingsRouter);
app.use('/api/config', configRouter);

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
