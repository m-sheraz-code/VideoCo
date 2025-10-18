import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import serverless from 'serverless-http';
import { createMondayWebhook } from './lib/createwebhook';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

app.post('/api/init-webhook', async (req, res) => {
  try {
    await createMondayWebhook();
    res.json({ message: 'Webhook created' });
  } catch (err) {
    console.error('Webhook failed:', err);
    res.status(500).send('Failed');
  }
});

export const handler = serverless(app);