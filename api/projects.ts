import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import projectRoutes from '../server/routes/projects';
import { createMondayWebhook } from '../server/lib/createwebhook';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/projects', projectRoutes);

// OPTIONAL: Trigger webhook once per cold start
(async () => {
  try {
    await createMondayWebhook();
  } catch (err) {
    console.error("Webhook setup failed:", err);
  }
})();

export default serverless(app);
