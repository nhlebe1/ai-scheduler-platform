import { Router, Request, Response } from 'express';
import { queryAll, runWrite } from '../db/sqlite';
import { validateBooking } from '../validation/booking';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const clientId = req.query.clientId as string | undefined;
  const bookings = clientId
    ? queryAll('SELECT * FROM bookings WHERE client_id = ? ORDER BY created_at DESC', [clientId])
    : queryAll('SELECT * FROM bookings ORDER BY created_at DESC');
  res.json(bookings);
});

router.post('/', (req: Request, res: Response) => {
  const errors = validateBooking(req.body);
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  const { client_id, name, phone, email, service, address, slot } = req.body as {
    [k: string]: string;
  };

  const newId = runWrite(
    'INSERT INTO bookings (client_id, name, phone, email, service, address, slot) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [client_id.trim(), name.trim(), phone.trim(), email.trim(), service.trim(), address.trim(), slot.trim()]
  );

  const rows = queryAll('SELECT * FROM bookings WHERE id = ?', [newId]);
  res.status(201).json(rows[0]);
});

export default router;
