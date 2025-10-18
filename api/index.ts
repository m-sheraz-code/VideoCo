import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import authRoutes from '../server/routes/auth';
import projectRoutes from '../server/routes/projects';
import { createMondayWebhook } from '../server/lib/createwebhook';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

(async () => {
  await createMondayWebhook();
})();

export const handler = serverless(app);
