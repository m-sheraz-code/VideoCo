import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import { createMondayWebhook } from './lib/mondayWebhook';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'Missing');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Automatically create webhook on startup
  await createMondayWebhook();
});
