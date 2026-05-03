import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

router.get('/:clientId', (req: Request, res: Response) => {
  const { clientId } = req.params;

  // Prevent path traversal
  if (!/^[a-z0-9-]+$/.test(clientId)) {
    res.status(400).json({ error: 'Invalid client ID' });
    return;
  }

  const configPath = path.join(__dirname, '../data/clients', `${clientId}.json`);

  if (!fs.existsSync(configPath)) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  res.json(config);
});

export default router;
