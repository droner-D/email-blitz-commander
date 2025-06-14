
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SMTPConfig } from '../types';
import { Database } from '../database/Database';
import { TestManager } from '../services/TestManager';
import Joi from 'joi';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'recipients') {
      // Accept text files for recipient lists
      if (file.mimetype === 'text/plain' || file.mimetype === 'text/csv') {
        cb(null, true);
      } else {
        cb(new Error('Only .txt and .csv files are allowed for recipient lists'));
      }
    } else if (file.fieldname === 'attachment') {
      // Accept common attachment types
      cb(null, true);
    } else {
      cb(new Error('Invalid file field'));
    }
  }
});

// Validation schemas
const smtpConfigSchema = Joi.object({
  server: Joi.string().required(),
  port: Joi.number().integer().min(1).max(65535).required(),
  username: Joi.string().allow(''),
  password: Joi.string().allow(''),
  useAuth: Joi.boolean().required(),
  useSSL: Joi.boolean().required(),
  subject: Joi.string().required(),
  message: Joi.string().required(),
  recipients: Joi.array().items(Joi.string().email()).min(1).required(),
  threads: Joi.number().integer().min(1).max(100).required(),
  emailsPerThread: Joi.number().integer().min(1).required(),
  delay: Joi.number().integer().min(0).required()
});

export function createApiRoutes(db: Database, testManager: TestManager) {
  // Get all SMTP configurations
  router.get('/configs', async (req, res) => {
    try {
      const configs = await db.getConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching configs:', error);
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  // Save SMTP configuration
  router.post('/configs', async (req, res) => {
    try {
      const { error, value } = smtpConfigSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const configId = await db.saveConfig(value);
      res.json({ id: configId, message: 'Configuration saved successfully' });
    } catch (error) {
      console.error('Error saving config:', error);
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  });

  // Start load test
  router.post('/tests/start', async (req, res) => {
    try {
      const { error, value } = smtpConfigSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const testId = await testManager.startTest(value);
      res.json({ testId, message: 'Load test started successfully' });
    } catch (error) {
      console.error('Error starting test:', error);
      res.status(500).json({ error: 'Failed to start load test' });
    }
  });

  // Stop load test
  router.post('/tests/:testId/stop', async (req, res) => {
    try {
      const { testId } = req.params;
      await testManager.stopTest(testId);
      res.json({ message: 'Test stopped successfully' });
    } catch (error) {
      console.error('Error stopping test:', error);
      res.status(500).json({ error: 'Failed to stop test' });
    }
  });

  // Pause/Resume load test
  router.post('/tests/:testId/pause', async (req, res) => {
    try {
      const { testId } = req.params;
      await testManager.pauseTest(testId);
      res.json({ message: 'Test paused successfully' });
    } catch (error) {
      console.error('Error pausing test:', error);
      res.status(500).json({ error: 'Failed to pause test' });
    }
  });

  router.post('/tests/:testId/resume', async (req, res) => {
    try {
      const { testId } = req.params;
      await testManager.resumeTest(testId);
      res.json({ message: 'Test resumed successfully' });
    } catch (error) {
      console.error('Error resuming test:', error);
      res.status(500).json({ error: 'Failed to resume test' });
    }
  });

  // Get test results
  router.get('/tests/results', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const results = await db.getTestResults(limit);
      res.json(results);
    } catch (error) {
      console.error('Error fetching test results:', error);
      res.status(500).json({ error: 'Failed to fetch test results' });
    }
  });

  // Get specific test result
  router.get('/tests/:testId/result', async (req, res) => {
    try {
      const { testId } = req.params;
      const result = await db.getTestResult(testId);
      if (!result) {
        return res.status(404).json({ error: 'Test result not found' });
      }
      res.json(result);
    } catch (error) {
      console.error('Error fetching test result:', error);
      res.status(500).json({ error: 'Failed to fetch test result' });
    }
  });

  // Get active tests
  router.get('/tests/active', (req, res) => {
    try {
      const activeTests = testManager.getActiveTests();
      res.json(activeTests);
    } catch (error) {
      console.error('Error fetching active tests:', error);
      res.status(500).json({ error: 'Failed to fetch active tests' });
    }
  });

  // File upload endpoints
  router.post('/upload/recipients', upload.single('recipients'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse recipients from file
      const recipients = fileContent
        .split(/[\n,;]/)
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({ recipients });
    } catch (error) {
      console.error('Error processing recipient file:', error);
      res.status(500).json({ error: 'Failed to process recipient file' });
    }
  });

  router.post('/upload/attachment', upload.single('attachment'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      res.json({ 
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      });
    } catch (error) {
      console.error('Error uploading attachment:', error);
      res.status(500).json({ error: 'Failed to upload attachment' });
    }
  });

  return router;
}
