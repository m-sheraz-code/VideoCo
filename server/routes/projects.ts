import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

const verifyToken = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.body.userId = user.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const createMondayTask = async (projectName: string, priority: string, fileUrl: string) => {
  try {
    const mondayApiKey = process.env.MONDAY_API_KEY;
    const boardId = process.env.MONDAY_BOARD_ID;

    if (!mondayApiKey || !boardId) {
      console.error('Monday.com credentials not configured');
      return null;
    }

    const priorityMap: { [key: string]: string } = {
      'Low': 'low',
      'Medium': 'medium',
      'High': 'high'
    };

    const mutation = `
      mutation {
        create_item (
          board_id: ${boardId},
          item_name: "${projectName}",
          column_values: "{\\"status\\":\\"Submitted\\", \\"priority\\":\\"${priorityMap[priority] || 'medium'}\\", \\"text\\":\\"${fileUrl}\\"}"
        ) {
          id
        }
      }
    `;

    const response = await axios.post(
      'https://api.monday.com/v2',
      { query: mutation },
      {
        headers: {
          'Authorization': mondayApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      console.error('Monday.com API error:', response.data.errors);
      return null;
    }

    return response.data.data.create_item.id;
  } catch (error) {
    console.error('Error creating Monday.com task:', error);
    return null;
  }
};

router.post('/add', verifyToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { projectName, priority, userId } = req.body;
    const file = req.file;

    if (!projectName || !priority) {
      return res.status(400).json({ error: 'Project name and priority are required' });
    }

    let fileUrl = null;
    let fileName = null;

    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      fileName = file.originalname;
    }

    const mondayTaskId = await createMondayTask(
      projectName,
      priority,
      fileUrl ? `${process.env.SUPABASE_URL}${fileUrl}` : 'No file uploaded'
    );

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        project_name: projectName,
        priority,
        status: 'Submitted',
        file_url: fileUrl,
        file_name: fileName,
        monday_task_id: mondayTaskId,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Project created successfully', project: data });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/list', verifyToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ projects: data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('file_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.file_url) {
      const filePath = path.join(process.cwd(), project.file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
