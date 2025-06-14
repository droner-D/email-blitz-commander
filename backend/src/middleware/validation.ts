
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateSMTPConfig = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    server: Joi.string().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    username: Joi.string().allow(''),
    password: Joi.string().allow(''),
    fromEmail: Joi.string().email().allow(''),
    useAuth: Joi.boolean().required(),
    useSSL: Joi.boolean().required(),
    subject: Joi.string().required(),
    message: Joi.string().required(),
    recipients: Joi.array().items(Joi.string().email()).min(1).required(),
    threads: Joi.number().integer().min(1).max(100).required(),
    emailsPerThread: Joi.number().integer().min(1).max(1000).required(),
    delay: Joi.number().integer().min(0).required(),
    attachmentPath: Joi.string().optional(),
    customHeaders: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    testMode: Joi.string().valid('count', 'duration', 'continuous').required(),
    totalEmails: Joi.when('testMode', {
      is: 'count',
      then: Joi.number().integer().min(1).required(),
      otherwise: Joi.number().integer().min(1).optional()
    }),
    duration: Joi.when('testMode', {
      is: 'duration',
      then: Joi.number().integer().min(1).required(),
      otherwise: Joi.number().integer().min(1).optional()
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

export const validateTestId = (req: Request, res: Response, next: NextFunction) => {
  const { testId } = req.params;
  
  if (!testId || typeof testId !== 'string') {
    return res.status(400).json({ error: 'Valid test ID is required' });
  }

  next();
};
