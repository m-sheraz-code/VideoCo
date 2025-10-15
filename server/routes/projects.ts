import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import axios from 'axios';
import path from 'path';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────
// MULTER CONFIG (store file in memory)
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
});

// ─────────────────────────────────────────────
// VERIFY TOKEN MIDDLEWARE
// ─────────────────────────────────────────────
const verifyToken = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    (req as any).userId = user.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ─────────────────────────────────────────────
// MONDAY TASK CREATION HELPER
// ─────────────────────────────────────────────
interface CreateMondayResponse {
  data?: { create_item: { id: string } };
  errors?: any;
}

export const createMondayTask = async (
  projectName: string,
  priority: string,
  fileUrl: string | null,
  fileName: string | null,
  dueDate?: string
): Promise<string | null> => {
  const mondayApiKey = process.env.MONDAY_API_KEY;
  const boardId = Number(process.env.MONDAY_BOARD_ID);

  if (!mondayApiKey || !boardId) {
    console.error('Missing Monday API key or board ID');
    return null;
  }

  const nameColumnId = process.env.MONDAY_NAME_COL_ID!;
  const statusColumnId = process.env.MONDAY_STATUS_COL_ID!;
  const priorityColumnId = process.env.MONDAY_PRIORITY_COL_ID!;
  const fileColumnId = process.env.MONDAY_FILE_COL_ID!;
  const dueDateColumnId = process.env.MONDAY_DUEDATE_COL_ID!;

  const priorityMap: Record<string, string> = {
    Low: 'Low',
    Medium: 'Medium',
    High: 'High',
  };

  const colVals: Record<string, any> = {
    [nameColumnId]: projectName,
    [statusColumnId]: { label: 'Submitted' },
    [priorityColumnId]: { label: priorityMap[priority] || 'Medium' },
  };

  if (fileUrl && fileName)
    colVals[fileColumnId] = { url: fileUrl, text: fileName };

  if (dueDate)
    colVals[dueDateColumnId] = dueDate;

  const mutation = `
    mutation CreateItem($boardId: Int!, $itemName: String!, $colVals: JSON!) {
      create_item(board_id: $boardId, item_name: $itemName, column_values: $colVals) {
        id
      }
    }
  `;

  try {
    const response = await axios.post<CreateMondayResponse>(
      'https://api.monday.com/v2',
      { query: mutation, variables: { boardId, itemName: projectName, colVals } },
      { headers: { Authorization: mondayApiKey, 'Content-Type': 'application/json' } }
    );

    if (response.data.errors) {
      console.error('Monday API error:', response.data.errors);
      return null;
    }

    return response.data.data?.create_item.id || null;
  } catch (err: any) {
    console.error('Axios / Monday request error:', err.response?.data || err.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// MONDAY WEBHOOK
// ─────────────────────────────────────────────
router.post('/monday/webhook', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    if (event.challenge) return res.json({ challenge: event.challenge });

    const itemId = event.event?.itemId || event.event?.pulseId;
    if (!itemId) return res.sendStatus(400);

    const query = `
      query ($itemId: [Int]) {
        items(ids: $itemId) {
          id
          name
          column_values {
            id
            text
          }
        }
      }
    `;

    const response = await axios.post(
      'https://api.monday.com/v2',
      { query, variables: { itemId: Number(itemId) } },
      {
        headers: {
          Authorization: process.env.MONDAY_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );

    const item = response.data.data.items[0];
    if (!item) return res.sendStatus(404);

    const columns = Object.fromEntries(
      item.column_values.map((col: any) => [col.id, col.text])
    );

    const updates: Record<string, any> = {};

    if (process.env.MONDAY_NAME_COL_ID && columns[process.env.MONDAY_NAME_COL_ID])
      updates.project_name = columns[process.env.MONDAY_NAME_COL_ID];

    if (process.env.MONDAY_STATUS_COL_ID && columns[process.env.MONDAY_STATUS_COL_ID])
      updates.status = columns[process.env.MONDAY_STATUS_COL_ID];

    if (process.env.MONDAY_PRIORITY_COL_ID && columns[process.env.MONDAY_PRIORITY_COL_ID])
      updates.priority = columns[process.env.MONDAY_PRIORITY_COL_ID];

    if (process.env.MONDAY_DUEDATE_COL_ID && columns[process.env.MONDAY_DUEDATE_COL_ID])
      updates.due_date = columns[process.env.MONDAY_DUEDATE_COL_ID];

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('monday_task_id', item.id);

      if (error) console.error('Supabase update error:', error);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Monday webhook error:', err);
    res.sendStatus(500);
  }
});

// ─────────────────────────────────────────────
// ADD PROJECT ROUTE (UPLOAD → SAVE → CREATE MONDAY TASK)
// ─────────────────────────────────────────────
router.post('/add', verifyToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { projectName, priority } = req.body;
    const userId = (req as any).userId;
    const file = req.file;

    if (!projectName || !priority)
      return res.status(400).json({ error: 'Project name and priority required' });

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    // ─── Upload file to Supabase bucket ───
    if (file) {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      const { error } = await supabase.storage
        .from('project-files')
        .upload(uniqueName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return res.status(500).json({ error: 'File upload failed' });
      }

      const { data: publicUrlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(uniqueName);

      fileUrl = publicUrlData.publicUrl;
      fileName = file.originalname;
    }

    // ─── Step 1: Insert project record in Supabase ───
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        project_name: projectName,
        priority,
        status: 'Submitted',
        file_url: fileUrl,
        file_name: fileName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    // ─── Step 2: Create Monday task after successful insert ───
    const mondayTaskId = await createMondayTask(projectName, priority, fileUrl, fileName);

    if (mondayTaskId) {
      await supabase
        .from('projects')
        .update({ monday_task_id: mondayTaskId })
        .eq('id', newProject.id);
    } else {
      console.warn('Monday task not created for project:', newProject.id);
    }

    // ─── Step 3: Return final response ───
    return res.json({
      message: 'Project created successfully',
      project: { ...newProject, monday_task_id: mondayTaskId },
    });
  } catch (err) {
    console.error('Error /add endpoint:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
