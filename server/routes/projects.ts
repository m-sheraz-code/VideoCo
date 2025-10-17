import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────
// MULTER CONFIG
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

// ─────────────────────────────────────────────
// VERIFY TOKEN
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
// MONDAY TASK CREATION
// ─────────────────────────────────────────────
interface CreateMondayResponse {
  data?: { create_item: { id: string } };
  errors?: any;
}

const createMondayTask = async (
  projectName: string,
  priority: string,
  fileUrl: string | null,
  fileName: string | null): Promise<string | null> => {
  const mutation = `
    mutation ($projectName: String!, $priority: String!, $fileUrl: String, $fileName: String) {
      create_item (
        board_id: ${process.env.MONDAY_BOARD_ID},
        item_name: $projectName,
        column_values: "{\"${process.env.MONDAY_PRIORITY_COL_ID}\": {\"label\": \"$priority\"}, \"${process.env.MONDAY_FILE_COL_ID}\": {\"url\": \"$fileUrl\", \"text\": \"$fileName\"}}"
      ) {
        id
      }
    }
  `;
  try {
    const response = await axios.post<CreateMondayResponse>(
      'https://api.monday.com/v2',
      {
        query: mutation,
        variables: { projectName, priority, fileUrl, fileName },
      },
      {
        headers: {  
          Authorization: process.env.MONDAY_API_KEY || '',
          'Content-Type': 'application/json',
        },
      }
    );
    if (response.data.errors) {
      console.error('Monday API errors:', response.data.errors);
      return null;
    }
    return response.data.data?.create_item.id || null;
  }
  catch (err) {
    console.error('Error creating Monday task:', err);
    return null;
  }
};


// ─────────────────────────────────────────────
// MONDAY WEBHOOK
// ─────────────────────────────────────────────
router.post('/monday/webhook', async (req: Request, res: Response) => {
  try {
    const event = req.body;

    if (event?.challenge) {
      return res.json({ challenge: event.challenge });
    }

    const itemId =
      event?.event?.itemId ||
      event?.event?.pulseId ||
      event?.payload?.inboundFieldValues?.pulseId;

    if (!itemId) {
      console.error('No item ID found in payload');
      return res.status(400).json({ error: 'Missing itemId/pulseId' });
    }

    const query = `
      query ($itemId: ID!) {
        items (ids: [$itemId]) {
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
      {
        query,
        variables: { itemId: String(itemId) },
      },
      {
        headers: {
          Authorization: process.env.MONDAY_API_KEY || '',
          'Content-Type': 'application/json',
        },
      }
    );

    const item = response?.data?.data?.items?.[0];
    if (!item) return res.sendStatus(404);

    const columns: Record<string, string> = {};
    for (const col of item.column_values || []) {
      columns[col.id] = col.text;
    }

    const updates: Record<string, any> = {};

    if (process.env.MONDAY_NAME_COL_ID && columns[process.env.MONDAY_NAME_COL_ID]) {
      updates.project_name = columns[process.env.MONDAY_NAME_COL_ID];
    }

    if (process.env.MONDAY_STATUS_COL_ID && columns[process.env.MONDAY_STATUS_COL_ID]) {
      updates.status = columns[process.env.MONDAY_STATUS_COL_ID];
    }

    if (process.env.MONDAY_PRIORITY_COL_ID && columns[process.env.MONDAY_PRIORITY_COL_ID]) {
      updates.priority = columns[process.env.MONDAY_PRIORITY_COL_ID];
    }

    if (process.env.MONDAY_DUEDATE_COL_ID && columns[process.env.MONDAY_DUEDATE_COL_ID]) {
      updates.due_date = columns[process.env.MONDAY_DUEDATE_COL_ID];
    }

    if (process.env.MONDAY_GRANT_ACCESS_COL_ID && columns[process.env.MONDAY_GRANT_ACCESS_COL_ID]) {
      updates.view_access = columns[process.env.MONDAY_GRANT_ACCESS_COL_ID] === 'true';
    }


    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('monday_task_id', String(item.id));

      if (error) console.error('Supabase update error:', error);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('Monday webhook error:', err);
    return res.sendStatus(500);
  }
});

// ─────────────────────────────────────────────
// ADD PROJECT ROUTE
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

    const mondayTaskId = await createMondayTask(projectName, priority, fileUrl, fileName);

    if (mondayTaskId) {
      await supabase
        .from('projects')
        .update({ monday_task_id: mondayTaskId })
        .eq('id', newProject.id);
    } else {
      console.warn('Monday task not created for project:', newProject.id);
    }

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
