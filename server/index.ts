import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import { createMondayWebhook } from './lib/mondayWebhook';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/project-files', express.static('project-files'));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

(async () => {
  await createMondayWebhook();
})();

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
